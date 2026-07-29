// apps/api-gateway/src/modules/versions/versions.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowVersionEntity } from '../../database/entities/workflow-version.entity';

@Injectable()
export class VersionsService {
  constructor(
    @InjectRepository(WorkflowVersionEntity) private versions: Repository<WorkflowVersionEntity>,
  ) {}

  async saveSnapshot(workflowId: string, snapshot: Buffer): Promise<number> {
    const latest = await this.versions.findOne({
      where: { workflowId },
      order: { versionNo: 'DESC' },
    });
    const versionNo = (latest?.versionNo ?? 0) + 1;
    await this.versions.save(this.versions.create({ workflowId, yjsSnapshot: snapshot, versionNo }));
    return versionNo;
  }

  getLatest(workflowId: string) {
    return this.versions.findOne({ where: { workflowId }, order: { versionNo: 'DESC' } });
  }

  list(workflowId: string) {
    return this.versions.find({ where: { workflowId }, order: { versionNo: 'DESC' } });
  }
}
