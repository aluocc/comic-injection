// apps/api-gateway/src/database/entities/shot.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { SceneEntity } from './scene.entity';

@Entity('shots')
@Index(['projectId'])
@Index(['sceneId'])
export class ShotEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  project: ProjectEntity;
  @Column({ name: 'project_id' }) projectId: string;

  @ManyToOne(() => SceneEntity, { onDelete: 'CASCADE' })
  scene: SceneEntity;
  @Column({ name: 'scene_id' }) sceneId: string;

  @Column({ type: 'int', default: 0 }) sequence: number;

  @Column({ name: 'shot_type', type: 'varchar', default: 'wide' })
  shotType: string;

  @Column({ type: 'text', default: '' }) description: string;

  @Column({ type: 'text', default: '' }) prompt: string;

  @Column({ name: 'negative_prompt', type: 'text', nullable: true })
  negativePrompt: string | null;

  @Column({ name: 'reference_image_id', type: 'uuid', nullable: true })
  referenceImageId: string | null;

  @Column({ name: 'video_url', type: 'varchar', nullable: true })
  videoUrl: string | null;

  @Column({ type: 'int', default: 4 }) duration: number;

  @Column({ type: 'varchar', default: 'draft' }) status: string;

  @Column({ type: 'varchar', default: 'svd' }) model: string;

  @Column({ type: 'jsonb', default: '{}' }) metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}