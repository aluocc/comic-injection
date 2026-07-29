// apps/api-gateway/src/modules/projects/projects.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { UserEntity } from '../../database/entities/user.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';
import { CreateSceneDto, UpdateSceneDto } from './dto/scene.dto';
import { CreateBlockDto, UpdateBlockDto } from './dto/block.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Get('projects')
  list(@CurrentUser() user: UserEntity) {
    return this.projects.listByOwner(user.id);
  }

  @Post('projects')
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  @Get('projects/:id')
  get(@Param('id') id: string) {
    return this.projects.get(id);
  }

  @Patch('projects/:id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @Delete('projects/:id')
  async remove(@Param('id') id: string) {
    await this.projects.remove(id);
  }

  // Chapters
  @Get('projects/:id/chapters')
  listChapters(@Param('id') id: string) {
    return this.projects.listChapters(id);
  }
  @Post('projects/:id/chapters')
  createChapter(@Param('id') id: string, @Body() dto: CreateChapterDto, @CurrentUser() user: UserEntity) {
    return this.projects.createChapter(id, dto, user.id);
  }
  @Patch('chapters/:id')
  updateChapter(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.projects.updateChapter(id, dto);
  }
  @Delete('chapters/:id')
  async removeChapter(@Param('id') id: string) {
    await this.projects.removeChapter(id);
  }

  // Scenes
  @Get('chapters/:id/scenes')
  listScenes(@Param('id') id: string) {
    return this.projects.listScenes(id);
  }
  @Post('chapters/:id/scenes')
  createScene(@Param('id') id: string, @Body() dto: CreateSceneDto) {
    return this.projects.createScene(id, dto);
  }
  @Patch('scenes/:id')
  updateScene(@Param('id') id: string, @Body() dto: UpdateSceneDto) {
    return this.projects.updateScene(id, dto);
  }
  @Delete('scenes/:id')
  async removeScene(@Param('id') id: string) {
    await this.projects.removeScene(id);
  }

  // Blocks
  @Get('scenes/:id/blocks')
  listBlocks(@Param('id') id: string) {
    return this.projects.listBlocks(id);
  }
  @Post('scenes/:id/blocks')
  createBlock(@Param('id') id: string, @Body() dto: CreateBlockDto) {
    return this.projects.createBlock(id, dto);
  }
  @Patch('blocks/:id')
  updateBlock(@Param('id') id: string, @Body() dto: UpdateBlockDto) {
    return this.projects.updateBlock(id, dto);
  }
  @Delete('blocks/:id')
  async removeBlock(@Param('id') id: string) {
    await this.projects.removeBlock(id);
  }
}
