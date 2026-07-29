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
import { VocabularyService } from './vocabulary.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Vocabulary endpoints:
 * - GET  /vocabulary/lesson/:lessonId        — list vocabularies for a lesson (public)
 * - GET  /vocabulary/review                   — current user's due review queue (JWT)
 * - POST /vocabulary/:vocabularyId/review     — submit a memory grade (JWT)
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabulary: VocabularyService) {}

  @Get('lesson/:lessonId')
  async listByLesson(@Param('lessonId') lessonId: string) {
    return this.vocabulary.listByLesson(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('review')
  async getReviewQueue(@Req() req: AuthenticatedRequest) {
    return this.vocabulary.getReviewQueue(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':vocabularyId/review')
  async submitReview(
    @Param('vocabularyId') vocabularyId: string,
    @Body() dto: SubmitReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.vocabulary.submitReview(req.user.sub, vocabularyId, dto.grade);
  }
}
