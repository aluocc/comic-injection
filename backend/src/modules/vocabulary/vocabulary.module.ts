import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

/**
 * VocabularyModule: flashcard list + SM-2 spaced repetition endpoints.
 *
 * `PassportModule` is imported so the `JwtAuthGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` itself is
 * registered globally by `AuthModule`, so it does not need to be re-provided
 * here.
 */
@Module({
  imports: [PassportModule],
  controllers: [VocabularyController],
  providers: [VocabularyService],
})
export class VocabularyModule {}
