import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';

/**
 * AchievementModule: badge seeding, badge awarding, and the weekly
 * leaderboard backed by a Redis ZSET.
 *
 * `PassportModule` is imported so the `JwtAuthGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` itself is
 * registered globally by `AuthModule`. `PrismaService` and `RedisService`
 * are exported by their own `@Global()` modules, so they don't need to be
 * re-imported here.
 *
 * `AchievementService` is exported so `ProgressModule` can import this
 * module and call `updateLeaderboard` from `completeLesson` without
 * creating a circular dependency (this module does not import
 * `ProgressModule`).
 */
@Module({
  imports: [PassportModule],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}
