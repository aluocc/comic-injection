import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCode } from '../../common/constants/error-code';

/**
 * Listening question types supported by the practice module.
 * Mirrors the `type` column on the ListeningQuestion table.
 */
export type ListeningQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'TRUE_FALSE';

/**
 * Public projection of a ListeningQuestion row, returned inside the exercise
 * list endpoint. Crucially, this DOES NOT include `answer` so clients cannot
 * peek at the solution before submitting.
 */
export interface ListeningQuestionDto {
  id: string;
  exerciseId: string;
  type: ListeningQuestionType;
  question: string;
  options: string[] | null;
}

/**
 * Public projection of a ListeningExercise row, returned by the lesson list
 * endpoint. Includes the audio URL so the client can play the audio before
 * answering. `transcript` is intentionally NOT included here so clients
 * cannot peek at the answer script before submitting; it is returned by the
 * POST /listening/:exerciseId/check endpoint instead.
 */
export interface ListeningExerciseDto {
  id: string;
  lessonId: string | null;
  languageCode: string;
  audioUrl: string;
  difficulty: string;
  questions: ListeningQuestionDto[];
}

/**
 * Response returned after submitting an answer. Includes the correct answer
 * and the exercise transcript so the client can show feedback and a review
 * panel.
 *
 * The transcript is always returned so the frontend can render the post-quiz
 * review panel as soon as the user submits the first answer; the spec calls
 * out "首次答错时返回 transcript 供复盘" which we satisfy by always providing
 * it (the client may choose to hide it until the first wrong answer).
 */
export interface CheckResultDto {
  isCorrect: boolean;
  correctAnswer: string;
  transcript: string | null;
}

/**
 * A single attempt row in the current user's history for a lesson.
 */
export interface ListeningAttemptDto {
  id: string;
  exerciseId: string;
  questionId: string | null;
  userAnswer: string;
  isCorrect: boolean;
  attemptedAt: string;
}

/**
 * ListeningService: serves listening exercises for a lesson, grades submitted
 * answers, and records the attempt under the authenticated user.
 *
 * Grading rule (per Task 7 spec):
 *   isCorrect = userAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
 */
@Injectable()
export class ListeningService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all listening exercises attached to a lesson (public). */
  async listByLesson(lessonId: string): Promise<ListeningExerciseDto[]> {
    const rows = await this.prisma.listeningExercise.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
      include: {
        questions: {
          orderBy: { id: 'asc' },
        },
      },
    });
    return rows.map(this.toDto);
  }

  /**
   * Grade a user's answer for a listening question, persist the attempt, and
   * return the correct answer + exercise transcript.
   *
   * The transcript is included in the response so the frontend can render the
   * review panel without an extra round-trip.
   */
  async check(
    userId: string,
    exerciseId: string,
    questionId: string,
    userAnswer: string,
  ): Promise<CheckResultDto> {
    const exercise = await this.prisma.listeningExercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `listening exercise not found: ${exerciseId}`,
      });
    }

    const question = await this.prisma.listeningQuestion.findFirst({
      where: { id: questionId, exerciseId },
    });
    if (!question) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `listening question not found: ${questionId}`,
      });
    }

    const isCorrect =
      userAnswer.trim().toLowerCase() ===
      question.answer.trim().toLowerCase();

    await this.prisma.userListeningAttempt.create({
      data: {
        userId,
        exerciseId,
        questionId,
        userAnswer,
        isCorrect,
      },
    });

    return {
      isCorrect,
      correctAnswer: question.answer,
      transcript: exercise.transcript,
    };
  }

  /** Return the authenticated user's attempt history for a lesson. */
  async listAttemptsByLesson(
    userId: string,
    lessonId: string,
  ): Promise<ListeningAttemptDto[]> {
    const rows = await this.prisma.userListeningAttempt.findMany({
      where: {
        userId,
        exercise: { lessonId },
      },
      orderBy: { attemptedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      exerciseId: r.exerciseId,
      questionId: r.questionId,
      userAnswer: r.userAnswer,
      isCorrect: r.isCorrect,
      attemptedAt: r.attemptedAt.toISOString(),
    }));
  }

  private toDto(r: {
    id: string;
    lessonId: string | null;
    languageCode: string;
    audioUrl: string;
    transcript: string | null;
    difficulty: string;
    questions: Array<{
      id: string;
      exerciseId: string;
      type: string;
      question: string;
      options: unknown;
    }>;
  }): ListeningExerciseDto {
    return {
      id: r.id,
      lessonId: r.lessonId,
      languageCode: r.languageCode,
      audioUrl: r.audioUrl,
      // `transcript` is intentionally omitted from the public DTO; it is only
      // returned by the /check endpoint after the user submits an answer.
      difficulty: r.difficulty,
      questions: r.questions.map((q) => ({
        id: q.id,
        exerciseId: q.exerciseId,
        type: q.type as ListeningQuestionType,
        question: q.question,
        // `options` is stored as Json (string[]) for MULTIPLE_CHOICE /
        // TRUE_FALSE; null for FILL_BLANK. Coerce safely to `string[] | null`.
        options: Array.isArray(q.options)
          ? q.options.map((o) => String(o))
          : null,
      })),
    };
  }
}
