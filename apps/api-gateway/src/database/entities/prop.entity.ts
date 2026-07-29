// apps/api-gateway/src/database/entities/prop.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('props')
@Index(['projectId'])
export class PropEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => ProjectEntity, (p) => p.props, { onDelete: 'CASCADE' }) project: ProjectEntity;
  @Column({ name: 'project_id' }) projectId: string;
  @Column() name: string;
  @Column({ type: 'text', default: '' }) description: string;
}
