// apps/api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { CollaboratorsModule } from './modules/collaborators/collaborators.module';
import { VersionsModule } from './modules/versions/versions.module';
import { CollabModule } from './modules/collab/collab.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { AiPromptsModule } from './modules/ai-prompts/ai-prompts.module';
import { NovelToScriptModule } from './modules/novel-to-script/novel-to-script.module';
import { ImagesModule } from './modules/images/images.module';
import { ShotsModule } from './modules/shots/shots.module';
import { LearningModule } from './modules/learning/learning.module';
import { CommunityModule } from './modules/community/community.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('redis.url') ?? 'redis://localhost:6379' },
      }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProvidersModule,
    WorkflowsModule,
    CollaboratorsModule,
    VersionsModule,
    CollabModule,
    FilesModule,
    HealthModule,
    TasksModule,
    ProjectsModule,
    ScriptsModule,
    AiPromptsModule,
    NovelToScriptModule,
    ImagesModule,
    ShotsModule,
    LearningModule,
    CommunityModule,
    AchievementModule,
  ],
})
export class AppModule {}
