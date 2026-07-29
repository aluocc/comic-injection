// apps/api-gateway/src/modules/shots/shots.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ShotEntity } from '../../database/entities/shot.entity';
import { CreateShotDto, UpdateShotDto, GenerateVideoDto } from './dto/shot.dto';
import { ProvidersService } from '../providers/providers.service';
import { LearningService } from '../learning/learning.service';

@Injectable()
export class ShotsService {
  constructor(
    @InjectRepository(ShotEntity) private shots: Repository<ShotEntity>,
    @InjectQueue('ai-tasks') private queue: Queue,
    private providers: ProvidersService,
    private learning: LearningService,
  ) {}

  listByProject(projectId: string) {
    return this.shots.find({
      where: { projectId },
      order: { sequence: 'ASC', createdAt: 'DESC' },
    });
  }

  listByScene(sceneId: string) {
    return this.shots.find({
      where: { sceneId },
      order: { sequence: 'ASC' },
    });
  }

  async get(id: string) {
    const shot = await this.shots.findOne({ where: { id } });
    if (!shot) throw new NotFoundException('shot not found');
    return shot;
  }

  async create(projectId: string, dto: CreateShotDto) {
    const maxSeq = await this.shots
      .createQueryBuilder('s')
      .where('s.sceneId = :sceneId', { sceneId: dto.sceneId })
      .select('MAX(s.sequence)', 'max')
      .getRawOne();
    const sequence = (maxSeq?.max ?? -1) + 1;

    const shot = await this.shots.save(this.shots.create({
      projectId,
      sceneId: dto.sceneId,
      sequence,
      shotType: dto.shotType ?? 'wide',
      description: dto.description ?? '',
      prompt: dto.prompt ?? '',
      negativePrompt: dto.negativePrompt ?? null,
      referenceImageId: dto.referenceImageId ?? null,
      duration: dto.duration ?? 4,
      status: 'draft',
      model: 'svd',
      videoUrl: null,
      metadata: {},
    }));

    // shot_completed 事件在 shot 创建时触发（简化）
    // 实际场景下可能需要在用户"确认完成"时触发
    // 这里通过 controller 获取 userId 比较困难，先不触发 shot_completed
    // 改为在 generateVideo 中触发 video_generated

    return shot;
  }

  async update(id: string, dto: UpdateShotDto) {
    const shot = await this.get(id);
    if (dto.shotType !== undefined) shot.shotType = dto.shotType;
    if (dto.description !== undefined) shot.description = dto.description;
    if (dto.prompt !== undefined) shot.prompt = dto.prompt;
    if (dto.negativePrompt !== undefined) shot.negativePrompt = dto.negativePrompt;
    if (dto.referenceImageId !== undefined) shot.referenceImageId = dto.referenceImageId;
    if (dto.duration !== undefined) shot.duration = dto.duration;
    return this.shots.save(shot);
  }

  async remove(id: string) {
    await this.shots.delete(id);
  }

  async generateVideo(projectId: string, dto: GenerateVideoDto, userId: string) {
    const shot = await this.get(dto.shotId);
    const provider = dto.model === 'runway' ? 'runway' : dto.model === 'pika' ? 'pika' : 'stability';
    const apiKey = await this.providers.getDecryptedKey(userId, provider);
    if (!apiKey) throw new NotFoundException(`no api key configured for ${provider}`);

    shot.status = 'pending';
    shot.model = dto.model;
    if (dto.prompt) shot.prompt = dto.prompt;
    if (dto.referenceImageId) shot.referenceImageId = dto.referenceImageId;
    if (dto.duration) shot.duration = dto.duration;
    await this.shots.save(shot);

    await this.queue.add('execute', {
      task_id: shot.id,
      user_id: userId,
      kind: 'video_generation',
      provider,
      params: {
        prompt: shot.prompt,
        negative_prompt: shot.negativePrompt ?? '',
        model: dto.model,
        duration: shot.duration,
        reference_image_id: shot.referenceImageId,
      },
      user_api_key: apiKey,
    });

    await this.learning.trackEvent(userId, {
      eventType: 'video_generated',
      entityType: 'shot',
      entityId: shot.id,
      metadata: { model: dto.model },
    });

    return shot;
  }
}