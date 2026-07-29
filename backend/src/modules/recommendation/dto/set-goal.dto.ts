import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * POST /recommendation/goal payload.
 * - `targetLanguage`: one of english / japanese / korean.
 * - `dailyGoal`: target study minutes per day (15 / 30 / 60).
 * - `purpose`: learning purpose; drives the focus modules in path generation.
 */
export class SetGoalDto {
  @IsString()
  @IsIn(['english', 'japanese', 'korean'])
  targetLanguage!: string;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(240)
  dailyGoal!: number;

  @IsString()
  @IsIn(['travel', 'exam', 'work', 'hobby'])
  purpose!: string;
}
