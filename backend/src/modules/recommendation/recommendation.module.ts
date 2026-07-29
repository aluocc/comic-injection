import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

/**
 * RecommendationModule: placement quiz, learning-goal persistence, and
 * the rule-based personalized weekly-path generator.
 *
 * `PassportModule` is imported so the `JwtAuthGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` itself is
 * registered globally by `AuthModule`. `PrismaService` and `RedisService`
 * are exported by their own `@Global()` modules, so they don't need to be
 * re-imported here.
 *
 * To wire this module into the app, add the following to
 * `backend/src/app.module.ts`:
 *
 *   import { RecommendationModule } from './modules/recommendation/recommendation.module';
 *
 * and add `RecommendationModule` to the `imports` array of `@Module`.
 */
@Module({
  imports: [PassportModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
