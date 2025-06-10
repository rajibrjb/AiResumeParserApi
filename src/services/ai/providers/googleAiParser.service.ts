import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIParser } from '../base/baseAiParser';
import { CustomParsingStructure } from '../../../types/resume.types';
import { AIProviderConfig } from '../../../interfaces/aiParser.interface';
import { logger } from '../../../utils/logger';

export class GoogleAIParserService extends BaseAIParser {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private modelName: string;

  constructor(config: AIProviderConfig) {
    super(config, 'Google AI (Gemini)');
    
    if (!config.apiKey) {
      throw new Error('Google AI API key is required');
    }
    
    // Validate API key format (basic check)
    if (config.apiKey.length < 20 || config.apiKey.includes('test')) {
      logger.warn('Google AI API key appears to be invalid or a test key');
    }
    
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model || 'gemini-1.5-flash';
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  async parseResume(content: string, customStructure?: CustomParsingStructure): Promise<any> {
    try {
      logger.info('Starting Google AI parsing', {
        contentLength: content.length,
        modelName: this.modelName,
        hasCustomStructure: !!customStructure
      });

      if (!content?.trim()) {
        throw new Error('Empty content provided for parsing');
      }

      const prompt = this.buildPrompt(content, customStructure);
      let result = await this.tryGenerateContent(prompt);

      const response = await result.response;
      const text = response.text();

      logger.info('Received response from Google AI', {
        responseLength: text.length,
        modelUsed: this.modelName
      });

      return this.processResponse(text, customStructure);
    } catch (error) {
      logger.error('Error parsing resume with Google AI:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = "Please respond with just: {\"status\": \"ok\"}";
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();
      return text.includes('ok') || text.includes('status');
    } catch (error) {
      logger.error('Google AI connection test failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        modelName: this.modelName
      });
      return false;
    }
  }

  private async tryGenerateContent(prompt: string) {
    try {
      return await this.model.generateContent(prompt);
    } catch (modelError) {
      logger.warn(`Model ${this.modelName} failed, trying fallback models`, {
        error: modelError instanceof Error ? modelError.message : 'Unknown error'
      });
      
      const fallbackModels = ['gemini-1.5-pro', 'gemini-1.0-pro', 'models/gemini-1.5-flash'];
      for (const fallbackModel of fallbackModels) {
        if (fallbackModel !== this.modelName) {
          try {
            logger.info(`Trying fallback model: ${fallbackModel}`);
            this.model = this.genAI.getGenerativeModel({ model: fallbackModel });
            this.modelName = fallbackModel;
            return await this.model.generateContent(prompt);
          } catch (fallbackError) {
            logger.warn(`Fallback model ${fallbackModel} failed`, {
              error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
            });
            continue;
          }
        }
      }
      
      throw new Error('All Google AI models failed. Please check your API key and internet connection.');
    }
  }

  private processResponse(text: string, customStructure?: CustomParsingStructure) {
    const cleanedText = this.cleanJsonResponse(text);
    
    try {
      const parsedData = JSON.parse(cleanedText);
      return customStructure 
        ? this.processCustomStructure(parsedData, customStructure)
        : parsedData;
    } catch (jsonError) {
      throw new Error(`Invalid JSON response from AI: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
    }
  }

  private handleError(error: any): Error {
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        return new Error('Invalid Google AI API key. Please check your configuration.');
      }
      if (error.message.includes('PERMISSION_DENIED') || error.message.includes('403')) {
        return new Error('Google AI API access denied. Please check your API key permissions.');
      }
      if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
        return new Error('Google AI quota exceeded. Please try again later.');
      }
      if (error.message.includes('model') || error.message.includes('404') || error.message.includes('not found')) {
        return new Error('Google AI model not available. Please try again.');
      }
      if (error.message.includes('RATE_LIMIT_EXCEEDED') || error.message.includes('429')) {
        return new Error('Google AI rate limit exceeded. Please try again later.');
      }
    }
    return new Error('Failed to parse resume with Google AI service.');
  }
}