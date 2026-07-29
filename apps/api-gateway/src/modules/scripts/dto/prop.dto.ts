// apps/api-gateway/src/modules/scripts/dto/prop.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreatePropDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdatePropDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
}
