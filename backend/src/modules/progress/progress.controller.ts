import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProgressService } from './progress.service';
import { CompleteLessonDto } from './dto/complete-lesson.dto';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Progress endpoints (all JWT-protected):
 * - POST /progress/lesson/:lessonId/start     — mark lesson started
 * - POST /progress/lesson/:lessonId/complete  — record completion + bump streak
 * - GET  /progress/lesson/:lessonId           — get one lesson's progress
 * - GET  /progress/dashboard                  — full dashboard payload
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @UseGuards(JwtAuthGuard)
  @Post('lesson/:lessonId/start')
  async startLesson(
    @Param('lessonId') lessonId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progress.markLessonStarted(req.user.sub, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('lesson/:lessonId/complete')
  async completeLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: CompleteLessonDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progress.completeLesson(req.user.sub, lessonId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId')
  async getLessonProgress(
    @Param('lessonId') lessonId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progress.getLessonProgress(req.user.sub, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return this.progress.getDashboard(req.user.sub);
  }
}
