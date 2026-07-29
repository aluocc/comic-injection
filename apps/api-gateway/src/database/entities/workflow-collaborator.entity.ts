// apps/api-gateway/src/database/entities/workflow-collaborator.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index,
} from 'typeorm';
import { WorkflowEntity } from './workflow.entity';
import { UserEntity } from './user.entity';

@Entity('workflow_collaborators')
@Index(['workflowId', 'userId'], { unique: true })
export class WorkflowCollaboratorEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => WorkflowEntity, (w) => w.collaborators, { onDelete: 'CASCADE' })
  workflow: WorkflowEntity;
  @Column({ name: 'workflow_id' }) workflowId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;
  @Column({ name: 'user_id' }) userId: string;

  @Column({ type: 'varchar', default: 'viewer' })
  role: 'owner' | 'editor' | 'viewer';

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
