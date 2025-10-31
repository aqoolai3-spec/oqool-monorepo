import { ipcMain, IpcMainInvokeEvent } from 'electron';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../services/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export function aiHandlers() {
  ipcMain.handle('ai:call', async (_event: IpcMainInvokeEvent, prompt: string, personality?: string, model?: string) => {
    try {
      logger.debug('AI call with personality:', personality);

      const systemPrompt = getPersonalityPrompt(personality);
      const selectedModel = model || 'claude-sonnet-4-20250514';

      const response = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return { success: true, response: text, usage: response.usage };
    } catch (error: any) {
      logger.error('Error calling AI:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:stream', async (event: IpcMainInvokeEvent, requestId: string, prompt: string, personality?: string) => {
    try {
      logger.debug('AI streaming with personality:', personality);

      const systemPrompt = getPersonalityPrompt(personality);

      const stream = await anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      stream.on('text', (text) => {
        event.sender.send('ai:stream-data', { requestId, type: 'text', data: text });
      });

      stream.on('end', () => {
        event.sender.send('ai:stream-data', { requestId, type: 'end' });
      });

      stream.on('error', (error) => {
        event.sender.send('ai:stream-data', { requestId, type: 'error', error: error.message });
      });

      return { success: true, requestId };
    } catch (error: any) {
      logger.error('Error streaming AI:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:inline-suggest', async (_event: IpcMainInvokeEvent, code: string, language: string, position: { line: number; column: number }) => {
    try {
      const prompt = `Continue this ${language} code from line ${position.line}, column ${position.column}. Provide ONLY the completion code, no explanations, no markdown:

${code}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      const suggestion = content.type === 'text' ? content.text.trim() : '';

      return { success: true, suggestion };
    } catch (error: any) {
      logger.error('Error getting inline suggestion:', error);
      return { success: false, error: error.message };
    }
  });
}

function getPersonalityPrompt(personality?: string): string {
  const prompts: Record<string, string> = {
    alex: 'أنت Alex، معماري أنظمة خبير. تركز على التصميم المعماري، الأنماط، والحلول القابلة للتوسع.',
    sarah: 'أنت Sarah، مطورة Full-stack محترفة. تكتب كود نظيف، قابل للصيانة، وتتبع أفضل الممارسات.',
    mike: 'أنت Mike، خبير في مراجعة الكود. تركز على جودة الكود، الأمان، والأداء.',
    guardian: 'أنت Guardian، خبير أمن سيبراني. تركز على الثغرات الأمنية وأفضل ممارسات الأمان.',
    olivia: 'أنت Olivia، خبيرة في الاختبارات. تكتب اختبارات شاملة وتغطي جميع الحالات.',
    tom: 'أنت Tom، خبير في تحسين الأداء. تركز على الكفاءة، السرعة، واستهلاك الموارد.',
    emma: 'أنت Emma، خبيرة في التوثيق. تكتب توثيق واضح، شامل، وسهل الفهم.',
    max: 'أنت Max، معلم برمجة صبور. تشرح المفاهيم بوضوح وتساعد في التعلم.',
  };

  return prompts[personality || ''] || 'أنت مساعد برمجة ذكي ومفيد.';
}
