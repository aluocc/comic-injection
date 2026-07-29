// apps/api-gateway/src/modules/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../../database/entities/project.entity';
import { ChapterEntity } from '../../database/entities/chapter.entity';
import { SceneEntity } from '../../database/entities/scene.entity';
import { BlockEntity } from '../../database/entities/block.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { LearningModule } from '../learning/learning.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, ChapterEntity, SceneEntity, BlockEntity]),
    LearningModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
