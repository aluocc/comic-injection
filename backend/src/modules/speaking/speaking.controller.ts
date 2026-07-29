import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';
import { SpeakingService } from './speaking.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorCode } from '../../common/constants/error-code';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * On-disk directory where user-uploaded speaking audio is stored. Resolved
 * relative to the backend process cwd (the `backend/` folder when run via
 * `nest start`), matching the static-asset root configured in `main.ts`.
 */
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'speaking');
// Ensure the destination exists before multer tries to write into it. This is
// also done in main.ts at bootstrap, but the guard here keeps uploads working
// even if the static-asset wiring is later removed.
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Speaking endpoints:
 * - POST /speaking/upload                  — upload an audio file (JWT)
 * - GET  /speaking/lesson/:lessonId        — list speaking exercises for a lesson (public)
 * - POST /speaking/:exerciseId/attempt     — submit a transcription attempt (JWT)
 * - GET  /speaking/lesson/:lessonId/attempts — current user's attempt history (JWT)
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('speaking')
export class SpeakingController {
  constructor(private readonly speaking: SpeakingService) {}

  /**
   * Upload a single audio file (form field name: `audio`) and return its
   * public URL. Files are persisted to `backend/uploads/speaking/` and served
   * by the static-asset middleware registered in `main.ts` under `/uploads/`.
   */
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname) || '.webm'}`;
          cb(null, unique);
        },
      }),
      limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB cap — enough for short read-aloud clips
      },
    }),
  )
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_FAILED,
        message: "audio file is required (form field 'audio')",
      });
    }
    return { url: `/uploads/speaking/${file.filename}` };
  }

  @Get('lesson/:lessonId')
  async listByLesson(@Param('lessonId') lessonId: string) {
    return this.speaking.listByLesson(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId/attempts')
  async listAttempts(
    @Param('lessonId') lessonId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.speaking.listAttemptsByLesson(req.user.sub, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':exerciseId/attempt')
  async submitAttempt(
    @Param('exerciseId') exerciseId: string,
    @Body() dto: SubmitAttemptDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.speaking.submitAttempt(
      req.user.sub,
      exerciseId,
      dto.transcription,
    );
  }
}
