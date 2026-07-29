// apps/api-gateway/src/modules/images/dto/image.dto.ts
import { IsString, IsIn, IsOptional, IsNumber } from 'class-validator';

export class GenerateImageDto {
  @IsIn(['character', 'prop', 'scene', 'other']) type: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsString() prompt: string;
  @IsIn(['sd', 'dalle', 'midjourney']) model: string;
  @IsOptional() @IsString() style?: string;
  @IsOptional() @IsString() negativePrompt?: string;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
}

export class UploadImageDto {
  @IsString() url: string;
  @IsIn(['character', 'prop', 'scene', 'other']) type: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() prompt?: string;
}