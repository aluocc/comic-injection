// apps/api-gateway/src/database/entities/block.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index,
} from 'typeorm';
import { SceneEntity } from './scene.entity';

@Entity('blocks')
@Index(['sceneId'])
export class BlockEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => SceneEntity, (s) => s.blocks, { onDelete: 'CASCADE' }) scene: SceneEntity;
  @Column({ name: 'scene_id' }) sceneId: string;
  @Column({ type: 'varchar' }) type: string;
  @Column({ type: 'jsonb' }) content: unknown;
  @Column({ type: 'jsonb', default: '{}' }) meta: Record<string, unknown>;
  @Column({ name: 'order_index', type: 'int', default: 0 }) orderIndex: number;
}
