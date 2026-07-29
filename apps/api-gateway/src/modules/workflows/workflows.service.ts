// apps/api-gateway/src/modules/workflows/workflows.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowEntity } from '../../database/entities/workflow.entity';
import { WorkflowCollaboratorEntity } from '../../database/entities/workflow-collaborator.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(WorkflowEntity) private workflows: Repository<WorkflowEntity>,
    @InjectRepository(WorkflowCollaboratorEntity) private collabs: Repository<WorkflowCollaboratorEntity>,
  ) {}

  listForUser(userId: string) {
    return this.workflows
      .createQueryBuilder('w')
      .leftJoin('w.collaborators', 'c')
      .where('w.ownerId = :uid', { uid: userId })
      .orWhere('c.userId = :uid', { uid: userId })
      .getMany();
  }

  async create(ownerId: string, dto: CreateWorkflowDto) {
    const wf = await this.workflows.save(
      this.workflows.create({ ownerId, ...dto, visibility: dto.visibility ?? 'private' }),
    );
    await this.collabs.save(this.collabs.create({ workflowId: wf.id, userId: ownerId, role: 'owner' }));
    return wf;
  }

  async findOne(id: string, userId: string) {
    const wf = await this.workflows.findOne({ where: { id } });
    if (!wf) throw new NotFoundException();
    if (!(await this.canAccess(id, userId))) throw new ForbiddenException();
    return wf;
  }

  async canAccess(workflowId: string, userId: string): Promise<boolean> {
    const c = await this.collabs.findOne({ where: { workflowId, userId } });
    return !!c;
  }

  async canEdit(workflowId: string, userId: string): Promise<boolean> {
    const c = await this.collabs.findOne({ where: { workflowId, userId } });
    return c?.role === 'owner' || c?.role === 'editor';
  }
}
