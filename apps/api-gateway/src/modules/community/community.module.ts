import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../../database/entities/post.entity';
import { CommentEntity } from '../../database/entities/comment.entity';
import { LikeEntity } from '../../database/entities/like.entity';
import { UserStatsEntity } from '../../database/entities/user-stats.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { AchievementModule } from '../achievement/achievement.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, CommentEntity, LikeEntity, UserStatsEntity, UserEntity]),
    forwardRef(() => AchievementModule),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
