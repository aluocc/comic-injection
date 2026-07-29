import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementEntity } from '../../database/entities/achievement.entity';
import { UserAchievementEntity } from '../../database/entities/user-achievement.entity';
import { UserStatsEntity } from '../../database/entities/user-stats.entity';
import { LearningEventEntity } from '../../database/entities/learning-event.entity';
import { CommunityModule } from '../community/community.module';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AchievementEntity, UserAchievementEntity, UserStatsEntity, LearningEventEntity]),
    forwardRef(() => CommunityModule),
  ],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule implements OnModuleInit {
  constructor(private service: AchievementService) {}

  async onModuleInit() {
    await this.service.seedAchievements();
  }
}
