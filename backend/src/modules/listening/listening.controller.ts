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
import { ListeningService } from './listening.service';
import { CheckAnswerDto } from './dto/check-answer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Listening endpoints:
 * - GET  /listening/lesson/:lessonId          — list listening exercises for a lesson (public)
 * - GET  /listening/lesson/:lessonId/attempts — current user's attempt history (JWT)
 * - POST /listening/:exerciseId/check          — submit an answer (JWT)
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('listening')
export class ListeningController {
  constructor(private readonly listening: ListeningService) {}

  @Get('lesson/:lessonId')
  async listByLesson(@Param('lessonId') lessonId: string) {
    return this.listening.listByLesson(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId/attempts')
  async listAttempts(
    @Param('lessonId') lessonId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.listening.listAttemptsByLesson(req.user.sub, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':exerciseId/check')
  async check(
    @Param('exerciseId') exerciseId: string,
    @Body() dto: CheckAnswerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.listening.check(
      req.user.sub,
      exerciseId,
      dto.questionId,
      dto.userAnswer,
    );
  }
}
