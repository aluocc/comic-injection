// apps/api-gateway/src/database/entities/file.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { WorkflowEntity } from './workflow.entity';

@Entity('files')
@Index(['workflowId'])
export class FileEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' }) owner: UserEntity;
  @Column({ name: 'owner_id' }) ownerId: string;
  @ManyToOne(() => WorkflowEntity, { onDelete: 'CASCADE' }) workflow: WorkflowEntity;
  @Column({ name: 'workflow_id' }) workflowId: string;
  @Column() kind: string;
  @Column({ name: 'storage_key' }) storageKey: string;
  @Column() mime: string;
  @Column() size: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
