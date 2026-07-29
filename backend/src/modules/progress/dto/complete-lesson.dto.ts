import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * POST /progress/lesson/:lessonId/complete payload.
 * - `accuracy`: 0..1 (e.g. 0.85 = 85%)
 * - `timeSpent`: seconds spent on this lesson session
 */
export class CompleteLessonDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  accuracy?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeSpent?: number;
}
