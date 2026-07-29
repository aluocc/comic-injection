// apps/api-gateway/src/database/entities/workflow-version.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index,
} from 'typeorm';
import { WorkflowEntity } from './workflow.entity';

@Entity('workflow_versions')
@Index(['workflowId', 'versionNo'])
export class WorkflowVersionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => WorkflowEntity, { onDelete: 'CASCADE' })
  workflow: WorkflowEntity;
  @Column({ name: 'workflow_id' }) workflowId: string;

  @Column({ type: 'bytea', name: 'yjs_snapshot' })
  yjsSnapshot: Buffer;

  @Column({ name: 'version_no' }) versionNo: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
