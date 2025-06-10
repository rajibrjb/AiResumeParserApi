import { BaseAIParser } from '../base/baseAiParser';
import { CustomParsingStructure } from '../../../types/resume.types';
import { AIProviderConfig } from '../../../interfaces/aiParser.interface';
import { logger } from '../../../utils/logger';

interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface AzureOpenAIError {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

export class AzureOpenAIParserService extends BaseAIParser {
  private apiKey: string;
  private endpoint: string;
  private deployment: string;
  private apiVersion: string;

  constructor(config: AIProviderConfig) {
    super(config, 'Azure OpenAI');
    
    if (!config.apiKey || !config.endpoint) {
      throw new Error('Azure OpenAI API key and endpoint are required');
    }
    
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
    this.deployment = config.model || 'gpt-4';
    this.apiVersion = config.apiVersion || '2024-02-15-preview';
  }

  async parseResume(content: string, customStructure?: CustomParsingStructure): Promise<any> {
    try {
      logger.info('Starting Azure OpenAI parsing', {
        contentLength: content.length,
        deployment: this.deployment,
        hasCustomStructure: !!customStructure
      });

      if (!content?.trim()) {
        throw new Error('Empty content provided for parsing');
      }

      const prompt = this.buildPrompt(content, customStructure);
      const response = await this.callAzureOpenAI(prompt);

      return this.processResponse(response, customStructure);
    } catch (error) {
      logger.error('Error parsing resume with Azure OpenAI:', { error });
      throw this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = "Say 'Hello' in JSON format: {\"message\": \"Hello\"}";
      await this.callAzureOpenAI(testPrompt);
      return true;
    } catch (error) {
      logger.error('Azure OpenAI connection test failed:', error);
      return false;
    }
  }

  private async callAzureOpenAI(prompt: string): Promise<string> {
    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey
      },
      body: JSON.stringify({
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
      const errorData = await response.json().catch(() => ({}))  as AzureOpenAIError;
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as AzureOpenAIResponse;
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
      throw new Error(`Invalid JSON response from Azure OpenAI: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
    }
  }

  private handleError(error: any): Error {
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return new Error('Invalid Azure OpenAI API key. Please check your configuration.');
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        return new Error('Azure OpenAI quota exceeded. Please check your billing.');
      }
      if (error.message.includes('rate limit')) {
        return new Error('Azure OpenAI rate limit exceeded. Please try again later.');
      }
    }
    return new Error('Failed to parse resume with Azure OpenAI service.');
  }
}