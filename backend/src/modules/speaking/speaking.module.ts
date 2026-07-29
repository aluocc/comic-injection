import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SpeakingController } from './speaking.controller';
import { SpeakingService } from './speaking.service';

/**
 * SpeakingModule: speaking read-along practice endpoints.
 *
 * `PassportModule` is imported so the `JwtAuthGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` itself is
 * registered globally by `AuthModule`, so it does not need to be re-provided
 * here.
 *
 * File upload uses `FileInterceptor` from `@nestjs/platform-express` (the
 * `@nestjs/multer` package was merged into `@nestjs/platform-express` in
 * NestJS 11), so no extra module import is needed for multer.
 */
@Module({
  imports: [PassportModule],
  controllers: [SpeakingController],
  providers: [SpeakingService],
})
export class SpeakingModule {}
