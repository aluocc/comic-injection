import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  postId!: string;

  @Column('uuid')
  authorId!: string;

  @Column('text')
  content!: string;

  @Column('uuid', { nullable: true })
  parentId!: string | null;

  @Column('int', { default: 0 })
  likeCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
