// apps/api-gateway/src/database/entities/project.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ChapterEntity } from './chapter.entity';
import { CharacterEntity } from './character.entity';
import { PropEntity } from './prop.entity';

@Entity('projects')
@Index(['ownerId'])
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' }) owner: UserEntity;
  @Column({ name: 'owner_id' }) ownerId: string;
  @Column() title: string;
  @Column({ type: 'varchar', default: 'novel' }) type: 'novel' | 'script' | 'article';
  @Column({ type: 'text', default: '' }) description: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => ChapterEntity, (c) => c.project) chapters: ChapterEntity[];
  @OneToMany(() => CharacterEntity, (c) => c.project) characters: CharacterEntity[];
  @OneToMany(() => PropEntity, (p) => p.project) props: PropEntity[];
}
