import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ErrorCode } from '../../common/constants/error-code';
import type { SubmitQuizDto } from './dto/submit-quiz.dto';
import type { SetGoalDto } from './dto/set-goal.dto';

/**
 * A single placement-quiz question. The `answer` field is the correct
 * option text; the public list endpoint strips it before returning.
 */
export interface PlacementQuestion {
  id: string;
  question: string;
  options: string[];
  languageCode: string;
  type: 'vocabulary' | 'grammar' | 'listening';
  answer: string;
}

/**
 * Public question returned by GET /recommendation/placement-quiz.
 * `answer` is omitted so the client cannot peek.
 */
export type PublicPlacementQuestion = Omit<PlacementQuestion, 'answer'>;

/**
 * Response returned by POST /recommendation/placement-quiz/submit.
 */
export interface QuizResultDto {
  level: string;
  accuracy: number;
  correctCount: number;
  totalCount: number;
}

/**
 * Goal record persisted in Redis under key `goal:<userId>`.
 */
export interface UserGoal {
  targetLanguage: string;
  dailyGoal: number;
  purpose: string;
  updatedAt: string;
}

/**
 * Public projection of a User returned by /recommendation/goal.
 */
export interface PublicUserDto {
  id: string;
  email: string;
  nickname: string;
  avatar: string | null;
  targetLanguage: string | null;
  currentLevel: string | null;
}

/**
 * A single lesson entry inside the weekly plan.
 */
export interface PlanLessonDto {
  lessonId: string;
  title: string;
  type: string;
  duration: number;
}

/**
 * One day in the weekly plan.
 */
export interface PlanDayDto {
  day: string; // 周一 / 周二 / ... / 周日
  lessons: PlanLessonDto[];
}

/**
 * Response returned by GET /recommendation/path.
 */
export interface RecommendationPathDto {
  weeklyPlan: PlanDayDto[];
  focusModules: string[];
  estimatedWeeks: number;
  level: string;
  targetLanguage: string;
  dailyGoal: number;
  purpose: string | null;
}

const GOAL_KEY_PREFIX = 'goal:';
const LESSON_MINUTES = 12; // average minutes per lesson (per spec)

/**
 * Hardcoded 10-question placement quiz covering vocabulary / grammar /
 * listening comprehension. The questions are intentionally generic
 * (English content) so they work as an initial placement test for any
 * target language; per-language quiz banks can be added later by
 * swapping this constant for a DB lookup.
 */
const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // ----- Vocabulary (3) -----
  {
    id: 'q1',
    type: 'vocabulary',
    languageCode: 'english',
    question: 'Choose the correct meaning of "greeting".',
    options: ['告别', '问候', '道歉', '感谢'],
    answer: '问候',
  },
  {
    id: 'q2',
    type: 'vocabulary',
    languageCode: 'english',
    question: 'Which word means "a number between 1 and 10"?',
    options: ['dozen', 'digit', 'hundred', 'thousand'],
    answer: 'digit',
  },
  {
    id: 'q3',
    type: 'vocabulary',
    languageCode: 'english',
    question: 'Pick the synonym of "happy".',
    options: ['sad', 'angry', 'glad', 'tired'],
    answer: 'glad',
  },
  // ----- Grammar (4) -----
  {
    id: 'q4',
    type: 'grammar',
    languageCode: 'english',
    question: 'Fill in the blank: "She ___ a teacher."',
    options: ['am', 'is', 'are', 'be'],
    answer: 'is',
  },
  {
    id: 'q5',
    type: 'grammar',
    languageCode: 'english',
    question: 'Which sentence is correct?',
    options: [
      'I goes to school.',
      'I go to school.',
      'I going to school.',
      'I gone to school.',
    ],
    answer: 'I go to school.',
  },
  {
    id: 'q6',
    type: 'grammar',
    languageCode: 'english',
    question: 'Choose the correct article: "I have ___ apple."',
    options: ['a', 'an', 'the', 'no article'],
    answer: 'an',
  },
  {
    id: 'q7',
    type: 'grammar',
    languageCode: 'english',
    question: 'What is the past tense of "go"?',
    options: ['goed', 'gone', 'went', 'going'],
    answer: 'went',
  },
  // ----- Listening comprehension (3) -----
  {
    id: 'q8',
    type: 'listening',
    languageCode: 'english',
    question:
      'Speaker: "Hi, my name is Tom. Nice to meet you." What is the speaker doing?',
    options: [
      'Saying goodbye',
      'Introducing himself',
      'Asking the time',
      'Ordering food',
    ],
    answer: 'Introducing himself',
  },
  {
    id: 'q9',
    type: 'listening',
    languageCode: 'english',
    question:
      'Speaker: "It\'s a quarter past three." What time is it?',
    options: ['3:00', '3:15', '3:30', '3:45'],
    answer: '3:15',
  },
  {
    id: 'q10',
    type: 'listening',
    languageCode: 'english',
    question:
      'Speaker: "Can I have two coffees, please?" What does the speaker want?',
    options: ['One coffee', 'Two coffees', 'Tea', 'Water'],
    answer: 'Two coffees',
  },
];

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/**
 * Purpose → focus module mapping. Each purpose emphasizes different
 * lesson types in the weekly plan.
 *
 * - travel → 口语 + 听力 (speaking + listening)
 * - exam   → 语法 + 词汇 (grammar + vocabulary)
 * - work   → 口语 + 听力 (speaking + listening)
 * - hobby  → 均衡 (balanced; no preference)
 */
const PURPOSE_FOCUS: Record<string, string[]> = {
  travel: ['speaking', 'listening'],
  exam: ['grammar', 'vocabulary'],
  work: ['speaking', 'listening'],
  hobby: [],
};

/**
 * RecommendationService: placement quiz, goal persistence, and the
 * rule-based personalized path generator.
 */
@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ---------------------------------------------------------------
  // Placement quiz
  // ---------------------------------------------------------------

  /**
   * Return the placement-quiz questions (public). `answer` is stripped
   * so the client cannot peek at the solution.
   */
  listPlacementQuestions(): PublicPlacementQuestion[] {
    return PLACEMENT_QUESTIONS.map(({ answer: _answer, ...rest }) => rest);
  }

  /**
   * Grade a submitted quiz, map accuracy to a CEFR level, persist the
   * level on the user, and return the result.
   *
   * Mapping (per spec):
   *   >= 90% → A2
   *   >= 70% → A1
   *   <  70% → A1
   */
  async submitQuiz(
    userId: string,
    dto: SubmitQuizDto,
  ): Promise<QuizResultDto> {
    const answerKey = new Map(
      PLACEMENT_QUESTIONS.map((q) => [q.id, q.answer]),
    );

    let correctCount = 0;
    for (const ans of dto.answers) {
      const correct = answerKey.get(ans.questionId);
      if (correct === undefined) continue;
      if (
        ans.userAnswer.trim().toLowerCase() === correct.trim().toLowerCase()
      ) {
        correctCount += 1;
      }
    }

    const totalCount = PLACEMENT_QUESTIONS.length;
    const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
    const level = this.accuracyToLevel(accuracy);

    await this.prisma.user.update({
      where: { id: userId },
      data: { currentLevel: level },
    });

    this.logger.log(
      `Placement quiz: user=${userId} correct=${correctCount}/${totalCount} level=${level}`,
    );

    return { level, accuracy, correctCount, totalCount };
  }

  // ---------------------------------------------------------------
  // Goal
  // ---------------------------------------------------------------

  /**
   * Persist the user's learning goal: writes `targetLanguage` onto the
   * User row, and stores `dailyGoal` + `purpose` (along with the
   * targetLanguage) as a JSON blob in Redis under key `goal:<userId>`.
   */
  async setGoal(userId: string, dto: SetGoalDto): Promise<{
    user: PublicUserDto;
    goal: UserGoal;
  }> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { targetLanguage: dto.targetLanguage },
    });

    const goal: UserGoal = {
      targetLanguage: dto.targetLanguage,
      dailyGoal: dto.dailyGoal,
      purpose: dto.purpose,
      updatedAt: new Date().toISOString(),
    };

    const client = this.redis.getClient();
    await client.set(`${GOAL_KEY_PREFIX}${userId}`, JSON.stringify(goal));

    this.logger.log(
      `Goal set: user=${userId} lang=${dto.targetLanguage} daily=${dto.dailyGoal}min purpose=${dto.purpose}`,
    );

    return { user: this.toPublicUser(updated), goal };
  }

  /** Read the user's goal from Redis (or null when not yet set). */
  async getGoal(userId: string): Promise<UserGoal | null> {
    const client = this.redis.getClient();
    const raw = await client.get(`${GOAL_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserGoal;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------
  // Path generation
  // ---------------------------------------------------------------

  /**
   * Generate a personalized weekly learning plan based on:
   *   1. User.targetLanguage + User.currentLevel
   *   2. The Redis-stored goal (dailyGoal, purpose)
   *   3. The user's completed-lesson set (from UserLessonProgress)
   *
   * Algorithm:
   *   - Find the target language's level matching currentLevel (fall
   *     back to the lowest-order level if the user's level doesn't
   *     exist for that language).
   *   - Collect lessons under that level, excluding COMPLETED ones.
   *   - Sort by unit.order then lesson.order.
   *   - Compute daily lesson count from dailyGoal / LESSON_MINUTES.
   *   - Distribute lessons across 7 days; reorder so the focus
   *     modules (per purpose) come first each day.
   *   - Estimate weeks to finish all remaining lessons at the daily
   *     pace.
   */
  async generatePath(userId: string): Promise<RecommendationPathDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'user not found',
      });
    }

    const targetLanguage = user.targetLanguage ?? 'english';
    const desiredLevel = user.currentLevel ?? 'A1';
    const goal = await this.getGoal(userId);
    const dailyGoal = goal?.dailyGoal ?? 30;
    const purpose = goal?.purpose ?? null;

    // Find the language + the matching level (or fall back to lowest).
    const language = await this.prisma.language.findUnique({
      where: { code: targetLanguage },
      include: {
        levels: {
          orderBy: { order: 'asc' },
          include: {
            units: {
              orderBy: { order: 'asc' },
              include: { lessons: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    });

    if (!language) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `language not found: ${targetLanguage}`,
      });
    }

    let level =
      language.levels.find((l) => l.code === desiredLevel) ??
      language.levels[0];
    if (!level) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `no levels seeded for language: ${targetLanguage}`,
      });
    }

    // If the user has finished all lessons at this level, try to advance
    // to the next level (so the plan keeps moving forward).
    const completedProgress = await this.prisma.userLessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { lessonId: true },
    });
    const completedIds = new Set(completedProgress.map((r) => r.lessonId));

    const allLessonIdsAtLevel = level.units.flatMap((u) =>
      u.lessons.map((l) => l.id),
    );
    const allCompletedAtLevel =
      allLessonIdsAtLevel.length > 0 &&
      allLessonIdsAtLevel.every((id) => completedIds.has(id));

    if (allCompletedAtLevel) {
      const nextLevel = language.levels.find(
        (l) => l.order > level!.order,
      );
      if (nextLevel) level = nextLevel;
    }

    // Collect candidate lessons (not yet completed) sorted by unit+lesson.
    const candidates: PlanLessonDto[] = [];
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        if (completedIds.has(lesson.id)) continue;
        candidates.push({
          lessonId: lesson.id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
        });
      }
    }

    // Daily lesson count derived from dailyGoal.
    const lessonsPerDay = Math.max(1, Math.round(dailyGoal / LESSON_MINUTES));
    const focusModules = purpose ? PURPOSE_FOCUS[purpose] ?? [] : [];

    // Sort candidates: focus-module lessons first, then by original order.
    const sortedCandidates = this.sortByFocus(candidates, focusModules);

    // Build a 7-day plan; cycle through candidates.
    const weeklyPlan: PlanDayDto[] = [];
    for (let i = 0; i < 7; i++) {
      const dayLessons: PlanLessonDto[] = [];
      for (let j = 0; j < lessonsPerDay; j++) {
        const idx = i * lessonsPerDay + j;
        if (idx >= sortedCandidates.length) break;
        dayLessons.push(sortedCandidates[idx]);
      }
      weeklyPlan.push({ day: DAY_LABELS[i], lessons: dayLessons });
    }

    const totalRemaining = candidates.length;
    const weeklyThroughput = lessonsPerDay * 7;
    const estimatedWeeks =
      weeklyThroughput > 0
        ? Math.max(1, Math.ceil(totalRemaining / weeklyThroughput))
        : 0;

    return {
      weeklyPlan,
      focusModules: this.translateFocusModules(focusModules),
      estimatedWeeks,
      level: level.code,
      targetLanguage,
      dailyGoal,
      purpose,
    };
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  /** Map accuracy 0..1 → CEFR level (per spec). */
  private accuracyToLevel(accuracy: number): string {
    if (accuracy >= 0.9) return 'A2';
    if (accuracy >= 0.7) return 'A1';
    return 'A1';
  }

  /**
   * Stable sort: lessons whose `type` is in `focusModules` come first,
   * preserving the original order within each group.
   */
  private sortByFocus(
    lessons: PlanLessonDto[],
    focusModules: string[],
  ): PlanLessonDto[] {
    if (focusModules.length === 0) return [...lessons];
    const focusSet = new Set(focusModules);
    const focus: PlanLessonDto[] = [];
    const rest: PlanLessonDto[] = [];
    for (const l of lessons) {
      if (focusSet.has(l.type)) focus.push(l);
      else rest.push(l);
    }
    return [...focus, ...rest];
  }

  /** Translate internal module codes to user-facing Chinese labels. */
  private translateFocusModules(modules: string[]): string[] {
    const map: Record<string, string> = {
      vocabulary: '词汇',
      grammar: '语法',
      speaking: '口语',
      listening: '听力',
      mixed: '综合',
    };
    if (modules.length === 0) return ['均衡'];
    return modules.map((m) => map[m] ?? m);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    nickname: string;
    avatar: string | null;
    targetLanguage: string | null;
    currentLevel: string | null;
  }): PublicUserDto {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      targetLanguage: user.targetLanguage,
      currentLevel: user.currentLevel,
    };
  }
}
