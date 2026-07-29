// apps/api-gateway/src/modules/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TaskEntity } from '../../database/entities/task.entity';
import { ImageEntity } from '../../database/entities/image.entity';
import { ShotEntity } from '../../database/entities/shot.entity';
import { TasksController } from './tasks.controller';
import { InternalTasksController } from './internal.controller';
import { TasksService } from './tasks.service';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity, ImageEntity, ShotEntity]),
    BullModule.registerQueue({ name: 'ai-tasks' }),
    ProvidersModule,
  ],
  controllers: [TasksController, InternalTasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
