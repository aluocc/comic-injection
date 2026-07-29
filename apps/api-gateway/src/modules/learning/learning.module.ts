import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningEventEntity } from '../../database/entities/learning-event.entity';
import { SkillProfileEntity } from '../../database/entities/skill-profile.entity';
import { LearningPathEntity } from '../../database/entities/learning-path.entity';
import { LearningContentEntity } from '../../database/entities/learning-content.entity';
import { AchievementModule } from '../achievement/achievement.module';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningEventEntity, SkillProfileEntity, LearningPathEntity, LearningContentEntity]),
    AchievementModule,
  ],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule implements OnModuleInit {
  constructor(private learning: LearningService) {}

  async onModuleInit() {
    await this.learning.seedContents();
  }
}
