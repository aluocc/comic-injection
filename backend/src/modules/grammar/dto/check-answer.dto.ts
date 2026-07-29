import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * POST /grammar/:questionId/check payload.
 * `userAnswer` is compared against `GrammarQuestion.answer` after both sides
 * are trimmed and lower-cased.
 */
export class CheckAnswerDto {
  @IsString({ message: 'userAnswer must be a string' })
  @IsNotEmpty({ message: 'userAnswer must not be empty' })
  @MaxLength(2000, { message: 'userAnswer is too long' })
  userAnswer!: string;
}
