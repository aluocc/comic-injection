import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * POST /listening/:exerciseId/check payload.
 *
 * `questionId` identifies which ListeningQuestion of the exercise is being
 * answered; `userAnswer` is compared against `ListeningQuestion.answer` after
 * both sides are trimmed and lower-cased.
 */
export class CheckAnswerDto {
  @IsString({ message: 'questionId must be a string' })
  @IsNotEmpty({ message: 'questionId must not be empty' })
  @MaxLength(200, { message: 'questionId is too long' })
  questionId!: string;

  @IsString({ message: 'userAnswer must be a string' })
  @IsNotEmpty({ message: 'userAnswer must not be empty' })
  @MaxLength(2000, { message: 'userAnswer is too long' })
  userAnswer!: string;
}
