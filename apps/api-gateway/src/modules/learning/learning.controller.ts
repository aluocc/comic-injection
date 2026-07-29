import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { LearningService } from './learning.service';
import { CreateLearningEventDto, CompleteStepDto } from './dto/learning.dto';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private learning: LearningService) {}

  @Get('profile')
  profile(@CurrentUser() user: UserEntity) {
    return this.learning.getProfile(user.id);
  }

  @Get('path')
  path(@CurrentUser() user: UserEntity) {
    return this.learning.getPath(user.id);
  }

  @Post('path/:id/complete-step')
  completeStep(
    @CurrentUser() user: UserEntity,
    @Body() dto: CompleteStepDto,
  ) {
    return this.learning.completeStep(user.id, dto.stepNo);
  }

  @Get('recommendations')
  recommendations(@CurrentUser() user: UserEntity, @Query('limit') limit?: string) {
    return this.learning.generateRecommendations(user.id, limit ? parseInt(limit, 10) : 5);
  }

  @Get('contents')
  contents(@Query('category') category?: string) {
    return this.learning.listContents(category);
  }

  @Post('events')
  trackEvent(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateLearningEventDto,
  ) {
    return this.learning.trackEvent(user.id, dto);
  }

  @Get('events')
  listEvents(@CurrentUser() user: UserEntity, @Query('limit') limit?: string) {
    return this.learning.listEvents(user.id, limit ? parseInt(limit, 10) : 50);
  }
}
