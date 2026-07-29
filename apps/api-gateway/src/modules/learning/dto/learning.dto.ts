import { IsString, IsOptional, IsUUID, IsObject, IsInt, IsIn, IsArray, Min, Max } from 'class-validator';

export class CreateLearningEventDto {
  @IsString()
  @IsIn([
    'project_created', 'scene_completed', 'chapter_finished',
    'image_generated', 'shot_completed', 'video_generated',
    'ai_assisted', 'novel_to_script', 'tutorial_viewed', 'collab_joined',
  ])
  eventType!: string;

  @IsString()
  @IsOptional()
  @IsIn(['project', 'scene', 'shot', 'image', 'chapter'])
  entityType?: string;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CompleteStepDto {
  @IsInt()
  @Min(0)
  stepNo!: number;
}

export class CreateLearningContentDto {
  @IsString()
  @IsIn(['tutorial', 'template', 'challenge', 'tip'])
  type!: string;

  @IsString()
  @IsIn(['writing', 'directing', 'art', 'technical'])
  category!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  difficulty!: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  prerequisites?: { skills: Partial<Record<string, number>> };
}
