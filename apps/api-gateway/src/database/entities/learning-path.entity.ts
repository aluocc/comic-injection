import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export interface LearningPathStep {
  stepNo: number;
  title: string;
  type: 'tutorial' | 'template' | 'challenge' | 'tip';
  status: 'locked' | 'available' | 'completed';
  contentId: string | null;
}

@Entity('learning_paths')
export class LearningPathEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  userId!: string;

  @Column('varchar')
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('jsonb', { default: [] })
  steps!: LearningPathStep[];

  @Column('varchar', { default: 'active' })
  status!: 'active' | 'completed' | 'paused';

  @Column('int', { default: 0 })
  progress!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
