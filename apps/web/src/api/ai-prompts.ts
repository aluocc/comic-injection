// apps/web/src/api/ai-prompts.ts
import { api } from './client';

export const aiApi = {
  execute: (operation: string, prompt: string, context?: string, style?: string) =>
    api.post('/ai-prompts/execute', { operation, prompt, context, style }).then((r) => r.data),
  convert: (sourceText: string) =>
    api.post('/novel-to-script/convert', { sourceText }).then((r) => r.data),
};
