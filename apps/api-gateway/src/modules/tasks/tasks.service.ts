// apps/api-gateway/src/modules/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { TaskEntity } from '../../database/entities/task.entity';
import { ImageEntity } from '../../database/entities/image.entity';
import { ShotEntity } from '../../database/entities/shot.entity';
import { ProvidersService } from '../providers/providers.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity) private tasks: Repository<TaskEntity>,
    @InjectRepository(ImageEntity) private images: Repository<ImageEntity>,
    @InjectRepository(ShotEntity) private shots: Repository<ShotEntity>,
    @InjectQueue('ai-tasks') private queue: Queue,
    private providers: ProvidersService,
  ) {}

  async create(userId: string, workflowId: string, dto: CreateTaskDto) {
    const userApiKey = await this.providers.getDecryptedKey(userId, dto.provider);
    if (!userApiKey) throw new NotFoundException(`no api key configured for ${dto.provider}`);
    const task = await this.tasks.save(
      this.tasks.create({
        userId, workflowId, nodeId: dto.nodeId, kind: dto.kind,
        status: 'pending', input: { provider: dto.provider, params: dto.params },
      }),
    );
    await this.queue.add('execute', {
      task_id: task.id, user_id: userId, provider: dto.provider,
      kind: dto.kind, params: dto.params, user_api_key: userApiKey,
    });
    return task;
  }

  listByWorkflow(workflowId: string) {
    return this.tasks.find({ where: { workflowId }, order: { createdAt: 'DESC' } });
  }

  async report(taskId: string, status: string, body: { output?: any; error?: string; kind?: string }) {
    // 图像生成任务特殊处理
    if (body.kind === 'image_generation' && body.output?.url) {
      const img = await this.images.findOne({ where: { id: taskId } });
      if (!img) throw new NotFoundException('image not found');
      img.url = body.output.url;
      img.metadata = body.output.metadata || {};
      await this.images.save(img);
      return img;
    }

    // 视频生成任务特殊处理
    if (body.kind === 'video_generation' && body.output?.url) {
      const shot = await this.shots.findOne({ where: { id: taskId } });
      if (!shot) throw new NotFoundException('shot not found');
      shot.videoUrl = body.output.url;
      shot.metadata = { ...shot.metadata, ...body.output.metadata };
      shot.status = status === 'succeeded' ? 'completed' : 'failed';
      await this.shots.save(shot);
      return shot;
    }

    const task = await this.tasks.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException();
    task.status = status as any;
    if (body.output) task.output = body.output;
    if (body.error) task.error = body.error;
    if (status === 'succeeded' || status === 'failed' || status === 'cancelled') {
      task.completedAt = new Date();
    }
    return this.tasks.save(task);
  }
}
