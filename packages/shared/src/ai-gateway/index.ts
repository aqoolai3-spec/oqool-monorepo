import Anthropic from '@anthropic-ai/sdk';

export interface AIProvider {
  name: string;
  generateCode(prompt: string): Promise<string>;
  chat(messages: Array<{role: string, content: string}>): Promise<string>;
}

export class AnthropicProvider implements AIProvider {
  name = 'Claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateCode(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async chat(messages: Array<{role: string, content: string}>): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: messages as any
    });
    
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}

export class AIGateway {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider?: AIProvider;

  addProvider(provider: AIProvider) {
    this.providers.set(provider.name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = provider;
    }
  }

  async generateCode(prompt: string, providerName?: string): Promise<string> {
    const provider = providerName ? 
      this.providers.get(providerName) : 
      this.defaultProvider;
      
    if (!provider) {
      throw new Error('No AI provider available');
    }

    return provider.generateCode(prompt);
  }
}