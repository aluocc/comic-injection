import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ErrorCode } from '../../common/constants/error-code';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { AchievementService } from '../achievement/achievement.service';

/**
 * Streak shape persisted in Redis under key `streak:<userId>`.
 * - `count`: current consecutive-day streak
 * - `lastDate`: YYYY-MM-DD (server local time) of the last completion
 */
export interface StreakData {
  count: number;
  lastDate: string;
}

/**
 * Projection of a single UserLessonProgress row returned to clients.
 */
export interface LessonProgressDto {
  id: string;
  userId: string;
  lessonId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  accuracy: number | null;
  timeSpent: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Aggregated per-language completion stats returned by /progress/dashboard.
 */
export interface LanguageProgressDto {
  languageCode: string;
  languageName: string;
  totalLessons: number;
  completedLessons: number;
}

/**
 * Daily study-time bucket for the last 7 days, indexed by `YYYY-MM-DD`.
 */
export interface DailyTimeBucket {
  date: string; // YYYY-MM-DD
  seconds: number;
}

/**
 * Response returned by GET /progress/dashboard.
 */
export interface DashboardDto {
  streak: StreakData;
  totalCompletedLessons: number;
  totalStudySeconds: number;
  languages: LanguageProgressDto[];
  dailyTimes: DailyTimeBucket[]; // last 7 days, oldest -> newest
  recentLessons: Array<{
    lessonProgress: LessonProgressDto;
    lessonTitle: string;
    languageCode: string | null;
    languageName: string | null;
  }>;
}

const STREAK_KEY_PREFIX = 'streak:';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ProgressService: persists per-lesson progress and computes the user's
 * learning dashboard (streak + totals + per-language breakdown + 7-day
 * study-time chart).
 *
 * Streak rules (per spec):
 * - lastDate is today: do NOT increment
 * - lastDate is yesterday: count+1, set lastDate=today
 * - lastDate is older or absent: count=1, set lastDate=today
 */
@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly achievement: AchievementService,
  ) {}

  /** Mark a lesson as started (idempotent; never downgrades COMPLETED). */
  async markLessonStarted(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgressDto> {
    await this.ensureLessonExists(lessonId);

    const existing = await this.prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      // Do not downgrade COMPLETED → IN_PROGRESS.
      if (existing.status === 'COMPLETED') {
        return this.toDto(existing);
      }
      const updated = await this.prisma.userLessonProgress.update({
        where: { id: existing.id },
        data: { status: 'IN_PROGRESS' },
      });
      return this.toDto(updated);
    }

    const created = await this.prisma.userLessonProgress.create({
      data: { userId, lessonId, status: 'IN_PROGRESS' },
    });
    return this.toDto(created);
  }

  /**
   * Record a lesson completion (idempotent; updates accuracy/timeSpent each
   * call) and bump the streak when appropriate.
   */
  async completeLesson(
    userId: string,
    lessonId: string,
    dto: CompleteLessonDto,
  ): Promise<{ lessonProgress: LessonProgressDto; streak: StreakData }> {
    await this.ensureLessonExists(lessonId);

    const accuracy = dto.accuracy ?? null;
    // Replace previous timeSpent with the latest session's value (or 0).
    const timeSpent = dto.timeSpent ?? 0;

    const upserted = await this.prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        status: 'COMPLETED',
        accuracy,
        timeSpent,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        status: 'COMPLETED',
        accuracy,
        timeSpent,
        completedAt: new Date(),
      },
    });

    const streak = await this.bumpStreak(userId);

    // Bump the weekly leaderboard ZSET (Task 11.2). Errors here must not
    // fail the lesson completion, so we log and move on.
    try {
      await this.achievement.updateLeaderboard(userId, 1);
    } catch (err) {
      this.logger.warn(
        `Failed to update leaderboard for user ${userId}: ${(err as Error).message}`,
      );
    }

    return { lessonProgress: this.toDto(upserted), streak };
  }

  /** Return the user's progress record for a single lesson (or null). */
  async getLessonProgress(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgressDto | null> {
    const row = await this.prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    return row ? this.toDto(row) : null;
  }

  /**
   * Build the dashboard payload:
   * - streak (Redis)
   * - total completed lessons + total study seconds
   * - per-language completion ratio
   * - last 7 days daily study-time (aggregated by `updatedAt` day)
   * - 5 most recently updated lesson-progress rows with course context
   */
  async getDashboard(userId: string): Promise<DashboardDto> {
    const streak = await this.readStreak(userId);

    const progressRows = await this.prisma.userLessonProgress.findMany({
      where: { userId },
    });

    const completedRows = progressRows.filter((r) => r.status === 'COMPLETED');
    const totalCompletedLessons = completedRows.length;
    const totalStudySeconds = progressRows.reduce(
      (sum, r) => sum + (r.timeSpent ?? 0),
      0,
    );

    // Per-language breakdown: count lessons grouped by their parent language.
    const languages = await this.prisma.language.findMany({
      include: {
        levels: {
          include: {
            units: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
    });

    const completedIds = new Set(completedRows.map((r) => r.lessonId));

    const languageProgress: LanguageProgressDto[] = languages.map((lang) => {
      const lessonIds: string[] = [];
      for (const level of lang.levels) {
        for (const unit of level.units) {
          for (const lesson of unit.lessons) {
            lessonIds.push(lesson.id);
          }
        }
      }
      const completedLessons = lessonIds.filter((id) =>
        completedIds.has(id),
      ).length;
      return {
        languageCode: lang.code,
        languageName: lang.name,
        totalLessons: lessonIds.length,
        completedLessons,
      };
    });

    // Last-7-days daily study time (use updatedAt day as proxy for activity).
    const dailyTimes = this.buildLast7DayBuckets(progressRows);

    // Recent lesson list (top 5 by updatedAt).
    const recentRows = [...progressRows]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    const recentLessonIds = recentRows.map((r) => r.lessonId);
    const lessonContexts = recentLessonIds.length
      ? await this.prisma.lesson.findMany({
          where: { id: { in: recentLessonIds } },
          include: {
            unit: { include: { level: { include: { language: true } } } },
          },
        })
      : [];

    const contextById = new Map<
      string,
      { title: string; languageCode: string | null; languageName: string | null }
    >();
    for (const lesson of lessonContexts) {
      const lang = lesson.unit.level.language;
      contextById.set(lesson.id, {
        title: lesson.title,
        languageCode: lang?.code ?? null,
        languageName: lang?.name ?? null,
      });
    }

    const recentLessons = recentRows.map((r) => {
      const ctx = contextById.get(r.lessonId);
      return {
        lessonProgress: this.toDto(r),
        lessonTitle: ctx?.title ?? '(已删除课时)',
        languageCode: ctx?.languageCode ?? null,
        languageName: ctx?.languageName ?? null,
      };
    });

    return {
      streak,
      totalCompletedLessons,
      totalStudySeconds,
      languages: languageProgress,
      dailyTimes,
      recentLessons,
    };
  }

  /**
   * Bulk-load lesson progress for the given user (used by the course tree
   * endpoint to attach `userProgress` to each lesson).
   */
  async getProgressForLessons(
    userId: string | undefined,
    lessonIds: string[],
  ): Promise<Map<string, LessonProgressDto>> {
    const map = new Map<string, LessonProgressDto>();
    if (!userId || lessonIds.length === 0) return map;
    const rows = await this.prisma.userLessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
    for (const row of rows) {
      map.set(row.lessonId, this.toDto(row));
    }
    return map;
  }

  // ---------------------------------------------------------------
  // Streak helpers
  // ---------------------------------------------------------------

  /**
   * Atomically read + update the user's streak. Uses a Redis JSON string
   * under key `streak:<userId>`. Falls back to `{ count: 0, lastDate: '' }`
   * when missing or unparsable.
   */
  private async bumpStreak(userId: string): Promise<StreakData> {
    const client = this.redis.getClient();
    const key = `${STREAK_KEY_PREFIX}${userId}`;
    const today = this.todayString();
    const yesterday = this.dateStringOffsetByDays(-1);

    const raw = await client.get(key);
    let current: StreakData = { count: 0, lastDate: '' };
    if (raw) {
      try {
        current = JSON.parse(raw) as StreakData;
      } catch {
        current = { count: 0, lastDate: '' };
      }
    }

    let nextCount: number;
    if (current.lastDate === today) {
      nextCount = current.count || 1;
    } else if (current.lastDate === yesterday) {
      nextCount = (current.count ?? 0) + 1;
    } else {
      nextCount = 1;
    }

    const next: StreakData = { count: nextCount, lastDate: today };
    await client.set(key, JSON.stringify(next));
    return next;
  }

  /** Read-only streak lookup (used by /dashboard). */
  private async readStreak(userId: string): Promise<StreakData> {
    const client = this.redis.getClient();
    const raw = await client.get(`${STREAK_KEY_PREFIX}${userId}`);
    if (!raw) return { count: 0, lastDate: '' };
    try {
      return JSON.parse(raw) as StreakData;
    } catch {
      return { count: 0, lastDate: '' };
    }
  }

  // ---------------------------------------------------------------
  // Date helpers (server-local time)
  // ---------------------------------------------------------------

  /** Format `date` as YYYY-MM-DD in the server's local timezone. */
  private formatDateString(date: Date): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private todayString(): string {
    return this.formatDateString(new Date());
  }

  /** Return the date string `offsetDays` from today (e.g. -1 = yesterday). */
  private dateStringOffsetByDays(offsetDays: number): string {
    const d = new Date(Date.now() + offsetDays * ONE_DAY_MS);
    return this.formatDateString(d);
  }

  /**
   * Build a 7-bucket array of `{ date, seconds }` covering the last 7 days
   * (oldest first, today last). Each progress row contributes its `timeSpent`
   * to the bucket keyed by the day portion of `updatedAt`.
   */
  private buildLast7DayBuckets(
    rows: Array<{ timeSpent: number; updatedAt: Date }>,
  ): DailyTimeBucket[] {
    const buckets: DailyTimeBucket[] = [];
    const indexByDate = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const dateStr = this.dateStringOffsetByDays(-i);
      indexByDate.set(dateStr, buckets.length);
      buckets.push({ date: dateStr, seconds: 0 });
    }
    for (const row of rows) {
      const dateStr = this.formatDateString(row.updatedAt);
      const idx = indexByDate.get(dateStr);
      if (idx !== undefined) {
        buckets[idx].seconds += row.timeSpent ?? 0;
      }
    }
    return buckets;
  }

  // ---------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------

  /** Throw 404 when the lesson does not exist (so callers can't fake rows). */
  private async ensureLessonExists(lessonId: string): Promise<void> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `lesson not found: ${lessonId}`,
      });
    }
  }

  private toDto(row: {
    id: string;
    userId: string;
    lessonId: string;
    status: string;
    accuracy: number | null;
    timeSpent: number;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): LessonProgressDto {
    return {
      id: row.id,
      userId: row.userId,
      lessonId: row.lessonId,
      status: row.status as LessonProgressDto['status'],
      accuracy: row.accuracy,
      timeSpent: row.timeSpent,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
