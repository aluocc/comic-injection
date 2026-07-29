import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCode } from '../../common/constants/error-code';

/**
 * Public projection of a SpeakingExercise row, returned by the lesson list
 * endpoint. Includes the original audio URL so the client can play the model
 * pronunciation before recording/typing.
 */
export interface SpeakingExerciseDto {
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
 * - `word`: the user's aligned word (empty string when the user skipped it)
 * - `match`: whether `word` equals `expected` (case-insensitive)
 * - `expected`: the original expected word
 */
export interface WordFeedbackItem {
  word: string;
  match: boolean;
  expected: string;
}

/**
 * Response returned after submitting an attempt.
 */
export interface AttemptResultDto {
  score: number;
  wordFeedback: WordFeedbackItem[];
  expectedText: string;
}

/**
 * A single attempt row in the current user's history for a lesson.
 */
export interface SpeakingAttemptDto {
  id: string;
  exerciseId: string;
  userAudioUrl: string | null;
  transcription: string | null;
  score: number | null;
  wordFeedback: WordFeedbackItem[] | null;
  attemptedAt: string;
}

/**
 * Languages that do not use whitespace between words. For these we fall back
 * to character-level tokenization so the Levenshtein alignment still works.
 */
const SPACELESS_LANGUAGES = new Set(['japanese', 'korean', 'ja', 'ko', 'zh', 'chinese']);

/**
 * SpeakingService: serves speaking exercises for a lesson, grades a user's
 * transcription against the expected text, and records the attempt.
 *
 * Grading (per Task 6 spec):
 * - Tokenize `exercise.text` and `transcription`. For most languages split on
 *   whitespace; for Japanese/Korean (no word boundaries) split into chars.
 * - Compute the word-level Levenshtein distance and align the two sequences.
 * - score = round((1 - distance / max(len_expected, len_user)) * 100),
 *   clamped to [0, 100]. When both sides are empty, score = 100.
 * - wordFeedback has one entry per expected word; `match` is true when the
 *   aligned user word matches case-insensitively.
 */
@Injectable()
export class SpeakingService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all speaking exercises attached to a lesson (public). */
  async listByLesson(lessonId: string): Promise<SpeakingExerciseDto[]> {
    const rows = await this.prisma.speakingExercise.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(this.toDto);
  }

  /**
   * Grade a user's transcription for a speaking exercise, persist the attempt,
   * and return the score + per-word feedback.
   */
  async submitAttempt(
    userId: string,
    exerciseId: string,
    transcription: string,
  ): Promise<AttemptResultDto> {
    const exercise = await this.prisma.speakingExercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `speaking exercise not found: ${exerciseId}`,
      });
    }

    const expectedTokens = this.tokenize(exercise.text, exercise.languageCode);
    const userTokens = this.tokenize(transcription, exercise.languageCode);

    const { distance, feedback } = this.alignAndScore(
      expectedTokens,
      userTokens,
    );

    const maxLen = Math.max(expectedTokens.length, userTokens.length);
    const raw = maxLen === 0 ? 1 : 1 - distance / maxLen;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100)));

    await this.prisma.userSpeakingAttempt.create({
      data: {
        userId,
        exerciseId,
        transcription,
        score,
        // Prisma's Json field type requires InputJsonValue, which a plain
        // interface array does not structurally satisfy (missing index
        // signature). The cast is safe — `feedback` is always a JSON array.
        wordFeedback: feedback as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      score,
      wordFeedback: feedback,
      expectedText: exercise.text,
    };
  }

  /** Return the authenticated user's attempt history for a lesson. */
  async listAttemptsByLesson(
    userId: string,
    lessonId: string,
  ): Promise<SpeakingAttemptDto[]> {
    const rows = await this.prisma.userSpeakingAttempt.findMany({
      where: {
        userId,
        exercise: { lessonId },
      },
      orderBy: { attemptedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      exerciseId: r.exerciseId,
      userAudioUrl: r.userAudioUrl,
      transcription: r.transcription,
      score: r.score,
      wordFeedback: this.coerceFeedback(r.wordFeedback),
      attemptedAt: r.attemptedAt.toISOString(),
    }));
  }

  // ------------------------------------------------------------------
  // Tokenization & scoring helpers
  // ------------------------------------------------------------------

  /**
   * Split `text` into comparable tokens.
   * - Spaceless languages (japanese/korean): one token per non-space char.
   * - Everything else: split on whitespace runs.
   */
  private tokenize(text: string, languageCode: string): string[] {
    const cleaned = (text ?? '').trim();
    if (!cleaned) return [];
    if (SPACELESS_LANGUAGES.has(languageCode.toLowerCase())) {
      // Strip any stray whitespace then split into individual characters.
      return Array.from(cleaned.replace(/\s+/g, ''));
    }
    return cleaned.split(/\s+/).filter(Boolean);
  }

  /**
   * Compute the word-level Levenshtein distance between `expected` and `user`
   * and produce the per-expected-word alignment. Comparison is case-insensitive
   * so "Hello" matches "hello".
   *
   * Returns `{ distance, feedback }` where `feedback` has exactly one entry
   * per expected token (in order). For expected tokens missing from the user
   * input, `word` is the empty string and `match` is false.
   */
  private alignAndScore(
    expected: string[],
    user: string[],
  ): { distance: number; feedback: WordFeedbackItem[] } {
    const m = expected.length;
    const n = user.length;

    if (m === 0) {
      // No expected tokens: distance equals the number of extra user tokens.
      return { distance: n, feedback: [] };
    }
    if (n === 0) {
      // User said nothing: every expected token is missing.
      return {
        distance: m,
        feedback: expected.map((tok) => ({
          word: '',
          match: false,
          expected: tok,
        })),
      };
    }

    // dp[i][j] = edit distance between expected[0..i) and user[0..j)
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      new Array<number>(n + 1).fill(0),
    );
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      const expLower = expected[i - 1].toLowerCase();
      for (let j = 1; j <= n; j++) {
        const cost = expLower === user[j - 1].toLowerCase() ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + cost, // substitution / match
        );
      }
    }

    // Backtrack from (m, n). Prefer diagonal (match/substitute), then
    // deletion (expected token with no user token), then insertion (extra
    // user token — skipped since feedback is indexed by expected word).
    const feedback: WordFeedbackItem[] = [];
    let i = m;
    let j = n;
    while (i > 0) {
      if (j > 0) {
        const cost =
          expected[i - 1].toLowerCase() === user[j - 1].toLowerCase() ? 0 : 1;
        if (dp[i][j] === dp[i - 1][j - 1] + cost) {
          feedback.unshift({
            word: user[j - 1],
            match: cost === 0,
            expected: expected[i - 1],
          });
          i--;
          j--;
          continue;
        }
      }
      if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        // Deletion: expected word missing in user input.
        feedback.unshift({
          word: '',
          match: false,
          expected: expected[i - 1],
        });
        i--;
        continue;
      }
      // Insertion: extra user word with no expected counterpart. Skip it so
      // feedback stays indexed by expected word.
      if (j > 0) {
        j--;
        continue;
      }
      // Should not reach here, but break to avoid an infinite loop.
      break;
    }

    return { distance: dp[m][n], feedback };
  }

  /**
   * Coerce a Prisma Json `wordFeedback` column back into the typed shape.
   * Defensive: malformed rows (e.g. seeded by older code) become `null`.
   */
  private coerceFeedback(raw: unknown): WordFeedbackItem[] | null {
    if (!Array.isArray(raw)) return null;
    const items: WordFeedbackItem[] = [];
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as Record<string, unknown>;
      if (
        typeof e.word !== 'string' ||
        typeof e.match !== 'boolean' ||
        typeof e.expected !== 'string'
      ) {
        return null;
      }
      items.push({
        word: e.word,
        match: e.match,
        expected: e.expected,
      });
    }
    return items;
  }

  private toDto(r: {
    id: string;
    lessonId: string | null;
    languageCode: string;
    text: string;
    audioUrl: string;
    difficulty: string;
  }): SpeakingExerciseDto {
    return {
      id: r.id,
      lessonId: r.lessonId,
      languageCode: r.languageCode,
      text: r.text,
      audioUrl: r.audioUrl,
      difficulty: r.difficulty,
    };
  }
}
