import { IsEnum } from 'class-validator';

/**
 * Memory grade submitted after reviewing a flashcard.
 * Maps to an SM-2 quality score:
 * - AGAIN → 0 (forgotten, reset repetitions)
 * - GOOD  → 3 (correct, default ease)
 * - EASY  → 5 (perfect, boost ease + interval)
 */
export enum ReviewGrade {
  AGAIN = 'AGAIN',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

/**
 * POST /vocabulary/:vocabularyId/review payload.
 */
export class SubmitReviewDto {
  @IsEnum(ReviewGrade, {
    message: 'grade must be one of AGAIN, GOOD, EASY',
  })
  grade!: ReviewGrade;
}
