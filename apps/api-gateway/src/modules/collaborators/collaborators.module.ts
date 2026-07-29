// apps/api-gateway/src/modules/collaborators/collaborators.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowCollaboratorEntity } from '../../database/entities/workflow-collaborator.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { WorkflowsModule } from '../workflows/workflows.module';
import { CollaboratorsController } from './collaborators.controller';
import { CollaboratorsService } from './collaborators.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowCollaboratorEntity, UserEntity]), WorkflowsModule],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService],
})
export class CollaboratorsModule {}
