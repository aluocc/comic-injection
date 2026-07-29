import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationService } from './recommendation.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { SetGoalDto } from './dto/set-goal.dto';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Recommendation endpoints:
 *
 * - GET  /recommendation/placement-quiz         (public) — list quiz questions
 * - POST /recommendation/placement-quiz/submit  (JWT)    — grade + persist level
 * - POST /recommendation/goal                   (JWT)    — set learning goal
 * - GET  /recommendation/path                   (JWT)    — generate weekly plan
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly recommendation: RecommendationService) {}

  @Get('placement-quiz')
  async getPlacementQuiz() {
    return this.recommendation.listPlacementQuestions();
  }

  @UseGuards(JwtAuthGuard)
  @Post('placement-quiz/submit')
  async submitQuiz(
    @Body() dto: SubmitQuizDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recommendation.submitQuiz(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('goal')
  async setGoal(
    @Body() dto: SetGoalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recommendation.setGoal(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('path')
  async getPath(@Req() req: AuthenticatedRequest) {
    return this.recommendation.generatePath(req.user.sub);
  }
}
