// apps/api-gateway/src/database/entities/task.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index,
} from 'typeorm';
import { WorkflowEntity } from './workflow.entity';
import { UserEntity } from './user.entity';

@Entity('tasks')
@Index(['workflowId'])
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => WorkflowEntity, { onDelete: 'CASCADE' }) workflow: WorkflowEntity;
  @Column({ name: 'workflow_id' }) workflowId: string;
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' }) user: UserEntity;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ name: 'node_id' }) nodeId: string;
  @Column() kind: string;
  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  @Column({ type: 'jsonb', default: '{}' }) input: Record<string, unknown>;
  @Column({ type: 'jsonb', default: '{}' }) output: Record<string, unknown>;
  @Column({ nullable: true }) error: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @Column({ name: 'completed_at', nullable: true, type: 'timestamptz' }) completedAt: Date | null;
}
