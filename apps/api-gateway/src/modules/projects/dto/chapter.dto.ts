// apps/api-gateway/src/modules/projects/dto/chapter.dto.ts
import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateChapterDto {
  @IsString() title: string;
  @IsOptional() @IsInt() orderIndex?: number;
}

export class UpdateChapterDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsInt() orderIndex?: number;
}
