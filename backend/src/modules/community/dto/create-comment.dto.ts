import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * POST /community/posts/:postId/comments payload.
 * - content: 1-2000 chars
 */
export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
