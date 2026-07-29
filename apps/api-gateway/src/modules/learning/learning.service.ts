import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningEventEntity } from '../../database/entities/learning-event.entity';
import { SkillProfileEntity } from '../../database/entities/skill-profile.entity';
import { LearningPathEntity, LearningPathStep } from '../../database/entities/learning-path.entity';
import { LearningContentEntity } from '../../database/entities/learning-content.entity';
import { AchievementService } from '../achievement/achievement.service';
import { CreateLearningEventDto, CreateLearningContentDto } from './dto/learning.dto';

const SCORE_RULES: Record<string, Partial<Record<'writing' | 'directing' | 'art' | 'technical', number>>> = {
  project_created: { writing: 5 },
  scene_completed: { writing: 10 },
  chapter_finished: { writing: 10 },
  image_generated: { art: 10 },
  shot_completed: { directing: 15 },
  video_generated: { technical: 20, directing: 10 },
  ai_assisted: { writing: 5, technical: 5 },
  novel_to_script: { writing: 15 },
  tutorial_viewed: { writing: 2, directing: 2, art: 2, technical: 2 },
  collab_joined: { technical: 5 },
};

function calculateLevel(overall: number): 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (overall >= 80) return 'expert';
  if (overall >= 60) return 'advanced';
  if (overall >= 40) return 'intermediate';
  if (overall >= 20) return 'beginner';
  return 'novice';
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(LearningEventEntity) private events: Repository<LearningEventEntity>,
    @InjectRepository(SkillProfileEntity) private profiles: Repository<SkillProfileEntity>,
    @InjectRepository(LearningPathEntity) private paths: Repository<LearningPathEntity>,
    @InjectRepository(LearningContentEntity) private contents: Repository<LearningContentEntity>,
    private achievements: AchievementService,
  ) {}

  // ---- Events ----
  async trackEvent(userId: string, dto: CreateLearningEventDto) {
    const event = this.events.create({
      userId,
      eventType: dto.eventType as LearningEventEntity['eventType'],
      entityType: dto.entityType ?? null,
      entityId: dto.entityId ?? null,
      metadata: dto.metadata ?? null,
    });
    await this.events.save(event);
    await this.updateSkillProfile(userId, dto.eventType);
    // trigger achievement check after event is recorded
    await this.achievements.checkAchievements(userId, dto.eventType);
    return event;
  }

  async listEvents(userId: string, limit = 50) {
    return this.events.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ---- Skill Profile ----
  async getOrCreateProfile(userId: string) {
    let profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profiles.create({
        userId,
        writing: 0,
        directing: 0,
        art: 0,
        technical: 0,
        overall: 0,
        level: 'novice',
      });
      await this.profiles.save(profile);
    }
    return profile;
  }

  async updateSkillProfile(userId: string, eventType: string) {
    const deltas = SCORE_RULES[eventType];
    if (!deltas) return;

    const profile = await this.getOrCreateProfile(userId);
    if (deltas.writing) profile.writing = clamp(profile.writing + deltas.writing);
    if (deltas.directing) profile.directing = clamp(profile.directing + deltas.directing);
    if (deltas.art) profile.art = clamp(profile.art + deltas.art);
    if (deltas.technical) profile.technical = clamp(profile.technical + deltas.technical);

    profile.overall = Math.round((profile.writing + profile.directing + profile.art + profile.technical) / 4);
    profile.level = calculateLevel(profile.overall);
    await this.profiles.save(profile);
  }

  async getProfile(userId: string) {
    return this.getOrCreateProfile(userId);
  }

  // ---- Learning Path ----
  async getOrCreatePath(userId: string) {
    let path = await this.paths.findOne({ where: { userId, status: 'active' } });
    if (!path) {
      path = this.paths.create({
        userId,
        title: '漫剧创作入门路径',
        description: '从编剧基础到视频生成的完整学习路径',
        steps: this.generateDefaultSteps(),
        status: 'active',
        progress: 0,
      });
      await this.paths.save(path);
    }
    return path;
  }

  async getPath(userId: string) {
    return this.getOrCreatePath(userId);
  }

  async completeStep(userId: string, stepNo: number) {
    const path = await this.getOrCreatePath(userId);
    const step = path.steps.find((s: LearningPathStep) => s.stepNo === stepNo);
    if (!step) throw new NotFoundException('step not found');
    step.status = 'completed';

    // unlock next step
    const next = path.steps.find((s: LearningPathStep) => s.stepNo === stepNo + 1);
    if (next && next.status === 'locked') next.status = 'available';

    const completed = path.steps.filter((s: LearningPathStep) => s.status === 'completed').length;
    path.progress = Math.round((completed / path.steps.length) * 100);
    if (completed === path.steps.length) path.status = 'completed';

    return this.paths.save(path);
  }

  private generateDefaultSteps(): LearningPathStep[] {
    return [
      { stepNo: 1, title: '创建第一个项目', type: 'tutorial', status: 'available', contentId: null },
      { stepNo: 2, title: '编写一场戏', type: 'challenge', status: 'locked', contentId: null },
      { stepNo: 3, title: '生成角色图片', type: 'tutorial', status: 'locked', contentId: null },
      { stepNo: 4, title: '完成分镜设计', type: 'challenge', status: 'locked', contentId: null },
      { stepNo: 5, title: '生成你的第一支视频', type: 'template', status: 'locked', contentId: null },
      { stepNo: 6, title: '小说转剧本实战', type: 'challenge', status: 'locked', contentId: null },
    ];
  }

  // ---- Recommendations ----
  async generateRecommendations(userId: string, limit = 5) {
    const profile = await this.getOrCreateProfile(userId);
    const contents = await this.contents.find();

    const skills: Array<{ key: 'writing' | 'directing' | 'art' | 'technical'; score: number }> = [
      { key: 'writing', score: profile.writing },
      { key: 'directing', score: profile.directing },
      { key: 'art', score: profile.art },
      { key: 'technical', score: profile.technical },
    ];

    // find weakest skill
    skills.sort((a, b) => a.score - b.score);
    const weakest = skills[0];

    const matched = contents
      .filter((c) => c.category === weakest.key)
      .filter((c) => {
        if (!c.prerequisites?.skills) return true;
        const prereq = c.prerequisites.skills;
        return Object.entries(prereq).every(([k, v]) => (profile as any)[k] >= (v ?? 0));
      })
      .slice(0, limit);

    return matched.map((content) => ({
      content,
      reason: `提升你的${this.skillLabel(weakest.key)}能力`,
      matchedSkill: weakest.key,
    }));
  }

  private skillLabel(key: string) {
    const map: Record<string, string> = {
      writing: '编剧',
      directing: '导演',
      art: '美术',
      technical: '技术',
    };
    return map[key] ?? key;
  }

  // ---- Learning Contents ----
  listContents(category?: string) {
    const where: any = {};
    if (category) where.category = category;
    return this.contents.find({ where, order: { difficulty: 'ASC' } });
  }

  async seedContents() {
    const count = await this.contents.count();
    if (count > 0) return;

    const seeds: CreateLearningContentDto[] = [
      { type: 'tutorial', category: 'writing', title: '剧本格式入门', description: '学习标准影视剧本格式', difficulty: 1, content: '# 剧本格式入门\n\n场景标题使用 INT./EXT. 前缀...', tags: ['format', 'beginner'], prerequisites: { skills: { writing: 0 } } },
      { type: 'tutorial', category: 'writing', title: '角色对白写作技巧', description: '如何写出自然的角色对话', difficulty: 2, content: '# 对白写作\n\n1. 避免直白 exposition...', tags: ['dialogue', 'character'], prerequisites: { skills: { writing: 10 } } },
      { type: 'challenge', category: 'writing', title: '编写一场冲突戏', description: '完成一场包含明确冲突的场景', difficulty: 3, content: '任务：编写一场两人争吵戏，字数不少于 300 字。', tags: ['conflict', 'scene'], prerequisites: { skills: { writing: 20 } } },
      { type: 'tutorial', category: 'directing', title: '分镜语言基础', description: '了解景别与镜头运动', difficulty: 1, content: '# 分镜语言\n\n- 远景 (Wide)\n- 中景 (Medium)...', tags: ['shot', 'basics'], prerequisites: { skills: { directing: 0 } } },
      { type: 'tutorial', category: 'directing', title: '镜头叙事技巧', description: '如何用镜头讲述故事', difficulty: 2, content: '# 镜头叙事\n\n1. 视线匹配...', tags: ['narrative', 'editing'], prerequisites: { skills: { directing: 15 } } },
      { type: 'challenge', category: 'directing', title: '设计 5 个分镜', description: '为给定场景设计 5 个连续分镜', difficulty: 3, content: '任务：为"开门发现惊喜"场景设计 5 个分镜。', tags: ['storyboard', 'design'], prerequisites: { skills: { directing: 30 } } },
      { type: 'tutorial', category: 'art', title: '角色设计基础', description: '如何设计令人难忘的角色形象', difficulty: 1, content: '# 角色设计\n\n1. 剪影辨识度...', tags: ['character', 'design'], prerequisites: { skills: { art: 0 } } },
      { type: 'tutorial', category: 'art', title: '提示词工程入门', description: '编写高质量的 AI 绘画提示词', difficulty: 2, content: '# 提示词工程\n\n结构：主体 + 风格 + 质量词...', tags: ['prompt', 'ai'], prerequisites: { skills: { art: 10 } } },
      { type: 'challenge', category: 'art', title: '生成主角立绘', description: '使用 AI 生成一致的角色立绘', difficulty: 3, content: '任务：生成同一角色的 3 种表情立绘。', tags: ['character', 'consistency'], prerequisites: { skills: { art: 20 } } },
      { type: 'tutorial', category: 'technical', title: 'AI 视频生成 workflow', description: '从图片到视频的完整流程', difficulty: 2, content: '# AI 视频 Workflow\n\n1. 准备参考图...', tags: ['video', 'workflow'], prerequisites: { skills: { technical: 0 } } },
      { type: 'tip', category: 'technical', title: '模型选择指南', description: '不同场景选择最佳 AI 模型', difficulty: 1, content: '- 写实风格：SDXL\n- 动漫风格：SD Anime...', tags: ['model', 'tips'], prerequisites: { skills: { technical: 0 } } },
      { type: 'challenge', category: 'technical', title: '生成完整剧集', description: '组合多个分镜生成连贯视频', difficulty: 4, content: '任务：使用 3 个分镜生成一段 15 秒视频。', tags: ['video', 'advanced'], prerequisites: { skills: { technical: 40 } } },
    ];

    for (const dto of seeds) {
      await this.contents.save(this.contents.create(dto as any));
    }
  }
}
