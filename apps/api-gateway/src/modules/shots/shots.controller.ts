// apps/api-gateway/src/modules/shots/shots.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ShotsService } from './shots.service';
import { UserEntity } from '../../database/entities/user.entity';
import { CreateShotDto, UpdateShotDto, GenerateVideoDto } from './dto/shot.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ShotsController {
  constructor(private shots: ShotsService) {}

  @Get('projects/:id/shots')
  listByProject(@Param('id') id: string) {
    return this.shots.listByProject(id);
  }

  @Get('scenes/:id/shots')
  listByScene(@Param('id') id: string) {
    return this.shots.listByScene(id);
  }

  @Get('shots/:id')
  get(@Param('id') id: string) {
    return this.shots.get(id);
  }

  @Post('projects/:id/shots')
  create(
    @Param('id') projectId: string,
    @Body() dto: CreateShotDto,
  ) {
    return this.shots.create(projectId, dto);
  }

  @Patch('shots/:id')
  update(@Param('id') id: string, @Body() dto: UpdateShotDto) {
    return this.shots.update(id, dto);
  }

  @Delete('shots/:id')
  async remove(@Param('id') id: string) {
    await this.shots.remove(id);
  }

  @Post('projects/:id/shots/video')
  async generateVideo(
    @Param('id') projectId: string,
    @Body() dto: GenerateVideoDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.shots.generateVideo(projectId, dto, user.id);
  }
}