// apps/api-gateway/src/modules/versions/versions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowVersionEntity } from '../../database/entities/workflow-version.entity';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowVersionEntity])],
  controllers: [VersionsController],
  providers: [VersionsService],
  exports: [VersionsService],
})
export class VersionsModule {}
