/**
 * Shared domain types mirroring the backend course models.
 * These correspond to the DTOs returned by the /courses endpoints.
 */

export type LessonType =
  | 'vocabulary'
  | 'grammar'
  | 'speaking'
  | 'listening'
  | 'mixed';

export interface Language {
  id: string;
  code: string;
  name: string;
  icon: string | null;
}

/**
 * Per-user progress attached to each LessonDto by the course tree endpoint
 * when a JWT is supplied. Mirrors the backend `LessonUserProgressDto`.
 */
export interface LessonUserProgress {
  id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  accuracy: number | null;
  timeSpent: number;
  completedAt: string | null;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  type: LessonType;
  duration: number;
  /** Per-user progress; null when anonymous or no progress row exists yet. */
  userProgress: LessonUserProgress | null;
}

export interface Unit {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

export interface Level {
  id: string;
  code: string;
  name: string;
  order: number;
  units: Unit[];
  /** Per-user progress; null when no JWT is supplied or Task 8 not wired yet. */
  userProgress: unknown;
}

export interface LanguageTree extends Language {
  levels: Level[];
}

export interface LessonDetail extends Lesson {
  unit: { id: string; title: string; order: number };
  level: { id: string; code: string; name: string; order: number };
}

/** Emoji + Chinese label for each lesson type, used by UI badges. */
export const LESSON_TYPE_META: Record<
  LessonType,
  { icon: string; label: string }
> = {
  vocabulary: { icon: '📖', label: '单词' },
  grammar: { icon: '✍️', label: '语法' },
  speaking: { icon: '🎤', label: '口语' },
  listening: { icon: '🎧', label: '听力' },
  mixed: { icon: '📚', label: '综合' },
};

// ============================================================
// Task 4: Vocabulary / SRS (单词记忆)
// ============================================================

/** A single vocabulary entry returned by /vocabulary/lesson/:id and /vocabulary/review. */
export interface Vocabulary {
  id: string;
  lessonId: string | null;
  languageCode: string;
  word: string;
  translation: string;
  phonetic: string | null;
  audioUrl: string | null;
  example: string | null;
  exampleTranslation: string | null;
}

/** Memory grade submitted to /vocabulary/:id/review. */
export type ReviewGrade = 'AGAIN' | 'GOOD' | 'EASY';

/** Response returned after submitting a review (includes updated SRS fields). */
export interface ReviewResult extends Vocabulary {
  srsRepetitions: number;
  srsInterval: number;
  srsEase: number;
  nextReviewAt: string;
  lastReviewedAt: string;
}

// ============================================================
// Task 5: Grammar Practice (语法练习)
// ============================================================

/** Grammar question types supported by the practice module. */
export type GrammarQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'CORRECTION';

/**
 * Public grammar question returned by /grammar/lesson/:id.
 * The server strips `answer` and `explanation` so the client cannot peek.
 */
export interface GrammarQuestion {
  id: string;
  lessonId: string | null;
  languageCode: string;
  type: GrammarQuestionType;
  question: string;
  options: string[] | null;
}

/** Response from POST /grammar/:id/check. */
export interface GrammarCheckResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
}

/** A single attempt row from GET /grammar/lesson/:id/attempts. */
export interface GrammarAttempt {
  id: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  attemptedAt: string;
}

// ============================================================
// Task 6: Speaking Practice (口语跟读)
// ============================================================

/**
 * Public speaking exercise returned by /speaking/lesson/:id.
 * `audioUrl` points at the model pronunciation clip (served from /uploads/
 * or the seeded /audio/... paths).
 */
export interface SpeakingExercise {
  id: string;
  lessonId: string | null;
  languageCode: string;
  text: string;
  audioUrl: string;
  difficulty: string;
}

/**
 * Per-word feedback item. One entry per expected word (tokenized from
 * `SpeakingExercise.text`):
 * - `word`: the user's aligned word (empty string when skipped/missing)
 * - `match`: whether `word` equals `expected` (case-insensitive)
 * - `expected`: the original expected word
 */
export interface SpeakingWordFeedback {
  word: string;
  match: boolean;
  expected: string;
}

/** Response from POST /speaking/:id/attempt. */
export interface SpeakingAttemptResult {
  score: number;
  wordFeedback: SpeakingWordFeedback[];
  expectedText: string;
}

/** A single attempt row from GET /speaking/lesson/:id/attempts. */
export interface SpeakingAttempt {
  id: string;
  exerciseId: string;
  userAudioUrl: string | null;
  transcription: string | null;
  score: number | null;
  wordFeedback: SpeakingWordFeedback[] | null;
  attemptedAt: string;
}

// ============================================================
// Task 7: Listening Practice (听力训练)
// ============================================================

/** Listening question types supported by the practice module. */
export type ListeningQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'TRUE_FALSE';

/**
 * Public listening question returned by /listening/lesson/:id.
 * The server strips `answer` so the client cannot peek.
 */
export interface ListeningQuestion {
  id: string;
  exerciseId: string;
  type: ListeningQuestionType;
  question: string;
  options: string[] | null;
}

/**
 * Public listening exercise returned by /listening/lesson/:id.
 * Includes the audio URL so the client can play the audio before answering.
 * `transcript` is intentionally NOT included here; it is returned by the
 * POST /listening/:id/check endpoint after the user submits an answer.
 */
export interface ListeningExercise {
  id: string;
  lessonId: string | null;
  languageCode: string;
  audioUrl: string;
  difficulty: string;
  questions: ListeningQuestion[];
}

/** Response from POST /listening/:exerciseId/check. */
export interface ListeningCheckResult {
  isCorrect: boolean;
  correctAnswer: string;
  transcript: string | null;
}

/** A single attempt row from GET /listening/lesson/:id/attempts. */
export interface ListeningAttempt {
  id: string;
  exerciseId: string;
  questionId: string | null;
  userAnswer: string;
  isCorrect: boolean;
  attemptedAt: string;
}

// ============================================================
// Task 8: Lesson Progress (学习进度追踪)
// ============================================================

/**
 * Per-lesson progress row returned by the /progress endpoints.
 * Mirrors the backend `LessonProgressDto`.
 */
export interface LessonProgress {
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
 * Streak shape persisted in Redis and returned by /progress endpoints.
 * `lastDate` is `YYYY-MM-DD` (server local time).
 */
export interface StreakData {
  count: number;
  lastDate: string;
}

/**
 * Per-language completion stats returned by GET /progress/dashboard.
 */
export interface LanguageProgress {
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
 * A recent-lesson row inside the dashboard payload, pairing a progress row
 * with its course context.
 */
export interface RecentLesson {
  lessonProgress: LessonProgress;
  lessonTitle: string;
  languageCode: string | null;
  languageName: string | null;
}

/**
 * Response returned by GET /progress/dashboard.
 */
export interface ProgressDashboard {
  streak: StreakData;
  totalCompletedLessons: number;
  totalStudySeconds: number;
  languages: LanguageProgress[];
  dailyTimes: DailyTimeBucket[];
  recentLessons: RecentLesson[];
}

/**
 * Response returned by POST /progress/lesson/:id/complete.
 */
export interface CompleteLessonResult {
  lessonProgress: LessonProgress;
  streak: StreakData;
}

// ============================================================
// Task 9: Recommendation (个性化学习路径推荐)
// ============================================================

/** Placement-quiz question types. */
export type PlacementQuestionType =
  | 'vocabulary'
  | 'grammar'
  | 'listening';

/**
 * Public placement-quiz question returned by
 * GET /recommendation/placement-quiz. The server strips `answer`.
 */
export interface PlacementQuestion {
  id: string;
  question: string;
  options: string[];
  languageCode: string;
  type: PlacementQuestionType;
}

/** A single answer in the placement-quiz submission payload. */
export interface PlacementAnswer {
  questionId: string;
  userAnswer: string;
}

/** Response returned by POST /recommendation/placement-quiz/submit. */
export interface QuizResult {
  level: string;
  accuracy: number;
  correctCount: number;
  totalCount: number;
}

/** Learning-goal payload for POST /recommendation/goal. */
export interface SetGoalPayload {
  targetLanguage: 'english' | 'japanese' | 'korean';
  dailyGoal: number;
  purpose: 'travel' | 'exam' | 'work' | 'hobby';
}

/** Goal record persisted in Redis and returned by POST /recommendation/goal. */
export interface UserGoal {
  targetLanguage: string;
  dailyGoal: number;
  purpose: string;
  updatedAt: string;
}

/** Response returned by POST /recommendation/goal. */
export interface SetGoalResult {
  user: {
    id: string;
    email: string;
    nickname: string;
    avatar: string | null;
    targetLanguage: string | null;
    currentLevel: string | null;
  };
  goal: UserGoal;
}

/** A single lesson entry inside the weekly plan. */
export interface PlanLesson {
  lessonId: string;
  title: string;
  type: string;
  duration: number;
}

/** One day in the weekly plan. */
export interface PlanDay {
  day: string;
  lessons: PlanLesson[];
}

/** Response returned by GET /recommendation/path. */
export interface RecommendationPath {
  weeklyPlan: PlanDay[];
  focusModules: string[];
  estimatedWeeks: number;
  level: string;
  targetLanguage: string;
  dailyGoal: number;
  purpose: string | null;
}

// ============================================================
// Task 10: Community (社区交流)
// ============================================================

/** Public author projection embedded inside Post/Comment responses. */
export interface CommunityAuthor {
  id: string;
  nickname: string;
  avatar: string | null;
}

/** A language circle returned by GET /community/circles. */
export interface Circle {
  id: string;
  languageCode: string;
  name: string;
  description: string | null;
  icon: string | null;
  postCount: number;
  createdAt: string;
}

/** A post list item returned by the posts endpoints. */
export interface PostListItem {
  id: string;
  circleId: string;
  title: string;
  content: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  author: CommunityAuthor;
  createdAt: string;
  updatedAt: string;
}

/** A comment on a post. */
export interface PostComment {
  id: string;
  postId: string;
  content: string;
  author: CommunityAuthor;
  createdAt: string;
}

/** Post detail with comments returned by GET /community/posts/:postId. */
export interface PostDetail extends PostListItem {
  comments: PostComment[];
}

/** Paginated posts response from GET /community/circles/:langCode/posts. */
export interface PaginatedPosts {
  items: PostListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Response from POST /community/posts/:postId/like (toggle). */
export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

// ============================================================
// Task 11: Achievement (成就激励系统)
// ============================================================

/** Badge category values mirrored from the backend Badge.category column. */
export type BadgeCategory = 'streak' | 'learning' | 'social' | 'milestone';

/** A badge row returned by GET /achievement/badges. */
export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

/** A badge paired with the current user's award status. */
export interface BadgeWithStatus extends Badge {
  awarded: boolean;
  awardedAt: string | null;
}

/** Result returned by POST /achievement/check. */
export interface CheckResult {
  newBadges: Badge[];
  allBadges: Badge[];
}

/** A single leaderboard entry. */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatar: string | null;
  score: number;
}

/** Result returned by GET /achievement/leaderboard. */
export interface Leaderboard {
  weekKey: string;
  topUsers: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
}
