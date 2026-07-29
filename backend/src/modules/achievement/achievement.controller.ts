import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AchievementService } from './achievement.service';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Achievement endpoints (all JWT-protected):
 * - POST /achievement/check       — evaluate badge rules + award any newly
 *                                   earned badges. Returns new + all badges.
 * - GET  /achievement/badges      — list every badge with the caller's award
 *                                   status (awarded flag + awardedAt).
 * - GET  /achievement/leaderboard — Top-20 weekly leaderboard + caller's rank.
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data }.
 */
@Controller('achievement')
export class AchievementController {
  constructor(private readonly achievement: AchievementService) {}

  @UseGuards(JwtAuthGuard)
  @Post('check')
  async check(@Req() req: AuthenticatedRequest) {
    return this.achievement.checkAndAwardBadges(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('badges')
  async badges(@Req() req: AuthenticatedRequest) {
    return this.achievement.getBadgesWithStatus(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('leaderboard')
  async leaderboard(@Req() req: AuthenticatedRequest) {
    return this.achievement.getLeaderboard(req.user.sub);
  }
}
