// apps/api-gateway/src/database/entities/character.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('characters')
@Index(['projectId'])
export class CharacterEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => ProjectEntity, (p) => p.characters, { onDelete: 'CASCADE' }) project: ProjectEntity;
  @Column({ name: 'project_id' }) projectId: string;
  @Column() name: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column({ type: 'jsonb', default: '[]' }) aliases: string[];
}
