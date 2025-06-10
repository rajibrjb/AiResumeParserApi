import { BaseAIParser } from '../base/baseAiParser';
import { CustomParsingStructure } from '../../../types/resume.types';
import { AIProviderConfig } from '../../../interfaces/aiParser.interface';
import { logger } from '../../../utils/logger';

interface AnthropicResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
}

interface AnthropicError {
  error?: {
    message?: string;
    type?: string;
  };
}

export class AnthropicParserService extends BaseAIParser {
  private apiKey: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    super(config, 'Anthropic (Claude)');
    
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-sonnet-20240229';
  }

  async parseResume(content: string, customStructure?: CustomParsingStructure): Promise<any> {
    try {
      logger.info('Starting Anthropic parsing', {
        contentLength: content.length,
        model: this.model,
        hasCustomStructure: !!customStructure
      });

      if (!content?.trim()) {
        throw new Error('Empty content provided for parsing');
      }

      const prompt = this.buildPrompt(content, customStructure);
      const response = await this.callAnthropic(prompt);

      return this.processResponse(response, customStructure);
    } catch (error) {
      logger.error('Error parsing resume with Anthropic:', { error });
      throw this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = "Say 'Hello' in JSON format: {\"message\": \"Hello\"}";
      await this.callAnthropic(testPrompt);
      return true;
    } catch (error) {
      logger.error('Anthropic connection test failed:', error);
      return false;
    }
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as AnthropicError;
      throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as AnthropicResponse;
    return data.content[0]?.text || '';
  }

  private processResponse(text: string, customStructure?: CustomParsingStructure) {
    const cleanedText = this.cleanJsonResponse(text);
    
    try {
      const parsedData = JSON.parse(cleanedText);
      return customStructure 
        ? this.processCustomStructure(parsedData, customStructure)
        : parsedData;
    } catch (jsonError) {
      throw new Error(`Invalid JSON response from Anthropic: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
    }
  }

  private handleError(error: any): Error {
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return new Error('Invalid Anthropic API key. Please check your configuration.');
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        return new Error('Anthropic quota exceeded. Please check your billing.');
      }
      if (error.message.includes('rate limit')) {
        return new Error('Anthropic rate limit exceeded. Please try again later.');
      }
    }
    return new Error('Failed to parse resume with Anthropic service.');
  }
}
