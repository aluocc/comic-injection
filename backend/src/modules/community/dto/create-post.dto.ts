import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * POST /community/circles/:langCode/posts payload.
 * - title: 1-200 chars
 * - content: 1-10000 chars
 * - tags: optional string array
 */
export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
