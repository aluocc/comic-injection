// apps/api-gateway/src/database/entities/chapter.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { SceneEntity } from './scene.entity';

@Entity('chapters')
@Index(['projectId'])
export class ChapterEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => ProjectEntity, (p) => p.chapters, { onDelete: 'CASCADE' }) project: ProjectEntity;
  @Column({ name: 'project_id' }) projectId: string;
  @Column() title: string;
  @Column({ name: 'order_index', type: 'int', default: 0 }) orderIndex: number;
  @OneToMany(() => SceneEntity, (s) => s.chapter) scenes: SceneEntity[];
}
