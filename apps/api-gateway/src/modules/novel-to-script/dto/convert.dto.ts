// apps/api-gateway/src/modules/novel-to-script/dto/convert.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ConvertDto {
  @IsString() sourceText: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsBoolean async?: boolean;
}
