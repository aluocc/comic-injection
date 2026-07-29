// apps/api-gateway/src/modules/projects/dto/scene.dto.ts
import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';

export class CreateSceneDto {
  @IsString() title: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsArray() characters?: string[];
  @IsOptional() @IsInt() orderIndex?: number;
}

export class UpdateSceneDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsArray() characters?: string[];
  @IsOptional() @IsInt() orderIndex?: number;
}
