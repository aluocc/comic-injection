import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index } from 'typeorm';

@Entity('user_stats')
export class UserStatsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column('uuid')
  userId!: string;

  @Column('int', { default: 0 })
  totalPoints!: number;

  @Column('int', { default: 0 })
  postCount!: number;

  @Column('int', { default: 0 })
  commentCount!: number;

  @Column('int', { default: 0 })
  likeReceivedCount!: number;

  @Column('int', { default: 1 })
  level!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
