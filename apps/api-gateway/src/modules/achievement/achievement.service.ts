import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementEntity, AchievementCondition } from '../../database/entities/achievement.entity';
import { UserAchievementEntity } from '../../database/entities/user-achievement.entity';
import { UserStatsEntity } from '../../database/entities/user-stats.entity';
import { LearningEventEntity } from '../../database/entities/learning-event.entity';
import { CommunityService } from '../community/community.service';
import { CreateAchievementDto } from './dto/achievement.dto';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(AchievementEntity) private achievements: Repository<AchievementEntity>,
    @InjectRepository(UserAchievementEntity) private userAchievements: Repository<UserAchievementEntity>,
    @InjectRepository(UserStatsEntity) private statsRepo: Repository<UserStatsEntity>,
    @InjectRepository(LearningEventEntity) private events: Repository<LearningEventEntity>,
    private community: CommunityService,
  ) {}

  async listAchievements(userId: string) {
    const all = await this.achievements.find({ order: { category: 'ASC', points: 'ASC' } });
    const unlocked = await this.userAchievements.find({ where: { userId } });
    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u]));

    return all.map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id)?.unlockedAt ?? null,
    }));
  }

  async getUserStats(userId: string) {
    return this.community.getOrCreateStats(userId);
  }

  async getLeaderboard(limit = 20) {
    return this.community.getLeaderboard(limit);
  }

  async checkAchievements(userId: string, eventType?: string) {
    const all = await this.achievements.find();
    const alreadyUnlocked = await this.userAchievements.find({ where: { userId } });
    const unlockedSet = new Set(alreadyUnlocked.map((u) => u.achievementId));

    const stats = await this.community.getOrCreateStats(userId);
    const eventCounts = await this.countEventsByType(userId);

    const newlyUnlocked: AchievementEntity[] = [];

    for (const achievement of all) {
      if (unlockedSet.has(achievement.id)) continue;
      if (this.isUnlocked(achievement, stats, eventCounts, eventType)) {
        await this.userAchievements.save(this.userAchievements.create({
          userId,
          achievementId: achievement.id,
        }));
        await this.community.incStats(userId, { totalPoints: achievement.points });
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  private isUnlocked(
    achievement: AchievementEntity,
    stats: UserStatsEntity,
    eventCounts: Record<string, number>,
    currentEventType?: string,
  ): boolean {
    if (!achievement.condition) return false;
    const cond = achievement.condition as AchievementCondition;

    // event-based: check if event count meets threshold
    if (cond.eventType) {
      const count = eventCounts[cond.eventType] ?? 0;
      return count >= (cond.count ?? 1);
    }

    // metric-based
    if (cond.metric) {
      switch (cond.metric) {
        case 'posts': return stats.postCount >= (cond.count ?? 1);
        case 'comments': return stats.commentCount >= (cond.count ?? 1);
        case 'likes': return stats.likeReceivedCount >= (cond.count ?? 1);
        case 'level': return stats.level >= (cond.count ?? 1);
        default: return false;
      }
    }

    return false;
  }

  private async countEventsByType(userId: string): Promise<Record<string, number>> {
    const result = await this.events
      .createQueryBuilder('e')
      .select('e.eventType AS type, COUNT(*) AS cnt')
      .where('e.userId = :userId', { userId })
      .groupBy('e.eventType')
      .getRawMany();

    const map: Record<string, number> = {};
    for (const r of result) {
      map[r.type] = parseInt(r.cnt, 10);
    }
    return map;
  }

  async seedAchievements() {
    const count = await this.achievements.count();
    if (count > 0) return;

    const seeds: Array<Partial<AchievementEntity>> = [
      { key: 'first_project', name: '初出茅庐', description: '创建你的第一个项目', icon: '🎬', category: 'creation', condition: { eventType: 'project_created', count: 1 }, points: 10 },
      { key: 'five_projects', name: '多产创作者', description: '创建 5 个项目', icon: '📚', category: 'creation', condition: { eventType: 'project_created', count: 5 }, points: 30 },
      { key: 'first_scene', name: '场景设计师', description: '完成第一场戏', icon: '🎭', category: 'creation', condition: { eventType: 'scene_completed', count: 1 }, points: 10 },
      { key: 'first_image', name: '视觉艺术家', description: '生成第一张图片', icon: '🎨', category: 'creation', condition: { eventType: 'image_generated', count: 1 }, points: 10 },
      { key: 'ten_images', name: '画廊大师', description: '生成 10 张图片', icon: '🖼️', category: 'creation', condition: { eventType: 'image_generated', count: 10 }, points: 30 },
      { key: 'first_video', name: '导演初体验', description: '生成第一支视频', icon: '🎥', category: 'creation', condition: { eventType: 'video_generated', count: 1 }, points: 20 },
      { key: 'five_videos', name: '影视制片人', description: '生成 5 支视频', icon: '🏆', category: 'creation', condition: { eventType: 'video_generated', count: 5 }, points: 50 },
      { key: 'ai_pioneer', name: 'AI 先锋', description: '使用 10 次 AI 辅助', icon: '🤖', category: 'creation', condition: { eventType: 'ai_assisted', count: 10 }, points: 25 },
      { key: 'novel_converter', name: '改编达人', description: '完成首次小说转剧本', icon: '📝', category: 'creation', condition: { eventType: 'novel_to_script', count: 1 }, points: 15 },
      { key: 'first_post', name: '社区新星', description: '发布第一篇帖子', icon: '💬', category: 'social', condition: { metric: 'posts', count: 1 }, points: 5 },
      { key: 'five_posts', name: '活跃成员', description: '发布 5 篇帖子', icon: '📢', category: 'social', condition: { metric: 'posts', count: 5 }, points: 20 },
      { key: 'first_comment', name: '热心评论', description: '发表第一条评论', icon: '💭', category: 'social', condition: { metric: 'comments', count: 1 }, points: 5 },
      { key: 'ten_likes', name: '受欢迎的人', description: '获得 10 个赞', icon: '❤️', category: 'social', condition: { metric: 'likes', count: 10 }, points: 15 },
      { key: 'level_5', name: '小有名气', description: '达到等级 5', icon: '⭐', category: 'milestone', condition: { metric: 'level', count: 5 }, points: 50 },
      { key: 'level_10', name: '创作大师', description: '达到等级 10', icon: '👑', category: 'milestone', condition: { metric: 'level', count: 10 }, points: 100 },
    ];

    for (const seed of seeds) {
      await this.achievements.save(this.achievements.create(seed as any));
    }
  }
}
