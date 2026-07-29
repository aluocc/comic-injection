// apps/api-gateway/src/modules/ai-prompts/ai-prompts.module.ts
import { Module } from '@nestjs/common';
import { AiPromptsController } from './ai-prompts.controller';
import { AiPromptsService } from './ai-prompts.service';
import { ProvidersModule } from '../providers/providers.module';
import { LearningModule } from '../learning/learning.module';

@Module({
  imports: [ProvidersModule, LearningModule],
  controllers: [AiPromptsController],
  providers: [AiPromptsService],
})
export class AiPromptsModule {}
