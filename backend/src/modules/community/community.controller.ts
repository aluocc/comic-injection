import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Community endpoints (Task 10):
 *
 * Public:
 * - GET  /community/circles                    — list all circles (+postCount)
 * - GET  /community/circles/:langCode/posts    — paginated posts in a circle
 * - GET  /community/posts/:postId              — post detail with comments
 *
 * JWT-protected:
 * - POST   /community/circles/:langCode/posts  — create a post
 * - POST   /community/posts/:postId/comments   — create a comment
 * - POST   /community/posts/:postId/like       — toggle like
 * - DELETE /community/posts/:postId            — delete own post
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('community')
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('circles')
  async listCircles() {
    return this.community.listCircles();
  }

  @Get('circles/:langCode/posts')
  async listPosts(
    @Param('langCode') langCode: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.community.listPosts(
      langCode,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('circles/:langCode/posts')
  async createPost(
    @Param('langCode') langCode: string,
    @Body() dto: CreatePostDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.community.createPost(langCode, req.user.sub, dto);
  }

  @Get('posts/:postId')
  async getPost(@Param('postId') postId: string) {
    return this.community.getPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.community.createComment(postId, req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/like')
  async toggleLike(
    @Param('postId') postId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.community.toggleLike(postId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:postId')
  async deletePost(
    @Param('postId') postId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.community.deletePost(postId, req.user.sub);
  }
}
