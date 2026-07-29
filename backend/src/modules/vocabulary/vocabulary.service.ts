import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCode } from '../../common/constants/error-code';
import { ReviewGrade } from './dto/submit-review.dto';

/**
 * Public projection of a Vocabulary row, returned by the lesson list and
 * review queue endpoints.
 */
export interface VocabularyDto {
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

/**
 * Projection returned when submitting a review — includes the updated SRS
 * scheduling fields so the client can show the next review time.
 */
export interface ReviewResultDto extends VocabularyDto {
  srsRepetitions: number;
  srsInterval: number;
  srsEase: number;
  nextReviewAt: string;
  lastReviewedAt: string;
}

/**
 * VocabularyService: reads vocabulary lists and runs the SM-2 spaced
 * repetition scheduling for the authenticated user.
 *
 * SM-2 simplified variant (per Task 4 spec):
 * - AGAIN: repetitions=0, interval=1, ease=max(1.3, ease-0.2)
 * - GOOD:  repetitions+1, interval=reps<1?1:reps<5?3:round(interval*ease),
 *          ease unchanged
 * - EASY:  repetitions+1, interval=reps<1?3:reps<5?7:round(interval*ease*1.3),
 *          ease=ease+0.15
 * - nextReviewAt = now + interval days
 *
 * The `repetitions` value used in the interval condition is the value BEFORE
 * the increment (i.e. the number of consecutive successful reviews so far).
 */
@Injectable()
export class VocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all vocabularies attached to a lesson (public). */
  async listByLesson(lessonId: string): Promise<VocabularyDto[]> {
    const rows = await this.prisma.vocabulary.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(this.toDto);
  }

  /**
   * Return the authenticated user's review queue: every vocabulary whose
   * `UserVocabulary.nextReviewAt` is due now or earlier, plus any vocabulary
   * the user has never seen (no UserVocabulary row yet) — limited to keep the
   * session size reasonable.
   */
  async getReviewQueue(userId: string): Promise<VocabularyDto[]> {
    const now = new Date();

    // Vocabularies already tracked and due for review.
    const due = await this.prisma.userVocabulary.findMany({
      where: { userId, nextReviewAt: { lte: now } },
      include: { vocabulary: true },
      orderBy: { nextReviewAt: 'asc' },
      take: 50,
    });

    if (due.length > 0) {
      return due.map((uv) => this.toDto(uv.vocabulary));
    }

    // No due cards: surface unseen vocabularies across all languages so the
    // user always has something to study. Prefer ones attached to a lesson.
    const seen = await this.prisma.userVocabulary.findMany({
      where: { userId },
      select: { vocabularyId: true },
    });
    const seenIds = seen.map((s) => s.vocabularyId);

    const unseen = await this.prisma.vocabulary.findMany({
      where: seenIds.length
        ? { id: { notIn: seenIds }, lessonId: { not: null } }
        : { lessonId: { not: null } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    return unseen.map(this.toDto);
  }

  /**
   * Apply an SM-2 review grade to a vocabulary for the authenticated user.
   * Creates the UserVocabulary row on first review.
   */
  async submitReview(
    userId: string,
    vocabularyId: string,
    grade: ReviewGrade,
  ): Promise<ReviewResultDto> {
    const vocabulary = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
    });
    if (!vocabulary) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `vocabulary not found: ${vocabularyId}`,
      });
    }

    const existing = await this.prisma.userVocabulary.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });

    const reps = existing?.srsRepetitions ?? 0;
    const interval = existing?.srsInterval ?? 0;
    const ease = existing?.srsEase ?? 2.5;

    const next = this.computeSm2(grade, reps, interval, ease);
    const now = new Date();
    const nextReviewAt = new Date(now.getTime() + next.interval * 24 * 60 * 60 * 1000);

    if (existing) {
      const updated = await this.prisma.userVocabulary.update({
        where: { id: existing.id },
        data: {
          srsRepetitions: next.repetitions,
          srsInterval: next.interval,
          srsEase: next.ease,
          nextReviewAt,
          lastReviewedAt: now,
        },
        include: { vocabulary: true },
      });
      return this.toReviewResult(updated.vocabulary, updated);
    }

    const created = await this.prisma.userVocabulary.create({
      data: {
        userId,
        vocabularyId,
        srsRepetitions: next.repetitions,
        srsInterval: next.interval,
        srsEase: next.ease,
        nextReviewAt,
        lastReviewedAt: now,
      },
      include: { vocabulary: true },
    });
    return this.toReviewResult(created.vocabulary, created);
  }

  /**
   * Core SM-2 (simplified) scheduling. Pure function — easy to unit-test.
   * The `reps`/`interval`/`ease` inputs are the values BEFORE this review.
   */
  private computeSm2(
    grade: ReviewGrade,
    reps: number,
    interval: number,
    ease: number,
  ): { repetitions: number; interval: number; ease: number } {
    if (grade === ReviewGrade.AGAIN) {
      return {
        repetitions: 0,
        interval: 1,
        ease: Math.max(1.3, ease - 0.2),
      };
    }

    const newReps = reps + 1;
    if (grade === ReviewGrade.GOOD) {
      const newInterval =
        reps < 1 ? 1 : reps < 5 ? 3 : Math.round(interval * ease);
      return { repetitions: newReps, interval: newInterval, ease };
    }

    // EASY
    const newEase = ease + 0.15;
    const newInterval =
      reps < 1
        ? 3
        : reps < 5
          ? 7
          : Math.round(interval * ease * 1.3);
    return { repetitions: newReps, interval: newInterval, ease: newEase };
  }

  private toDto(v: {
    id: string;
    lessonId: string | null;
    languageCode: string;
    word: string;
    translation: string;
    phonetic: string | null;
    audioUrl: string | null;
    example: string | null;
    exampleTranslation: string | null;
  }): VocabularyDto {
    return {
      id: v.id,
      lessonId: v.lessonId,
      languageCode: v.languageCode,
      word: v.word,
      translation: v.translation,
      phonetic: v.phonetic,
      audioUrl: v.audioUrl,
      example: v.example,
      exampleTranslation: v.exampleTranslation,
    };
  }

  private toReviewResult(
    vocabulary: {
      id: string;
      lessonId: string | null;
      languageCode: string;
      word: string;
      translation: string;
      phonetic: string | null;
      audioUrl: string | null;
      example: string | null;
      exampleTranslation: string | null;
    },
    uv: {
      srsRepetitions: number;
      srsInterval: number;
      srsEase: number;
      nextReviewAt: Date;
      lastReviewedAt: Date | null;
    },
  ): ReviewResultDto {
    return {
      ...this.toDto(vocabulary),
      srsRepetitions: uv.srsRepetitions,
      srsInterval: uv.srsInterval,
      srsEase: uv.srsEase,
      nextReviewAt: uv.nextReviewAt.toISOString(),
      lastReviewedAt: (uv.lastReviewedAt ?? new Date()).toISOString(),
    };
  }
}
