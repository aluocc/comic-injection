import { Module } from '@nestjs/common';
import { NovelToScriptController } from './novel-to-script.controller';
import { NovelToScriptService } from './novel-to-script.service';
import { ProvidersModule } from '../providers/providers.module';
import { LearningModule } from '../learning/learning.module';

@Module({
  imports: [ProvidersModule, LearningModule],
  controllers: [NovelToScriptController],
  providers: [NovelToScriptService],
})
export class NovelToScriptModule {}
