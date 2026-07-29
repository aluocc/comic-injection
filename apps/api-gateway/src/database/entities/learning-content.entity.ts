import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('learning_contents')
export class LearningContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar')
  type!: 'tutorial' | 'template' | 'challenge' | 'tip';

  @Column('varchar')
  category!: 'writing' | 'directing' | 'art' | 'technical';

  @Column('varchar')
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('int', { default: 1 })
  difficulty!: number;

  @Column('text', { nullable: true })
  content!: string | null;

  @Column('text', { array: true, default: [] })
  tags!: string[];

  @Column('jsonb', { nullable: true })
  prerequisites!: { skills: Partial<Record<'writing' | 'directing' | 'art' | 'technical', number>> } | null;
}
