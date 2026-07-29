import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('user_achievements')
@Index(['userId', 'achievementId'], { unique: true })
export class UserAchievementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  achievementId!: string;

  @CreateDateColumn()
  unlockedAt!: Date;
}
