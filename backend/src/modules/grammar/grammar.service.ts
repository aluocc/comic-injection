import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCode } from '../../common/constants/error-code';

/**
 * Grammar question types supported by the practice module.
 * Mirrors the `type` column on the GrammarQuestion table.
 */
export type GrammarQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'CORRECTION';

/**
 * Public projection of a GrammarQuestion row, returned by the lesson list
 * endpoint. Crucially, this DOES NOT include `answer` or `explanation` so
 * clients cannot peek at the solution before submitting.
 */
export interface GrammarQuestionDto {
  id: string;
  lessonId: string | null;
  languageCode: string;
  type: GrammarQuestionType;
  question: string;
  options: string[] | null;
}

/**
 * Response returned after submitting an answer. Includes the correct answer
 * and explanation so the client can show feedback and a worked explanation.
 */
export interface CheckResultDto {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
}

/**
 * A single attempt row in the current user's history for a lesson.
 */
export interface GrammarAttemptDto {
  id: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  attemptedAt: string;
}

/**
 * GrammarService: serves grammar questions for a lesson, grades submitted
 * answers, and records the attempt under the authenticated user.
 *
 * Grading rule (per Task 5 spec):
 *   isCorrect = userAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
 */
@Injectable()
export class GrammarService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all grammar questions attached to a lesson (public). */
  async listByLesson(lessonId: string): Promise<GrammarQuestionDto[]> {
    const rows = await this.prisma.grammarQuestion.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(this.toDto);
  }

  /**
   * Grade a user's answer for a grammar question, persist the attempt, and
   * return the correct answer + explanation.
   */
  async check(
    userId: string,
    questionId: string,
    userAnswer: string,
  ): Promise<CheckResultDto> {
    const question = await this.prisma.grammarQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `grammar question not found: ${questionId}`,
      });
    }

    const isCorrect =
      userAnswer.trim().toLowerCase() ===
      question.answer.trim().toLowerCase();

    await this.prisma.userGrammarAttempt.create({
      data: {
        userId,
        questionId,
        userAnswer,
        isCorrect,
      },
    });

    return {
      isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
    };
  }

  /** Return the authenticated user's attempt history for a lesson. */
  async listAttemptsByLesson(
    userId: string,
    lessonId: string,
  ): Promise<GrammarAttemptDto[]> {
    const rows = await this.prisma.userGrammarAttempt.findMany({
      where: {
        userId,
        question: { lessonId },
      },
      orderBy: { attemptedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      questionId: r.questionId,
      userAnswer: r.userAnswer,
      isCorrect: r.isCorrect,
      attemptedAt: r.attemptedAt.toISOString(),
    }));
  }

  private toDto(q: {
    id: string;
    lessonId: string | null;
    languageCode: string;
    type: string;
    question: string;
    options: unknown;
  }): GrammarQuestionDto {
    // `options` is stored as Json (string[]) for MULTIPLE_CHOICE; null for
    // FILL_BLANK / CORRECTION. Coerce safely to `string[] | null`.
    let options: string[] | null = null;
    if (Array.isArray(q.options)) {
      options = q.options.map((o) => String(o));
    }
    return {
      id: q.id,
      lessonId: q.lessonId,
      languageCode: q.languageCode,
      type: q.type as GrammarQuestionType,
      question: q.question,
      options,
    };
  }
}
