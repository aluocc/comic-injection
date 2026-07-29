import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single answer in the placement quiz submission.
 * - `questionId`: id of the placement question (hardcoded id like 'q1').
 * - `userAnswer`: the option text chosen by the user.
 */
export class QuizAnswerDto {
  @IsString()
  questionId!: string;

  @IsString()
  userAnswer!: string;
}

/**
 * POST /recommendation/placement-quiz/submit payload.
 * At least one answer is required; grading is performed against the
 * hardcoded placement-question answer key.
 */
export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
