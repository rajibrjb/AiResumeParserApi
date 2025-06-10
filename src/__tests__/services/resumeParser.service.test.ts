// ================================
// src/__tests__/services/resumeParser.service.test.ts (COMPLETE REPLACEMENT)
// ================================
import { ResumeParserService } from '../../services/resumeParser.service';
import { IAIParser } from '../../interfaces/aiParser.interface';
import { IDocumentProcessor } from '../../interfaces/documentProcessor.interface';
import { CustomParsingStructure } from '../../types/resume.types';

// Mock ALL external dependencies
jest.mock('../../services/ai/aiParserFactory');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

class TestMockAIParser implements IAIParser {
  private configured: boolean;

  constructor(configured: boolean = true) {
    this.configured = configured;
  }

  async parseResume(content: string, customStructure?: CustomParsingStructure): Promise<any> {
    if (customStructure) {
      return { ...customStructure, name: 'John Doe' };
    }
    return {
      personalInfo: {
        fullName: 'John Doe',
        email: 'john.doe@example.com'
      },
      experience: [],
      education: [],
      skills: {
        technical: ['JavaScript', 'TypeScript'],
        soft: ['Communication', 'Leadership']
      }
    };
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getProviderName(): string {
    return 'Test Mock AI Provider';
  }

  async testConnection(): Promise<boolean> {
    return this.configured;
  }
}

class TestMockDocumentProcessor implements IDocumentProcessor {
  private shouldReturnEmpty: boolean = false;

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (this.shouldReturnEmpty) {
      return '';
    }
    return 'Mock extracted text content for resume parsing';
  }

  getSupportedMimeTypes(): string[] {
    return ['application/pdf', 'text/plain'];
  }

  setReturnEmpty(returnEmpty: boolean) {
    this.shouldReturnEmpty = returnEmpty;
  }
}

describe('ResumeParserService', () => {
  let mockAIParser: TestMockAIParser;
  let mockDocumentProcessor: TestMockDocumentProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAIParser = new TestMockAIParser(true);
    mockDocumentProcessor = new TestMockDocumentProcessor();
  });

  describe('parseResume with mocked dependencies', () => {
    it('should successfully parse a resume', async () => {
      const service = new ResumeParserService(mockAIParser, mockDocumentProcessor);
      const mockBuffer = Buffer.from('test content');
      const mimeType = 'application/pdf';

      const result = await service.parseResume(mockBuffer, mimeType);

      expect(result).toBeDefined();
      expect(result.personalInfo.fullName).toBe('John Doe');
      expect(result.personalInfo.email).toBe('john.doe@example.com');
      expect(result.skills.technical).toContain('JavaScript');
    });

    it('should parse with custom structure', async () => {
      const service = new ResumeParserService(mockAIParser, mockDocumentProcessor);
      const mockBuffer = Buffer.from('test content');
      const mimeType = 'application/pdf';
      const customStructure = {
        name: '',
        email: '',
        skills: []
      };

      const result = await service.parseResume(mockBuffer, mimeType, customStructure);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('skills');
    });

    it('should throw error when AI parser is not configured', async () => {
      const unconfiguredParser = new TestMockAIParser(false);
      const service = new ResumeParserService(unconfiguredParser, mockDocumentProcessor);

      const mockBuffer = Buffer.from('test content');
      const mimeType = 'application/pdf';

      await expect(
        service.parseResume(mockBuffer, mimeType)
      ).rejects.toThrow('AI parser is not properly configured');
    });

    it('should throw error when document has no text content', async () => {
      mockDocumentProcessor.setReturnEmpty(true);
      const service = new ResumeParserService(mockAIParser, mockDocumentProcessor);

      const mockBuffer = Buffer.from('test content');
      const mimeType = 'application/pdf';

      await expect(
        service.parseResume(mockBuffer, mimeType)
      ).rejects.toThrow('No text content found in the document');
    });

    it('should handle AI parsing errors gracefully', async () => {
      const failingAIParser = new TestMockAIParser(true);
      failingAIParser.parseResume = jest.fn().mockRejectedValue(new Error('AI service error'));
      
      const service = new ResumeParserService(failingAIParser, mockDocumentProcessor);
      const mockBuffer = Buffer.from('test content');
      const mimeType = 'application/pdf';

      await expect(
        service.parseResume(mockBuffer, mimeType)
      ).rejects.toThrow('AI service error');
    });
  });

  describe('Service utility methods', () => {
    it('should return supported file types', () => {
      const service = new ResumeParserService(mockAIParser, mockDocumentProcessor);
      const supportedTypes = service.getSupportedFileTypes();
      
      expect(supportedTypes).toEqual(['application/pdf', 'text/plain']);
    });

    it('should test AI connection successfully', async () => {
      const service = new ResumeParserService(mockAIParser, mockDocumentProcessor);
      const result = await service.testAIConnection();
      
      expect(result).toBe(true);
    });

    it('should return false for unconfigured AI connection test', async () => {
      const unconfiguredParser = new TestMockAIParser(false);
      const service = new ResumeParserService(unconfiguredParser, mockDocumentProcessor);

      const result = await service.testAIConnection();
      
      expect(result).toBe(false);
    });

    it('should return default structure', () => {
      const service = new ResumeParserService(mockAIParser, mockDocumentProcessor);
      const structure = service.getDefaultStructure();
      
      expect(structure).toBeDefined();
      expect(structure.personalInfo).toBeDefined();
      expect(structure.experience).toBeDefined();
      expect(structure.skills).toBeDefined();
      expect(structure.education).toBeDefined();
    });

    it('should return AI provider information', () => {
      const service = new ResumeParserService(mockAIParser, mockDocumentProcessor);
      const providerInfo = service.getAIProviderInfo();
      
      expect(providerInfo).toBeDefined();
      expect(providerInfo.name).toBe('Test Mock AI Provider');
      expect(providerInfo.configured).toBe(true);
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle document processor errors', async () => {
      const failingProcessor = new TestMockDocumentProcessor();
      failingProcessor.extractText = jest.fn().mockRejectedValue(new Error('Document processing failed'));
      
      const service = new ResumeParserService(mockAIParser, failingProcessor);
      const mockBuffer = Buffer.from('test content');
      const mimeType = 'application/pdf';

      await expect(
        service.parseResume(mockBuffer, mimeType)
      ).rejects.toThrow('Document processing failed');
    });

    it('should handle very short text content with warning', async () => {
      const shortTextProcessor = new TestMockDocumentProcessor();
      shortTextProcessor.extractText = jest.fn().mockResolvedValue('Hi');
      
      const service = new ResumeParserService(mockAIParser, shortTextProcessor);
      const mockBuffer = Buffer.from('test content');
      const mimeType = 'application/pdf';

      const result = await service.parseResume(mockBuffer, mimeType);
      expect(result).toBeDefined();
      // Should still process even with short text
    });
  });
});

// ================================
// Alternative: Create a simple integration test (optional)
// ================================
// src/__tests__/integration/resumeParser.integration.test.ts
// Only run this if you want to test with real APIs

/*
import { ResumeParserService } from '../../services/resumeParser.service';

describe('ResumeParser Integration Tests', () => {
  // These tests only run if real API keys are provided
  const hasRealApiKey = process.env.GOOGLE_AI_API_KEY && 
                       !process.env.GOOGLE_AI_API_KEY.includes('test') &&
                       process.env.GOOGLE_AI_API_KEY.length > 20;

  it('should connect to real AI service when API key is provided', async () => {
    if (!hasRealApiKey) {
      console.log('Skipping integration test - no real API key provided');
      return;
    }

    const service = new ResumeParserService();
    const isConnected = await service.testAIConnection();
    expect(isConnected).toBe(true);
  }, 30000);

  it('should parse real text content', async () => {
    if (!hasRealApiKey) {
      console.log('Skipping integration test - no real API key provided');
      return;
    }

    const service = new ResumeParserService();
    const sampleText = `
      John Doe
      Software Engineer
      john.doe@example.com
      Skills: JavaScript, Python, React
    `;
    
    const buffer = Buffer.from(sampleText);
    const result = await service.parseResume(buffer, 'text/plain');
    
    expect(result).toBeDefined();
    expect(result.personalInfo).toBeDefined();
  }, 30000);
});
*/