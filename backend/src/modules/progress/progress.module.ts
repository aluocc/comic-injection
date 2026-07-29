import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { AchievementModule } from '../achievement/achievement.module';

/**
 * ProgressModule: per-lesson progress tracking, dashboard aggregation, and
 * streak persistence (Redis-backed).
 *
 * `PassportModule` is imported so the `JwtAuthGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` itself is
 * registered globally by `AuthModule`. `PrismaService` and `RedisService`
 * are exported by their own `@Global()` modules, so they don't need to be
 * re-imported here.
 *
 * `AchievementModule` is imported so `ProgressService.completeLesson` can
 * call `AchievementService.updateLeaderboard` to bump the weekly ZSET on
 * each lesson completion. This one-way dependency (Progress → Achievement)
 * avoids any circular import because `AchievementModule` does not import
 * `ProgressModule`.
 */
@Module({
  imports: [PassportModule, AchievementModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
