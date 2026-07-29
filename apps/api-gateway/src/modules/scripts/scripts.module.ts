// apps/api-gateway/src/modules/scripts/scripts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterEntity } from '../../database/entities/character.entity';
import { PropEntity } from '../../database/entities/prop.entity';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';

@Module({
  imports: [TypeOrmModule.forFeature([CharacterEntity, PropEntity])],
  controllers: [ScriptsController],
  providers: [ScriptsService],
  exports: [ScriptsService],
})
export class ScriptsModule {}
