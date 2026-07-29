// apps/api-gateway/src/database/data-source.ts
import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { OauthAccountEntity } from './entities/oauth-account.entity';
import { ApiKeyEntity } from './entities/api-key.entity';
import { WorkflowEntity } from './entities/workflow.entity';
import { WorkflowCollaboratorEntity } from './entities/workflow-collaborator.entity';
import { WorkflowVersionEntity } from './entities/workflow-version.entity';
import { FileEntity } from './entities/file.entity';
import { TaskEntity } from './entities/task.entity';
import { ProjectEntity } from './entities/project.entity';
import { ChapterEntity } from './entities/chapter.entity';
import { SceneEntity } from './entities/scene.entity';
import { BlockEntity } from './entities/block.entity';
import { CharacterEntity } from './entities/character.entity';
import { PropEntity } from './entities/prop.entity';
import { ImageEntity } from './entities/image.entity';
import { ShotEntity } from './entities/shot.entity';
import { LearningEventEntity } from './entities/learning-event.entity';
import { SkillProfileEntity } from './entities/skill-profile.entity';
import { LearningPathEntity } from './entities/learning-path.entity';
import { LearningContentEntity } from './entities/learning-content.entity';
import { PostEntity } from './entities/post.entity';
import { CommentEntity } from './entities/comment.entity';
import { LikeEntity } from './entities/like.entity';
import { AchievementEntity } from './entities/achievement.entity';
import { UserAchievementEntity } from './entities/user-achievement.entity';
import { UserStatsEntity } from './entities/user-stats.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://mdp:mdp_dev@localhost:5432/mdp',
  entities: [
    UserEntity,
    OauthAccountEntity,
    ApiKeyEntity,
    WorkflowEntity,
    WorkflowCollaboratorEntity,
    WorkflowVersionEntity,
    FileEntity,
    TaskEntity,
    ProjectEntity,
    ChapterEntity,
    SceneEntity,
    BlockEntity,
    CharacterEntity,
    PropEntity,
    ImageEntity,
    ShotEntity,
    LearningEventEntity,
    SkillProfileEntity,
    LearningPathEntity,
    LearningContentEntity,
    PostEntity,
    CommentEntity,
    LikeEntity,
    AchievementEntity,
    UserAchievementEntity,
    UserStatsEntity,
  ],
  migrations: ['src/database/migrations/*.ts'],
});
