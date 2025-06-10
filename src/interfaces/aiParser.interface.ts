import { CustomParsingStructure } from '../types/resume.types';

export interface IAIParser {
  parseResume(content: string, customStructure?: CustomParsingStructure): Promise<any>;
  isConfigured(): boolean;
  getProviderName(): string;
  testConnection(): Promise<boolean>;
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  organization?: string;
  endpoint?: string;
  apiVersion?: string;
}