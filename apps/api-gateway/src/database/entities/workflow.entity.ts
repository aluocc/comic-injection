// apps/api-gateway/src/database/entities/workflow.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { WorkflowCollaboratorEntity } from './workflow-collaborator.entity';

@Entity('workflows')
export class WorkflowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  owner: UserEntity;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column() title: string;
  @Column({ default: '' }) description: string;

  @Column({ type: 'varchar', default: 'private' })
  visibility: 'private' | 'unlisted' | 'public';

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  @OneToMany(() => WorkflowCollaboratorEntity, (c) => c.workflow)
  collaborators: WorkflowCollaboratorEntity[];
}
