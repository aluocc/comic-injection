// apps/api-gateway/src/modules/providers/dto/upsert-api-key.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpsertApiKeyDto {
  @IsString() @MinLength(1) @MaxLength(64) provider: string;
  @IsString() @MinLength(1) @MaxLength(256) apiKey: string;
}
