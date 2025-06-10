import { BaseAIParser } from '../base/baseAiParser';
import { CustomParsingStructure } from '../../../types/resume.types';
import { AIProviderConfig } from '../../../interfaces/aiParser.interface';
import { logger } from '../../../utils/logger';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OpenAIError {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

export class OpenAIParserService extends BaseAIParser {
  private apiKey: string;
  private model: string;
  private organization?: string;

  constructor(config: AIProviderConfig) {
    super(config, 'OpenAI (GPT)');
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4';
    this.organization = config.organization;
  }

  async parseResume(content: string, customStructure?: CustomParsingStructure): Promise<any> {
    try {
      logger.info('Starting OpenAI parsing', {
        contentLength: content.length,
        model: this.model,
        hasCustomStructure: !!customStructure
      });

      if (!content?.trim()) {
        throw new Error('Empty content provided for parsing');
      }

      const prompt = this.buildPrompt(content, customStructure);
      const response = await this.callOpenAI(prompt);

      return this.processResponse(response, customStructure);
    } catch (error) {
      logger.error('Error parsing resume with OpenAI:', { error });
      throw this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = "Say 'Hello' in JSON format: {\"message\": \"Hello\"}";
      await this.callOpenAI(testPrompt);
      return true;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))  as OpenAIError;
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices[0]?.message?.content || '';
  }

  private processResponse(text: string, customStructure?: CustomParsingStructure) {
    const cleanedText = this.cleanJsonResponse(text);
    
    try {
      const parsedData = JSON.parse(cleanedText);
      return customStructure 
        ? this.processCustomStructure(parsedData, customStructure)
        : parsedData;
    } catch (jsonError) {
      throw new Error(`Invalid JSON response from OpenAI: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
    }
  }

  private handleError(error: any): Error {
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        return new Error('OpenAI quota exceeded. Please check your billing.');
      }
      if (error.message.includes('rate limit')) {
        return new Error('OpenAI rate limit exceeded. Please try again later.');
      }
    }
    return new Error('Failed to parse resume with OpenAI service.');
  }
}