// apps/api-gateway/src/modules/ai-prompts/ai-prompts.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProvidersService } from '../providers/providers.service';
import { LearningService } from '../learning/learning.service';
import { AiPromptDto } from './dto/ai-prompt.dto';

const SYSTEM_PROMPTS: Record<string, string> = {
  generate: '你是一位专业编剧助手，根据用户输入生成创意内容。',
  expand: '你是一位专业编剧助手，将给定段落扩展为更详细的描写。',
  compress: '你是一位专业编剧助手，将给定段落精简为摘要。',
  polish: '你是一位专业编剧助手，调整文风，使文字更符合指定风格。',
  check: '你是一位剧本审校专家，检查剧本中人物、道具、设定的一致性问题。',
  outline: '你是一位剧本结构师，根据给定标题和摘要生成结构化分场表。',
  nextScene: '你是一位专业编剧，根据前文续写下一场景。',
};

@Injectable()
export class AiPromptsService {
  constructor(
    private providers: ProvidersService,
    private config: ConfigService,
    private learning: LearningService,
  ) {}

  async execute(userId: string, dto: AiPromptDto): Promise<{ output: string; meta: Record<string, unknown> }> {
    const apiKey = await this.providers.getDecryptedKey(userId, 'openai');
    if (!apiKey) throw new Error('no api key configured for openai');

    const system = SYSTEM_PROMPTS[dto.operation] ?? SYSTEM_PROMPTS.generate;
    const userPrompt = this.buildPrompt(dto);
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
    };
    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`AI provider error ${resp.status}: ${errText}`);
    }
    const data = await resp.json() as any;

    await this.learning.trackEvent(userId, {
      eventType: 'ai_assisted',
      entityType: dto.projectId ? 'project' : undefined,
      entityId: dto.projectId,
      metadata: { operation: dto.operation },
    });

    return {
      output: data.choices[0].message.content,
      meta: { model: body.model, usage: data.usage },
    };
  }

  private buildPrompt(dto: AiPromptDto): string {
    const parts: string[] = [];
    if (dto.style) parts.push(`风格要求：${dto.style}`);
    if (dto.context) parts.push(`前文/上下文：\n${dto.context}`);
    parts.push(`任务：${dto.prompt}`);
    return parts.join('\n\n');
  }
}
