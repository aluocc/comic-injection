import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { CommunityService } from './community.service';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, LikeDto } from './dto/community.dto';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private community: CommunityService) {}

  @Get('posts')
  listPosts(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: UserEntity,
  ) {
    return this.community.listPosts(
      category,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      user?.id,
    );
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string, @CurrentUser() user?: UserEntity) {
    return this.community.getPost(id, user?.id);
  }

  @Post('posts')
  createPost(@CurrentUser() user: UserEntity, @Body() dto: CreatePostDto) {
    return this.community.createPost(user.id, dto);
  }

  @Patch('posts/:id')
  updatePost(@Param('id') id: string, @CurrentUser() user: UserEntity, @Body() dto: UpdatePostDto) {
    return this.community.updatePost(id, user.id, dto);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    await this.community.deletePost(id, user.id);
  }

  @Get('posts/:id/comments')
  listComments(@Param('id') id: string, @CurrentUser() user?: UserEntity) {
    return this.community.listComments(id, user?.id);
  }

  @Post('posts/:id/comments')
  createComment(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateCommentDto,
  ) {
    return this.community.createComment(id, user.id, dto);
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    await this.community.deleteComment(id, user.id);
  }

  @Post('like')
  toggleLike(@CurrentUser() user: UserEntity, @Body() dto: LikeDto) {
    return this.community.toggleLike(user.id, dto);
  }

  @Get('leaderboard')
  leaderboard(@Query('limit') limit?: string) {
    return this.community.getLeaderboard(limit ? parseInt(limit, 10) : 20);
  }
}
