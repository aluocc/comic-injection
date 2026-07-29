// apps/api-gateway/src/modules/shots/shots.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ShotEntity } from '../../database/entities/shot.entity';
import { ShotsController } from './shots.controller';
import { ShotsService } from './shots.service';
import { ProvidersModule } from '../providers/providers.module';
import { LearningModule } from '../learning/learning.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShotEntity]),
    BullModule.registerQueue({ name: 'ai-tasks' }),
    ProvidersModule,
    LearningModule,
  ],
  controllers: [ShotsController],
  providers: [ShotsService],
  exports: [ShotsService],
})
export class ShotsModule {}