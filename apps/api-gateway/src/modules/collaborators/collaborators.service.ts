// apps/api-gateway/src/modules/collaborators/collaborators.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowCollaboratorEntity } from '../../database/entities/workflow-collaborator.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class CollaboratorsService {
  constructor(
    @InjectRepository(WorkflowCollaboratorEntity) private collabs: Repository<WorkflowCollaboratorEntity>,
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    private workflows: WorkflowsService,
  ) {}

  async invite(workflowId: string, inviterId: string, email: string, role: 'editor' | 'viewer') {
    if (!(await this.workflows.canEdit(workflowId, inviterId))) throw new ForbiddenException();
    const invitee = await this.users.findOne({ where: { email } });
    if (!invitee) throw new NotFoundException('user not found');
    const exists = await this.collabs.findOne({ where: { workflowId, userId: invitee.id } });
    if (exists) throw new ConflictException('already a collaborator');
    return this.collabs.save(this.collabs.create({ workflowId, userId: invitee.id, role }));
  }

  list(workflowId: string, _requesterId: string) {
    return this.collabs.find({ where: { workflowId } });
  }
}
