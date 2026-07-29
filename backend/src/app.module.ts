import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { CourseModule } from './modules/course/course.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { GrammarModule } from './modules/grammar/grammar.module';
import { SpeakingModule } from './modules/speaking/speaking.module';
import { ListeningModule } from './modules/listening/listening.module';
import { ProgressModule } from './modules/progress/progress.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { CommunityModule } from './modules/community/community.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { HealthController } from './health/health.controller';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Global rate limit: 100 requests per minute per client IP.
 * Prevents brute-force attacks on /auth/login, /auth/register, and
 * abuse of community / speaking upload endpoints.
 */
const THROTTLE_TTL_MS = 60_000;
const THROTTLE_LIMIT = 100;

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLE_TTL_MS,
        limit: THROTTLE_LIMIT,
      },
    ]),
    ConfigConfigModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    CourseModule,
    VocabularyModule,
    GrammarModule,
    SpeakingModule,
    ListeningModule,
    ProgressModule,
    RecommendationModule,
    CommunityModule,
    AchievementModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
