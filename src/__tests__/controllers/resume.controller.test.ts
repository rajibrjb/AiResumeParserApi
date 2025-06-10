import { Request, Response, NextFunction } from 'express';
import { ResumeController } from '../../controllers/resume.controller';
import { ResumeParserService } from '../../services/resumeParser.service';

// Mock the ResumeParserService completely
jest.mock('../../services/resumeParser.service');

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the AIParserFactory import in the controller
jest.mock('../../services/ai/aiParserFactory', () => ({
  AIParserFactory: {
    createParser: jest.fn(),
    getSupportedProviders: jest.fn(() => ['google', 'openai', 'anthropic', 'azure'])
  }
}));

describe('ResumeController', () => {
  let controller: ResumeController;
  let mockResumeParserService: jest.Mocked<ResumeParserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create complete mock service
    mockResumeParserService = {
      parseResume: jest.fn(),
      getSupportedFileTypes: jest.fn(),
      testAIConnection: jest.fn(),
      getDefaultStructure: jest.fn(),
      getAIProviderInfo: jest.fn()
    } as any;

    // Mock the constructor
    (ResumeParserService as jest.MockedClass<typeof ResumeParserService>).mockImplementation(() => mockResumeParserService);

    // Create controller
    controller = new ResumeController();

    // Setup mock Express objects
    mockRequest = {
      file: undefined,
      body: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('parseResume', () => {
    it('should successfully parse a resume', async () => {
      const mockFile = {
        originalname: 'test-resume.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content')
      } as Express.Multer.File;

      const mockResult = {
        personalInfo: { fullName: 'John Doe', email: 'john@example.com' }
      };

      mockRequest.file = mockFile;
      mockResumeParserService.parseResume.mockResolvedValue(mockResult);

      await controller.parseResume(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Resume parsed successfully with default structure'
      });
    });

    it('should handle missing file error', async () => {
      mockRequest.file = undefined;

      await controller.parseResume(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No file provided. Please upload a resume file.'
        })
      );
    });
  });

  describe('getSupportedFormats', () => {
    it('should return supported formats', async () => {
      const mockFormats = ['application/pdf', 'text/plain'];
      mockResumeParserService.getSupportedFileTypes.mockReturnValue(mockFormats);

      await controller.getSupportedFormats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          formats: mockFormats,
          descriptions: expect.any(Object)
        }),
        message: 'Supported formats retrieved successfully'
      });
    });
  });

  describe('getParsingFields', () => {
    it('should return parsing fields', async () => {
      await controller.getParsingFields(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          fields: expect.any(Array),
          categories: expect.any(Object)
        }),
        message: 'Parsing fields retrieved successfully'
      });
    });
  });

  describe('getDefaultStructure', () => {
    it('should return default structure', async () => {
      const mockStructure = {
        personalInfo: { fullName: '', email: '' },
        skills: { technical: '', soft: '' },
        experience: [],
        education: []
      };
      
      mockResumeParserService.getDefaultStructure.mockReturnValue(mockStructure);

      await controller.getDefaultStructure(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          structure: mockStructure,
          examples: expect.any(Object)
        }),
        message: 'Default parsing structure retrieved successfully'
      });
    });
  });

  describe('testAIConnection', () => {
    it('should return AI connection status', async () => {
      const mockProviderInfo = { name: 'Test Provider', configured: true };
      
      mockResumeParserService.testAIConnection.mockResolvedValue(true);
      mockResumeParserService.getAIProviderInfo.mockReturnValue(mockProviderInfo);

      await controller.testAIConnection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          connected: true,
          provider: 'Test Provider'
        }),
        message: 'AI connection test successful'
      });
    });
  });

  describe('getProviderInfo', () => {
    it('should return provider information', async () => {
      const mockProviderInfo = { name: 'Test Provider', configured: true };
      mockResumeParserService.getAIProviderInfo.mockReturnValue(mockProviderInfo);

      await controller.getProviderInfo(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          current: expect.objectContaining({
            provider: 'Test Provider',
            configured: true
          }),
          supported: expect.any(Array),
          capabilities: expect.any(Object)
        }),
        message: 'AI provider information retrieved successfully'
      });
    });
  });
});
