import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Badge, UserBadge } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  BADGE_RULES,
  LEADERBOARD_KEY_PREFIX,
  LEADERBOARD_TOP_N,
  type BadgeRule,
} from './achievement.constants';

/**
 * Public projection of a Badge row.
 */
export interface BadgeDto {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

/** A badge paired with the current user's award status. */
export interface BadgeWithStatusDto extends BadgeDto {
  awarded: boolean;
  awardedAt: string | null;
}

/** Result returned by POST /achievement/check. */
export interface CheckResultDto {
  newBadges: BadgeDto[];
  allBadges: BadgeDto[];
}

/** A single leaderboard entry. */
export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  nickname: string;
  avatar: string | null;
  score: number;
}

/** Result returned by GET /achievement/leaderboard. */
export interface LeaderboardDto {
  weekKey: string;
  topUsers: LeaderboardEntryDto[];
  currentUser: LeaderboardEntryDto | null;
}

/**
 * Aggregated user-metrics snapshot used to evaluate badge rules.
 * Computed once per `checkAndAwardBadges` call to avoid N+1 queries.
 */
interface UserMetrics {
  streakCount: number;
  completedLessons: number;
  postCount: number;
  perfectScoreCount: number;
  distinctLanguageCount: number;
}

/**
 * AchievementService: seeds badge definitions, evaluates badge rules against
 * user progress, awards UserBadge rows, and maintains the weekly leaderboard
 * ZSET in Redis.
 *
 * All badge rules are evaluated centrally inside `checkAndAwardBadges`. The
 * frontend is expected to invoke POST /achievement/check after key actions
 * (lesson completion, post creation, speaking attempt, etc.) so we don't need
 * to instrument every other module. The leaderboard, by contrast, IS updated
 * inline from ProgressService.completeLesson to keep scores fresh in real
 * time — that call goes through `updateLeaderboard` below.
 */
@Injectable()
export class AchievementService implements OnModuleInit {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Ensure every BADGE_RULES row exists in the `badges` table (idempotent). */
  async onModuleInit(): Promise<void> {
    await this.ensureBadgesSeeded();
  }

  // -----------------------------------------------------------------
  // Badge seeding
  // -----------------------------------------------------------------

  private async ensureBadgesSeeded(): Promise<void> {
    for (const rule of BADGE_RULES) {
      const existing = await this.prisma.badge.findUnique({
        where: { code: rule.code },
        select: { id: true, name: true },
      });
      if (!existing) {
        await this.prisma.badge.create({
          data: {
            code: rule.code,
            name: rule.name,
            description: rule.description,
            icon: rule.icon,
            category: rule.category,
          },
        });
        this.logger.log(`Seeded badge "${rule.code}"`);
      } else if (existing.name !== rule.name) {
        // Keep name/description/icon in sync with the rule definition in case
        // the constants file was updated. The `code` column is the immutable
        // identity; everything else is treated as copy.
        await this.prisma.badge.update({
          where: { code: rule.code },
          data: {
            name: rule.name,
            description: rule.description,
            icon: rule.icon,
            category: rule.category,
          },
        });
      }
    }
  }

  // -----------------------------------------------------------------
  // Badge awarding
  // -----------------------------------------------------------------

  /**
   * Evaluate every badge rule for `userId`, create UserBadge rows for any
   * rule whose threshold is met and for which no UserBadge exists yet, and
   * return both the freshly-awarded badges and the full set the user owns.
   */
  async checkAndAwardBadges(userId: string): Promise<CheckResultDto> {
    const metrics = await this.collectUserMetrics(userId);

    const rulesToAward: BadgeRule[] = [];
    for (const rule of BADGE_RULES) {
      const already = await this.hasUserBadge(userId, rule.code);
      if (already) continue;
      if (this.evaluateRule(rule, metrics)) {
        rulesToAward.push(rule);
      }
    }

    const newBadges: Badge[] = [];
    if (rulesToAward.length > 0) {
      // Look up the Badge rows once.
      const badgeRows = await this.prisma.badge.findMany({
        where: { code: { in: rulesToAward.map((r) => r.code) } },
      });
      const badgeByCode = new Map(badgeRows.map((b) => [b.code, b]));

      for (const rule of rulesToAward) {
        const badge = badgeByCode.get(rule.code);
        if (!badge) continue;
        try {
          // The @@unique([userId, badgeId]) constraint guards against races
          // when two concurrent /check calls pass the threshold simultaneously.
          await this.prisma.userBadge.create({
            data: { userId, badgeId: badge.id },
          });
          newBadges.push(badge);
          this.logger.log(`Awarded badge "${rule.code}" to user ${userId}`);
        } catch (err) {
          // P2002 = unique constraint violation: badge already awarded by a
          // racing call. Safe to swallow.
          const code = (err as { code?: string })?.code;
          if (code !== 'P2002') {
            this.logger.warn(
              `Failed to award badge "${rule.code}" to user ${userId}: ${(err as Error).message}`,
            );
          }
        }
      }
    }

    const allAwarded = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });

    return {
      newBadges: newBadges.map((b) => this.toBadgeDto(b)),
      allBadges: allAwarded.map((ub) => this.toBadgeDto(ub.badge)),
    };
  }

  /**
   * Return every badge in the system paired with the current user's award
   * status (awarded flag + awardedAt timestamp when applicable).
   */
  async getBadgesWithStatus(userId: string): Promise<BadgeWithStatusDto[]> {
    const [badges, userBadges] = await Promise.all([
      this.prisma.badge.findMany(),
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
    ]);

    const awardedByBadgeId = new Map<string, UserBadge>();
    for (const ub of userBadges) {
      awardedByBadgeId.set(ub.badgeId, ub);
    }

    // Preserve the canonical BADGE_RULES ordering so the UI can render a
    // predictable grid even before all badges are seeded.
    const orderIndex = new Map<string, number>();
    BADGE_RULES.forEach((r, idx) => orderIndex.set(r.code, idx));

    return badges
      .map((b) => {
        const ub = awardedByBadgeId.get(b.id);
        return {
          ...this.toBadgeDto(b),
          awarded: !!ub,
          awardedAt: ub ? ub.awardedAt.toISOString() : null,
        };
      })
      .sort((a, b) => {
        const ia = orderIndex.get(a.code) ?? Number.MAX_SAFE_INTEGER;
        const ib = orderIndex.get(b.code) ?? Number.MAX_SAFE_INTEGER;
        return ia - ib;
      });
  }

  // -----------------------------------------------------------------
  // Leaderboard
  // -----------------------------------------------------------------

  /**
   * Increment the user's weekly leaderboard score by `delta` (default +1).
   * Called from ProgressService.completeLesson to keep the leaderboard
   * fresh without polling /check.
   *
   * The ZSET key is per-ISO-week (`leaderboard:weekly:<year>-W<week>`) and
   * gets an 8-day TTL so stale weekly keys auto-expire.
   */
  async updateLeaderboard(userId: string, delta = 1): Promise<number> {
    const client = this.redis.getClient();
    const key = this.currentWeekKey();

    // ZINCRBY returns the new score as a string in ioredis.
    const next = await client.zincrby(key, delta, userId);

    // Refresh TTL lazily so the key disappears ~1 day after the week ends.
    const ttl = await client.ttl(key);
    if (ttl < 0) {
      // 8 days = 691200 seconds. Use 7 days + a few hours of slack.
      await client.expire(key, 8 * 24 * 60 * 60);
    }
    return typeof next === 'number' ? next : Number(next);
  }

  /**
   * Build the leaderboard payload: top-N users for the current ISO week
   * plus the requesting user's own rank/score.
   */
  async getLeaderboard(userId: string): Promise<LeaderboardDto> {
    const client = this.redis.getClient();
    const key = this.currentWeekKey();

    // ZREVRANGE returns [member, score, member, score, ...] when WITHSCORES
    // is supplied. Scores are strings in ioredis.
    const rawTop = await client.zrevrange(
      key,
      0,
      LEADERBOARD_TOP_N - 1,
      'WITHSCORES',
    );

    const topPairs: Array<{ userId: string; score: number }> = [];
    for (let i = 0; i < rawTop.length; i += 2) {
      const uid = String(rawTop[i]);
      const score = Number(rawTop[i + 1] ?? 0);
      topPairs.push({ userId: uid, score: Number.isFinite(score) ? score : 0 });
    }

    const topUserIds = topPairs.map((p) => p.userId);
    const users = topUserIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: topUserIds } },
          select: { id: true, nickname: true, avatar: true },
        })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    const topUsers: LeaderboardEntryDto[] = topPairs.map((p, idx) => {
      const u = userById.get(p.userId);
      return {
        rank: idx + 1,
        userId: p.userId,
        nickname: u?.nickname ?? '已注销用户',
        avatar: u?.avatar ?? null,
        score: p.score,
      };
    });

    // Current user's rank/score — fetch even if they're already in topUsers
    // so we can return a stable dedicated entry (and handle the case where
    // they have no score this week yet).
    let currentUser: LeaderboardEntryDto | null = null;
    const userScoreRaw = await client.zscore(key, userId);
    const userScore = userScoreRaw == null ? 0 : Number(userScoreRaw);
    if (userScore > 0 || topUsers.length === 0) {
      const userRank =
        userScore > 0 ? await client.zrevrank(key, userId) : null;
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true, avatar: true },
      });
      currentUser = {
        rank: userRank == null ? 0 : userRank + 1,
        userId,
        nickname: u?.nickname ?? '我',
        avatar: u?.avatar ?? null,
        score: Number.isFinite(userScore) ? userScore : 0,
      };
    } else {
      // User already appears in topUsers — surface the same entry.
      currentUser = topUsers.find((e) => e.userId === userId) ?? null;
    }

    return {
      weekKey: key.replace(LEADERBOARD_KEY_PREFIX, ''),
      topUsers,
      currentUser,
    };
  }

  // -----------------------------------------------------------------
  // Metric collection & rule evaluation
  // -----------------------------------------------------------------

  /**
   * Gather the five metrics consumed by the badge rules:
   * - streakCount (Redis `streak:<userId>` JSON `count`)
   * - completedLessons (Prisma: UserLessonProgress with status=COMPLETED)
   * - postCount (Prisma: Post authored by user)
   * - perfectScoreCount (Prisma: UserSpeakingAttempt with score=100)
   * - distinctLanguageCount (Prisma: distinct Language.code among completed
   *   lessons' parent languages)
   */
  private async collectUserMetrics(userId: string): Promise<UserMetrics> {
    const [
      streakCount,
      completedLessons,
      postCount,
      perfectScoreCount,
      distinctLanguageCount,
    ] = await Promise.all([
      this.readStreakCount(userId),
      this.prisma.userLessonProgress.count({
        where: { userId, status: 'COMPLETED' },
      }),
      this.prisma.post.count({ where: { authorId: userId } }),
      this.prisma.userSpeakingAttempt.count({
        where: { userId, score: 100 },
      }),
      this.countDistinctLanguagesForUser(userId),
    ]);

    return {
      streakCount,
      completedLessons,
      postCount,
      perfectScoreCount,
      distinctLanguageCount,
    };
  }

  /** Read the streak count from Redis (mirrors ProgressService.readStreak). */
  private async readStreakCount(userId: string): Promise<number> {
    const client = this.redis.getClient();
    const raw = await client.get(`streak:${userId}`);
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw) as { count?: number };
      return typeof parsed.count === 'number' ? parsed.count : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Count the number of distinct languages the user has completed at least
   * one lesson in. Implemented as a raw groupBy because Prisma's relation
   * traversal doesn't support distinct-on-related-field directly.
   */
  private async countDistinctLanguagesForUser(userId: string): Promise<number> {
    const rows = await this.prisma.userLessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { lessonId: true },
    });
    if (rows.length === 0) return 0;

    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: rows.map((r) => r.lessonId) } },
      select: {
        unit: {
          select: {
            level: { select: { language: { select: { code: true } } } },
          },
        },
      },
    });

    const codes = new Set<string>();
    for (const lesson of lessons) {
      const code = lesson.unit?.level?.language?.code;
      if (code) codes.add(code);
    }
    return codes.size;
  }

  /** Return true when `rule`'s threshold is met by the supplied metrics. */
  private evaluateRule(rule: BadgeRule, m: UserMetrics): boolean {
    switch (rule.code) {
      case 'STREAK_7':
      case 'STREAK_30':
        return m.streakCount >= rule.threshold;
      case 'FIRST_LESSON':
      case 'LESSONS_10':
      case 'LESSONS_50':
        return m.completedLessons >= rule.threshold;
      case 'FIRST_POST':
        return m.postCount >= rule.threshold;
      case 'PERFECT_SCORE':
        return m.perfectScoreCount >= rule.threshold;
      case 'POLYGLOT':
        return m.distinctLanguageCount >= rule.threshold;
      default:
        return false;
    }
  }

  /** True when the user already owns the badge with the given code. */
  private async hasUserBadge(
    userId: string,
    badgeCode: string,
  ): Promise<boolean> {
    const row = await this.prisma.userBadge.findFirst({
      where: { userId, badge: { code: badgeCode } },
      select: { id: true },
    });
    return !!row;
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------

  /** Compute the current ISO-week ZSET key, e.g. `leaderboard:weekly:2026-W31`. */
  private currentWeekKey(date: Date = new Date()): string {
    // ISO week algorithm: operate in UTC to avoid DST surprises.
    const d = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
    );
    const weekStr = String(weekNum).padStart(2, '0');
    return `${LEADERBOARD_KEY_PREFIX}${d.getUTCFullYear()}-W${weekStr}`;
  }

  private toBadgeDto(b: Badge): BadgeDto {
    return {
      id: b.id,
      code: b.code,
      name: b.name,
      description: b.description,
      icon: b.icon,
      category: b.category,
    };
  }
}
