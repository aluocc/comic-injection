// apps/api-gateway/src/modules/files/files.controller.ts
import {
  Controller, Get, Param, Post, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { UserEntity } from '../../database/entities/user.entity';

@Controller('workflows/:id/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private files: FilesService) {}

  @Get()
  list(@Param('id') id: string) {
    return this.files.listByWorkflow(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.files.upload(user.id, id, 'asset', file.mimetype, file.buffer);
  }

  @Get(':fileId/download')
  async download(@Param('fileId') fileId: string) {
    const file = await this.files.findById(fileId);
    const url = await this.files.getDownloadUrl(file);
    return { url };
  }
}
