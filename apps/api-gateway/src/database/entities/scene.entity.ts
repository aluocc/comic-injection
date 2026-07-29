// apps/api-gateway/src/database/entities/scene.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index,
} from 'typeorm';
import { ChapterEntity } from './chapter.entity';
import { BlockEntity } from './block.entity';

@Entity('scenes')
@Index(['chapterId'])
export class SceneEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => ChapterEntity, (c) => c.scenes, { onDelete: 'CASCADE' }) chapter: ChapterEntity;
  @Column({ name: 'chapter_id' }) chapterId: string;
  @Column() title: string;
  @Column({ type: 'varchar', nullable: true }) location: string | null;
  @Column({ type: 'varchar', nullable: true }) time: string | null;
  @Column({ type: 'jsonb', default: '[]' }) characters: string[];
  @Column({ name: 'order_index', type: 'int', default: 0 }) orderIndex: number;
  @OneToMany(() => BlockEntity, (b) => b.scene) blocks: BlockEntity[];
}
