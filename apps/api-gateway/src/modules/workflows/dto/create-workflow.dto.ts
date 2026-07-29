// apps/api-gateway/src/modules/workflows/dto/create-workflow.dto.ts
import { IsString, MaxLength, MinLength, IsIn, IsOptional } from 'class-validator';

export class CreateWorkflowDto {
  @IsString() @MinLength(1) @MaxLength(120) title: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsIn(['private', 'unlisted', 'public']) visibility?: 'private' | 'unlisted' | 'public';
}
