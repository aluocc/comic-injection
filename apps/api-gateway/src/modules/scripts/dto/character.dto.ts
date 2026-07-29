// apps/api-gateway/src/modules/scripts/dto/character.dto.ts
import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateCharacterDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() aliases?: string[];
}

export class UpdateCharacterDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() aliases?: string[];
}
