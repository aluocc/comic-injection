import { Injectable } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { LearningService } from '../learning/learning.service';
import { ConvertDto } from './dto/convert.dto';

@Injectable()
export class NovelToScriptService {
  constructor(
    private providers: ProvidersService,
    private learning: LearningService,
  ) {}

  async convert(userId: string, dto: ConvertDto) {
    const apiKey = await this.providers.getDecryptedKey(userId, 'openai');
    if (!apiKey) throw new Error('no api key configured for openai');

    const systemPrompt = `你是专业剧本改编师。将小说/文章转换为结构化分场表。
输出 JSON 对象：{"scenes": [{"sceneNo": number, "location": "INT|EXT|INT./EXT.", "time": "DAY|NIGHT|DAWN|DUSK|CONTINUOUS", "characters": string[], "actionSummary": string}]}
仅返回 JSON，不要解释。`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dto.sourceText },
      ],
      response_format: { type: 'json_object' },
    };
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`AI provider error ${resp.status}: ${await resp.text()}`);
    const data = await resp.json() as any;
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    const scenes = Array.isArray(parsed) ? parsed : (parsed.scenes ?? []);

    await this.learning.trackEvent(userId, {
      eventType: 'novel_to_script',
      metadata: { sceneCount: scenes.length },
    });

    return { scenes, meta: { model: body.model, usage: data.usage } };
  }
}
