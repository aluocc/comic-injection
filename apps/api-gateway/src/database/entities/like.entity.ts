import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('likes')
@Index(['userId', 'targetType', 'targetId'], { unique: true })
export class LikeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('varchar')
  targetType!: 'post' | 'comment';

  @Column('uuid')
  targetId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
