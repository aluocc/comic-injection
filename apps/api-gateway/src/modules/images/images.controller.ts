// apps/api-gateway/src/modules/images/images.controller.ts
import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImagesService } from './images.service';
import { UserEntity } from '../../database/entities/user.entity';
import { UploadImageDto, GenerateImageDto } from './dto/image.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private images: ImagesService) {}

  @Get('projects/:id/images')
  list(@Param('id') id: string, @Query('type') type?: string) {
    return this.images.listByProject(id, type);
  }

  @Get('images/:id')
  get(@Param('id') id: string) {
    return this.images.get(id);
  }

  @Post('projects/:id/images/upload')
  upload(@Param('id') id: string, @Body() dto: UploadImageDto) {
    return this.images.upload(id, dto);
  }

  @Post('projects/:id/images/generate')
  async generate(
    @Param('id') projectId: string,
    @Body() dto: GenerateImageDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.images.generateImage(projectId, dto, user.id);
  }

  @Delete('images/:id')
  async remove(@Param('id') id: string) {
    await this.images.remove(id);
  }
}