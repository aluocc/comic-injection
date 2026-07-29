import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { AchievementService } from './achievement.service';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementController {
  constructor(private achievements: AchievementService) {}

  @Get()
  list(@CurrentUser() user: UserEntity) {
    return this.achievements.listAchievements(user.id);
  }

  @Get('me')
  myStats(@CurrentUser() user: UserEntity) {
    return this.achievements.getUserStats(user.id);
  }

  @Get('leaderboard')
  leaderboard(@Query('limit') limit?: string) {
    return this.achievements.getLeaderboard(limit ? parseInt(limit, 10) : 20);
  }
}
