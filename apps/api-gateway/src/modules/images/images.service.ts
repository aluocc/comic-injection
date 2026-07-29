// apps/api-gateway/src/modules/images/images.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ImageEntity } from '../../database/entities/image.entity';
import { GenerateImageDto, UploadImageDto } from './dto/image.dto';
import { ProvidersService } from '../providers/providers.service';
import { LearningService } from '../learning/learning.service';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(ImageEntity) private images: Repository<ImageEntity>,
    @InjectQueue('ai-tasks') private queue: Queue,
    private providers: ProvidersService,
    private learning: LearningService,
  ) {}

  listByProject(projectId: string, type?: string) {
    const where: any = { projectId };
    if (type) where.type = type;
    return this.images.find({ where, order: { createdAt: 'DESC' } });
  }

  async get(id: string) {
    const img = await this.images.findOne({ where: { id } });
    if (!img) throw new NotFoundException('image not found');
    return img;
  }

  async upload(projectId: string, dto: UploadImageDto) {
    return this.images.save(this.images.create({
      projectId,
      type: dto.type,
      referenceId: dto.referenceId ?? null,
      prompt: dto.prompt ?? '',
      model: 'upload',
      url: dto.url,
      thumbnailUrl: null,
      metadata: {},
    }));
  }

  async remove(id: string) {
    await this.images.delete(id);
  }

  async generateImage(projectId: string, dto: GenerateImageDto, userId: string) {
    const provider = dto.model === 'dalle' ? 'openai' : 'stability';
    const apiKey = await this.providers.getDecryptedKey(userId, provider);
    if (!apiKey) throw new NotFoundException(`no api key configured for ${provider}`);

    // 保存占位记录
    const img = await this.images.save(this.images.create({
      projectId,
      type: dto.type,
      referenceId: dto.referenceId ?? null,
      prompt: dto.prompt,
      model: dto.model,
      url: '',
      thumbnailUrl: null,
      metadata: {},
    }));

    // 入队生成任务
    await this.queue.add('execute', {
      task_id: img.id,
      user_id: userId,
      kind: 'image_generation',
      provider,
      params: {
        prompt: dto.prompt,
        negative_prompt: dto.negativePrompt ?? '',
        width: dto.width ?? 512,
        height: dto.height ?? 512,
        style: dto.style ?? '',
        model: dto.model,
      },
      user_api_key: apiKey,
    });

    await this.learning.trackEvent(userId, {
      eventType: 'image_generated',
      entityType: 'image',
      entityId: img.id,
      metadata: { type: dto.type, model: dto.model },
    });

    return img;
  }
}