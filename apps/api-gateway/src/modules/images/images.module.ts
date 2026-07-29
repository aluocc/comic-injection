// apps/api-gateway/src/modules/images/images.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ImageEntity } from '../../database/entities/image.entity';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { ProvidersModule } from '../providers/providers.module';
import { LearningModule } from '../learning/learning.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImageEntity]),
    BullModule.registerQueue({ name: 'ai-tasks' }),
    ProvidersModule,
    LearningModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}