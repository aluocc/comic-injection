/**
 * Badge category values mirrored from the Prisma `Badge.category` field.
 * Used both for seeding and for grouping in the achievement center UI.
 */
export type BadgeCategory = 'streak' | 'learning' | 'social' | 'milestone';

/**
 * Static definition of every badge in the system.
 *
 * `code` is the stable unique identifier persisted in the `Badge.code` column;
 * the Prisma `id` (cuid) is only an internal row handle and should not be
 * referenced from business logic.
 *
 * `threshold` is the numeric value the corresponding metric must reach (>=)
 * for the badge to be awarded. The metric for each rule is implicit from its
 * `code` (see `AchievementService.evaluateRule` for the mapping).
 */
export interface BadgeRule {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  threshold: number;
}

/**
 * Canonical badge list (Task 11.1).
 * Order matters only for deterministic seeding; the UI groups by category.
 */
export const BADGE_RULES: readonly BadgeRule[] = [
  {
    code: 'STREAK_7',
    name: '坚持一周',
    description: '连续学习 7 天，养成学习习惯',
    icon: '🔥',
    category: 'streak',
    threshold: 7,
  },
  {
    code: 'STREAK_30',
    name: '月度达人',
    description: '连续学习 30 天，毅力可嘉',
    icon: '🏆',
    category: 'streak',
    threshold: 30,
  },
  {
    code: 'FIRST_LESSON',
    name: '初窥门径',
    description: '完成第一个课时，开启学习之旅',
    icon: '🎯',
    category: 'milestone',
    threshold: 1,
  },
  {
    code: 'LESSONS_10',
    name: '勤学不辍',
    description: '完成 10 个课时，循序渐进',
    icon: '📚',
    category: 'learning',
    threshold: 10,
  },
  {
    code: 'LESSONS_50',
    name: '学有所成',
    description: '完成 50 个课时，量变引发质变',
    icon: '🎓',
    category: 'learning',
    threshold: 50,
  },
  {
    code: 'FIRST_POST',
    name: '破冰发言',
    description: '在社区发布第一篇帖子',
    icon: '✍️',
    category: 'social',
    threshold: 1,
  },
  {
    code: 'PERFECT_SCORE',
    name: '完美发音',
    description: '获得满分口语评分',
    icon: '💯',
    category: 'milestone',
    threshold: 1,
  },
  {
    code: 'POLYGLOT',
    name: '多语种探索者',
    description: '学习 2 种以上语言',
    icon: '🌐',
    category: 'milestone',
    threshold: 2,
  },
] as const;

/**
 * Redis key for the weekly leaderboard ZSET.
 *
 * Uses the ISO 8601 week identifier (e.g. `2026-W31`) so that each calendar
 * week gets its own ZSET and the leaderboard naturally rolls over at the
 * start of a new week. A TTL of 8 days is set on each write so stale weekly
 * keys expire without manual cleanup.
 */
export const LEADERBOARD_KEY_PREFIX = 'leaderboard:weekly:';

/** Maximum number of entries returned by GET /achievement/leaderboard. */
export const LEADERBOARD_TOP_N = 20;
