// apps/api-gateway/src/modules/projects/dto/block.dto.ts
import { IsString, IsObject, IsInt, IsOptional } from 'class-validator';

export class CreateBlockDto {
  @IsString() type: string;
  @IsObject() content: unknown;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
  @IsOptional() @IsInt() orderIndex?: number;
}

export class UpdateBlockDto {
  @IsOptional() @IsObject() content?: unknown;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
  @IsOptional() @IsInt() orderIndex?: number;
}
