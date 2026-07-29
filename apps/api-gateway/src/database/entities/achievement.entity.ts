import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export interface AchievementCondition {
  eventType?: string;
  threshold?: number;
  count?: number;
  metric?: 'posts' | 'comments' | 'likes' | 'projects' | 'images' | 'videos' | 'level';
}

@Entity('achievements')
export class AchievementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true })
  key!: string;

  @Column('varchar')
  name!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('varchar', { default: '🏆' })
  icon!: string;

  @Column('varchar', { default: 'creation' })
  category!: 'creation' | 'social' | 'learning' | 'milestone';

  @Column('jsonb', { nullable: true })
  condition!: AchievementCondition | null;

  @Column('int', { default: 10 })
  points!: number;
}
