import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * POST /speaking/:exerciseId/attempt payload.
 *
 * `transcription` is the text the user spoke/typed. The frontend may obtain it
 * via the Web Speech API (SpeechRecognition) or, when unsupported, from a
 * manual text input. The backend grades it against `SpeakingExercise.text`
 * using a word-level Levenshtein alignment.
 */
export class SubmitAttemptDto {
  @IsString({ message: 'transcription must be a string' })
  @IsNotEmpty({ message: 'transcription must not be empty' })
  @MaxLength(5000, { message: 'transcription is too long' })
  transcription!: string;
}
