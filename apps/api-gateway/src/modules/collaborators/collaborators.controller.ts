// apps/api-gateway/src/modules/collaborators/collaborators.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CollaboratorsService } from './collaborators.service';
import { InviteDto } from './dto/invite.dto';
import { UserEntity } from '../../database/entities/user.entity';

@Controller('workflows/:id/collaborators')
@UseGuards(JwtAuthGuard)
export class CollaboratorsController {
  constructor(private collabs: CollaboratorsService) {}

  @Get()
  list(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.collabs.list(id, user.id);
  }

  @Post()
  invite(@Param('id') id: string, @CurrentUser() user: UserEntity, @Body() dto: InviteDto) {
    return this.collabs.invite(id, user.id, dto.email, dto.role);
  }
}
