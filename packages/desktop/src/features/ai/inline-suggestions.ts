import * as monaco from 'monaco-editor';
import { aiService } from '../../services/ai-service';

export class InlineSuggestionsProvider implements monaco.languages.InlineCompletionsProvider {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay = 500; // ms

  async provideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.InlineCompletions | undefined> {
    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce requests
    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        try {
          // Don't provide suggestions if triggered by Undo/Redo
          if (context.triggerKind === monaco.languages.InlineCompletionTriggerKind.Automatic) {
            return resolve(undefined);
          }

          // Check if token is cancelled
          if (token.isCancellationRequested) {
            return resolve(undefined);
          }

          const code = model.getValue();
          const offset = model.getOffsetAt(position);
          const language = model.getLanguageId();

          // Get suggestion from AI
          const suggestion = await aiService.getInlineSuggestion(code, offset, language);

          if (!suggestion || token.isCancellationRequested) {
            return resolve(undefined);
          }

          // Create inline completion item
          const item: monaco.languages.InlineCompletion = {
            insertText: suggestion,
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
          };

          resolve({
            items: [item],
          });
        } catch (error) {
          console.error('Error getting inline suggestion:', error);
          resolve(undefined);
        }
      }, this.debounceDelay);
    });
  }

  freeInlineCompletions(): void {
    // Cleanup if needed
  }
}

export function registerInlineSuggestionsProvider(): monaco.IDisposable {
  const provider = new InlineSuggestionsProvider();

  return monaco.languages.registerInlineCompletionsProvider(
    { pattern: '**' }, // All files
    provider
  );
}
