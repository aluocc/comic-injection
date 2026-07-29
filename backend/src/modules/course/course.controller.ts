import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';
import { CourseService } from './course.service';
import { OptionalJwtGuard } from './optional-jwt.guard';

interface OptionalAuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Course endpoints (all public; JWT optional).
 *
 * - GET /courses/languages                  — list all languages
 * - GET /courses/languages/:langCode/tree   — full level/unit/lesson tree
 * - GET /courses/lessons/:lessonId          — single lesson detail
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('courses')
export class CourseController {
  constructor(private readonly course: CourseService) {}

  @Get('languages')
  async listLanguages() {
    return this.course.listLanguages();
  }

  @UseGuards(OptionalJwtGuard)
  @Get('languages/:langCode/tree')
  async getLanguageTree(
    @Param('langCode') langCode: string,
    @Req() req: OptionalAuthRequest,
  ) {
    // `req.user` is present only when a valid Bearer token was supplied.
    // When present, the service attaches per-lesson `userProgress` to every
    // lesson in the tree (Task 8).
    const userId = req.user?.sub;
    return this.course.getLanguageTree(langCode, userId);
  }

  @Get('lessons/:lessonId')
  async getLesson(@Param('lessonId') lessonId: string) {
    return this.course.getLesson(lessonId);
  }
}
