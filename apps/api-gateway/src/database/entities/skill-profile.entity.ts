import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index } from 'typeorm';

@Entity('skill_profiles')
export class SkillProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column('uuid')
  userId!: string;

  @Column('int', { default: 0 })
  writing!: number;

  @Column('int', { default: 0 })
  directing!: number;

  @Column('int', { default: 0 })
  art!: number;

  @Column('int', { default: 0 })
  technical!: number;

  @Column('int', { default: 0 })
  overall!: number;

  @Column('varchar', { default: 'novice' })
  level!: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @UpdateDateColumn()
  updatedAt!: Date;
}
