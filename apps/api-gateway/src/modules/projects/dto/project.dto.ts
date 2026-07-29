// apps/api-gateway/src/modules/projects/dto/project.dto.ts
import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString() title: string;
  @IsIn(['novel', 'script', 'article']) type: 'novel' | 'script' | 'article';
  @IsOptional() @IsString() description?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
}
