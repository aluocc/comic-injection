// apps/api-gateway/src/modules/projects/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../../database/entities/project.entity';
import { ChapterEntity } from '../../database/entities/chapter.entity';
import { SceneEntity } from '../../database/entities/scene.entity';
import { BlockEntity } from '../../database/entities/block.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';
import { CreateSceneDto, UpdateSceneDto } from './dto/scene.dto';
import { CreateBlockDto, UpdateBlockDto } from './dto/block.dto';
import { LearningService } from '../learning/learning.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity) private projects: Repository<ProjectEntity>,
    @InjectRepository(ChapterEntity) private chapters: Repository<ChapterEntity>,
    @InjectRepository(SceneEntity) private scenes: Repository<SceneEntity>,
    @InjectRepository(BlockEntity) private blocks: Repository<BlockEntity>,
    private learning: LearningService,
  ) {}

  // ===== Project =====
  listByOwner(userId: string) {
    return this.projects.find({ where: { ownerId: userId }, order: { updatedAt: 'DESC' } });
  }
  async get(id: string) {
    const p = await this.projects.findOne({ where: { id } });
    if (!p) throw new NotFoundException('project not found');
    return p;
  }
  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.projects.save(this.projects.create({ ownerId: userId, ...dto }));
    await this.learning.trackEvent(userId, {
      eventType: 'project_created',
      entityType: 'project',
      entityId: project.id,
    });
    return project;
  }
  async update(id: string, dto: UpdateProjectDto) {
    await this.projects.update(id, dto);
    return this.get(id);
  }
  async remove(id: string) {
    await this.projects.delete(id);
  }

  // ===== Chapter =====
  listChapters(projectId: string) {
    return this.chapters.find({ where: { projectId }, order: { orderIndex: 'ASC' } });
  }
  async createChapter(projectId: string, dto: CreateChapterDto, userId?: string) {
    const orderIndex = dto.orderIndex ?? await this.chapters.count({ where: { projectId } });
    const chapter = await this.chapters.save(this.chapters.create({ projectId, title: dto.title, orderIndex }));
    if (userId) {
      await this.learning.trackEvent(userId, {
        eventType: 'chapter_finished',
        entityType: 'chapter',
        entityId: chapter.id,
      });
    }
    return chapter;
  }
  async updateChapter(id: string, dto: UpdateChapterDto) {
    await this.chapters.update(id, dto);
    return this.chapters.findOne({ where: { id } });
  }
  async removeChapter(id: string) {
    await this.chapters.delete(id);
  }

  // ===== Scene =====
  listScenes(chapterId: string) {
    return this.scenes.find({ where: { chapterId }, order: { orderIndex: 'ASC' } });
  }
  async createScene(chapterId: string, dto: CreateSceneDto, userId?: string) {
    const orderIndex = dto.orderIndex ?? await this.scenes.count({ where: { chapterId } });
    const scene = await this.scenes.save(this.scenes.create({
      chapterId, title: dto.title, location: dto.location ?? null,
      time: dto.time ?? null, characters: dto.characters ?? [], orderIndex,
    }));
    if (userId) {
      await this.learning.trackEvent(userId, {
        eventType: 'scene_completed',
        entityType: 'scene',
        entityId: scene.id,
      });
    }
    return scene;
  }
  async updateScene(id: string, dto: UpdateSceneDto) {
    await this.scenes.update(id, dto);
    return this.scenes.findOne({ where: { id } });
  }
  async removeScene(id: string) {
    await this.scenes.delete(id);
  }

  // ===== Block =====
  listBlocks(sceneId: string) {
    return this.blocks.find({ where: { sceneId }, order: { orderIndex: 'ASC' } });
  }
  async createBlock(sceneId: string, dto: CreateBlockDto) {
    const orderIndex = dto.orderIndex ?? await this.blocks.count({ where: { sceneId } });
    return this.blocks.save(this.blocks.create({
      sceneId, type: dto.type, content: dto.content, meta: dto.meta ?? {}, orderIndex,
    }));
  }
  async updateBlock(id: string, dto: UpdateBlockDto) {
    await this.blocks.update(id, dto);
    return this.blocks.findOne({ where: { id } });
  }
  async removeBlock(id: string) {
    await this.blocks.delete(id);
  }
}
