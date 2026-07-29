import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('learning_events')
export class LearningEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  userId!: string;

  @Column('varchar')
  eventType!:
    | 'project_created'
    | 'scene_completed'
    | 'chapter_finished'
    | 'image_generated'
    | 'shot_completed'
    | 'video_generated'
    | 'ai_assisted'
    | 'novel_to_script'
    | 'tutorial_viewed'
    | 'collab_joined';

  @Column('varchar', { nullable: true })
  entityType!: 'project' | 'scene' | 'shot' | 'image' | 'chapter' | null;

  @Column('uuid', { nullable: true })
  entityId!: string | null;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
