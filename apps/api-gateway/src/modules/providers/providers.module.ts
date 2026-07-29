// apps/api-gateway/src/modules/providers/providers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyEntity } from '../../database/entities/api-key.entity';
import { AesService } from '../../common/crypto/aes.service';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity])],
  controllers: [ProvidersController],
  providers: [ProvidersService, AesService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
