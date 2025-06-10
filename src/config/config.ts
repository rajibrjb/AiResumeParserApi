import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // AI Provider Configuration
  aiProvider: process.env.AI_PROVIDER || 'google',
  
  // Google AI
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
  googleAiModel: process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash',
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4',
  openaiOrganization: process.env.OPENAI_ORGANIZATION || '',
  
  // Anthropic (Claude)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
  
  // Azure OpenAI
  azureOpenaiApiKey: process.env.AZURE_OPENAI_API_KEY || '',
  azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
  azureOpenaiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || '',
  azureOpenaiApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  
  // General settings
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
};