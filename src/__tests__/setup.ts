import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test-specific environment variables if they exist
const testEnvPath = path.join(__dirname, '.env.test');
dotenv.config({ path: testEnvPath });

// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// AI Provider configuration for tests
process.env.AI_PROVIDER = process.env.AI_PROVIDER || 'google';

// Mock API keys that meet length requirements (> 10 characters)
// These will be overridden if real keys are provided in .env.test
if (!process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY.length <= 10) {
  process.env.GOOGLE_AI_API_KEY = 'test-google-ai-api-key-for-testing-purposes-only-mock';
}

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length <= 10) {
  process.env.OPENAI_API_KEY = 'test-openai-api-key-for-testing-purposes-only-mock';
}

if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.length <= 10) {
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key-for-testing-purposes-only-mock';
}

if (!process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY.length <= 10) {
  process.env.AZURE_OPENAI_API_KEY = 'test-azure-openai-api-key-for-testing-mock';
}

if (!process.env.AZURE_OPENAI_ENDPOINT) {
  process.env.AZURE_OPENAI_ENDPOINT = 'https://test-endpoint.openai.azure.com';
}

if (!process.env.AZURE_OPENAI_DEPLOYMENT) {
  process.env.AZURE_OPENAI_DEPLOYMENT = 'test-deployment';
}

// File upload settings for tests
process.env.MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '5242880';
process.env.ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES || 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

// Rate limiting for tests (more permissive)
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '1000';

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
  });
  
  afterEach(() => {
    Object.assign(console, originalConsole);
  });
}

// Global test timeout
jest.setTimeout(30000);

// Global test cleanup
afterAll(async () => {
  // Add any cleanup logic here
  await new Promise(resolve => setTimeout(resolve, 100));
});