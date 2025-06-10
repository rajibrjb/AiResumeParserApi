import { IAIParser } from '../../interfaces/aiParser.interface';
import { GoogleAIParserService } from './providers/googleAiParser.service';
import { OpenAIParserService } from './providers/openAiParser.service';
import { AnthropicParserService } from './providers/anthropicParser.service';
import { AzureOpenAIParserService } from './providers/azureOpenAiParser.service';
import { config } from '../../config/config';

export class AIParserFactory {
  static createParser(): IAIParser {
    switch (config.aiProvider.toLowerCase()) {
      case 'google':
        return new GoogleAIParserService({
          apiKey: config.googleAiApiKey,
          model: config.googleAiModel
        });
      
      case 'openai':
        return new OpenAIParserService({
          apiKey: config.openaiApiKey,
          model: config.openaiModel,
          organization: config.openaiOrganization
        });
      
      case 'anthropic':
        return new AnthropicParserService({
          apiKey: config.anthropicApiKey,
          model: config.anthropicModel
        });
      
      case 'azure':
        return new AzureOpenAIParserService({
          apiKey: config.azureOpenaiApiKey,
          endpoint: config.azureOpenaiEndpoint,
          model: config.azureOpenaiDeployment,
          apiVersion: config.azureOpenaiApiVersion
        });
      
      default:
        throw new Error(`Unsupported AI provider: ${config.aiProvider}. Supported providers: google, openai, anthropic, azure`);
    }
  }

  static getSupportedProviders(): string[] {
    return ['google', 'openai', 'anthropic', 'azure'];
  }
}