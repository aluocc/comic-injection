// apps/api-gateway/src/database/entities/image.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('images')
@Index(['projectId'])
@Index(['projectId', 'type'])
export class ImageEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' }) project: ProjectEntity;
  @Column({ name: 'project_id' }) projectId: string;
  @Column({ type: 'varchar' }) type: string;
  @Column({ name: 'reference_id', type: 'uuid', nullable: true }) referenceId: string | null;
  @Column({ type: 'text' }) prompt: string;
  @Column() model: string;
  @Column() url: string;
  @Column({ name: 'thumbnail_url', nullable: true }) thumbnailUrl: string | null;
  @Column({ type: 'jsonb', default: '{}' }) metadata: Record<string, unknown>;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}