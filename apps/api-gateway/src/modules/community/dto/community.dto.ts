import { IsString, IsOptional, IsIn, IsArray, IsUUID } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  @IsIn(['showcase', 'help', 'discussion', 'feedback'])
  category!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdatePostDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() content?: string;
  @IsString() @IsIn(['showcase', 'help', 'discussion', 'feedback']) @IsOptional() category?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() tags?: string[];
}

export class CreateCommentDto {
  @IsString()
  content!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class LikeDto {
  @IsString()
  @IsIn(['post', 'comment'])
  targetType!: string;

  @IsUUID()
  targetId!: string;
}
