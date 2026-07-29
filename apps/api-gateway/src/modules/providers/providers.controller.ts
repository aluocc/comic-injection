// apps/api-gateway/src/modules/providers/providers.controller.ts
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProvidersService } from './providers.service';
import { UpsertApiKeyDto } from './dto/upsert-api-key.dto';
import { UserEntity } from '../../database/entities/user.entity';

@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(private providers: ProvidersService) {}

  @Get()
  list(@CurrentUser() user: UserEntity) {
    return this.providers.list(user.id);
  }

  @Post('keys')
  upsert(@CurrentUser() user: UserEntity, @Body() dto: UpsertApiKeyDto) {
    return this.providers.upsert(user.id, dto.provider, dto.apiKey);
  }
}
