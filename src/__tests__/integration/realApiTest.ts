import { ResumeParserService } from '../../services/resumeParser.service';
import { config } from '../../config/config';
import * as fs from 'fs';
import * as path from 'path';

// This test only runs if real API keys are provided
describe('Real API Integration Tests', () => {
  let service: ResumeParserService;

  beforeAll(() => {
    // Load test environment if it exists
    const testEnvPath = path.join(__dirname, '../.env.test');
    if (fs.existsSync(testEnvPath)) {
      require('dotenv').config({ path: testEnvPath });
    }
    
    service = new ResumeParserService();
  });

  // Skip these tests if no real API key is provided
  const hasRealApiKey = () => {
    switch (config.aiProvider) {
      case 'google':
        return config.googleAiApiKey && !config.googleAiApiKey.includes('test');
      case 'openai':
        return config.openaiApiKey && !config.openaiApiKey.includes('test');
      case 'anthropic':
        return config.anthropicApiKey && !config.anthropicApiKey.includes('test');
      case 'azure':
        return config.azureOpenaiApiKey && !config.azureOpenaiApiKey.includes('test');
      default:
        return false;
    }
  };

  describe('Real AI Provider Tests', () => {
    it('should connect to real AI service', async () => {
      if (!hasRealApiKey()) {
        console.log('Skipping real API test - no real API key provided');
        return;
      }

      const isConnected = await service.testAIConnection();
      expect(isConnected).toBe(true);
    }, 30000); // 30 second timeout for real API calls

    it('should parse a simple text resume', async () => {
      if (!hasRealApiKey()) {
        console.log('Skipping real API test - no real API key provided');
        return;
      }

      const sampleResume = `
        John Doe
        Software Engineer
        Email: john.doe@example.com
        Phone: (555) 123-4567
        
        Experience:
        - Software Engineer at Tech Corp (2020-2023)
        - Junior Developer at StartupXYZ (2018-2020)
        
        Skills:
        - JavaScript, TypeScript, Python
        - React, Node.js, Express
        
        Education:
        - BS Computer Science, University of Technology (2014-2018)
      `;

      const buffer = Buffer.from(sampleResume);
      const result = await service.parseResume(buffer, 'text/plain');

      expect(result).toBeDefined();
      expect(result.personalInfo?.fullName).toContain('John');
      expect(result.personalInfo?.email).toContain('@');
    }, 30000);

    it('should parse with custom structure', async () => {
      if (!hasRealApiKey()) {
        console.log('Skipping real API test - no real API key provided');
        return;
      }

      const customStructure = {
        candidateName: '',
        contactEmail: '',
        programmingSkills: [],
        workHistory: []
      };

      const sampleResume = `
        Jane Smith
        Full Stack Developer
        jane.smith@email.com
        
        Skills: React, Node.js, MongoDB, AWS
        
        Experience:
        - Senior Developer at WebCorp (2021-Present)
        - Frontend Developer at DesignCo (2019-2021)
      `;

      const buffer = Buffer.from(sampleResume);
      const result = await service.parseResume(buffer, 'text/plain', customStructure);

      expect(result).toHaveProperty('candidateName');
      expect(result).toHaveProperty('contactEmail');
      expect(result).toHaveProperty('programmingSkills');
      expect(result).toHaveProperty('workHistory');
    }, 30000);
  });
});