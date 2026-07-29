// apps/api-gateway/src/modules/workflows/workflows.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowEntity } from '../../database/entities/workflow.entity';
import { WorkflowCollaboratorEntity } from '../../database/entities/workflow-collaborator.entity';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowEntity, WorkflowCollaboratorEntity])],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
