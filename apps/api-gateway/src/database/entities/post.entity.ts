import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  authorId!: string;

  @Column('varchar')
  title!: string;

  @Column('text')
  content!: string;

  @Column('varchar', { default: 'discussion' })
  category!: 'showcase' | 'help' | 'discussion' | 'feedback';

  @Column('text', { array: true, default: [] })
  tags!: string[];

  @Column('int', { default: 0 })
  likeCount!: number;

  @Column('int', { default: 0 })
  commentCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
