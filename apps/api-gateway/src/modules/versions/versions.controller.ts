// apps/api-gateway/src/modules/versions/versions.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VersionsService } from './versions.service';

@Controller('workflows/:id/versions')
@UseGuards(JwtAuthGuard)
export class VersionsController {
  constructor(private versions: VersionsService) {}

  @Get()
  list(@Param('id') id: string) {
    return this.versions.list(id);
  }

  @Get('latest')
  latest(@Param('id') id: string) {
    return this.versions.getLatest(id);
  }
}
