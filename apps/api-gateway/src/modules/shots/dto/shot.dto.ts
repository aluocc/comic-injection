// apps/api-gateway/src/modules/shots/dto/shot.dto.ts
import { IsString, IsIn, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateShotDto {
  @IsUUID() sceneId: string;
  @IsIn(['wide', 'medium', 'closeup', 'extreme_closeup', 'over_shoulder', 'aerial'])
  @IsOptional()
  shotType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() prompt?: string;
  @IsOptional() @IsString() negativePrompt?: string;
  @IsOptional() @IsUUID() referenceImageId?: string;
  @IsOptional() @IsNumber() duration?: number;
}

export class UpdateShotDto {
  @IsIn(['wide', 'medium', 'closeup', 'extreme_closeup', 'over_shoulder', 'aerial'])
  @IsOptional()
  shotType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() prompt?: string;
  @IsOptional() @IsString() negativePrompt?: string;
  @IsOptional() @IsUUID() referenceImageId?: string;
  @IsOptional() @IsNumber() duration?: number;
}

export class GenerateVideoDto {
  @IsUUID() shotId: string;
  @IsIn(['runway', 'pika', 'svd']) model: string;
  @IsOptional() @IsString() prompt?: string;
  @IsOptional() @IsUUID() referenceImageId?: string;
  @IsOptional() @IsNumber() duration?: number;
}