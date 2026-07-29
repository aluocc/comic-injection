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
import { GrammarService } from './grammar.service';
import { CheckAnswerDto } from './dto/check-answer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Grammar endpoints:
 * - GET  /grammar/lesson/:lessonId          — list grammar questions for a lesson (public)
 * - GET  /grammar/lesson/:lessonId/attempts — current user's attempt history (JWT)
 * - POST /grammar/:questionId/check         — submit an answer (JWT)
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('grammar')
export class GrammarController {
  constructor(private readonly grammar: GrammarService) {}

  @Get('lesson/:lessonId')
  async listByLesson(@Param('lessonId') lessonId: string) {
    return this.grammar.listByLesson(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId/attempts')
  async listAttempts(
    @Param('lessonId') lessonId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.grammar.listAttemptsByLesson(req.user.sub, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':questionId/check')
  async check(
    @Param('questionId') questionId: string,
    @Body() dto: CheckAnswerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.grammar.check(req.user.sub, questionId, dto.userAnswer);
  }
}
