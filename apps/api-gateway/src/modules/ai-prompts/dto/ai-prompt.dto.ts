// apps/api-gateway/src/modules/ai-prompts/dto/ai-prompt.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator';

export class AiPromptDto {
  @IsIn(['generate', 'expand', 'compress', 'polish', 'check', 'outline', 'nextScene'])
  operation: string;
  @IsString() prompt: string;
  @IsOptional() @IsString() context?: string;
  @IsOptional() @IsString() style?: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() sceneId?: string;
}
