// apps/api-gateway/src/modules/ai-prompts/ai-prompts.controller.ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiPromptsService } from './ai-prompts.service';
import { AiPromptDto } from './dto/ai-prompt.dto';
import { UserEntity } from '../../database/entities/user.entity';

@Controller('ai-prompts')
@UseGuards(JwtAuthGuard)
export class AiPromptsController {
  constructor(private service: AiPromptsService) {}

  @Post('execute')
  execute(@CurrentUser() user: UserEntity, @Body() dto: AiPromptDto) {
    return this.service.execute(user.id, dto);
  }
}
