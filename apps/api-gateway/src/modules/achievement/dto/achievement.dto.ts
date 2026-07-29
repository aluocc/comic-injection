import { IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class CreateAchievementDto {
  @IsString()
  key!: string;

  @IsString()
  name!: string;

  @IsString() @IsOptional() description?: string;

  @IsString() @IsOptional() icon?: string;

  @IsString() @IsIn(['creation', 'social', 'learning', 'milestone']) @IsOptional() category?: string;

  @IsString() @IsOptional() condition?: string; // JSON string

  @IsInt() @Min(0) @IsOptional() points?: number;
}
