// src/controllers/resume.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ResumeParserService } from '../services/resumeParser.service';
import { ApiResponse, CustomParsingStructure } from '../types/resume.types';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

// Extend Request interface to include custom structure
interface ParseResumeRequest extends Request {
  customStructure?: CustomParsingStructure;
}

export class ResumeController {
  private resumeParserService: ResumeParserService;

  constructor() {
    this.resumeParserService = new ResumeParserService();
  }

  /**
   * Parse resume file with optional custom structure
   * POST /api/v1/resume/parse
   */
  parseResume = async (
    req: ParseResumeRequest,
    res: Response<ApiResponse<any>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate file upload
      if (!req.file) {
        throw createError('No file provided. Please upload a resume file.', 400);
      }

      const startTime = Date.now();
      
      // Log parsing start
      logger.info('Starting resume parsing', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasCustomStructure: !!req.customStructure,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Validate file content
      if (!req.file.buffer || req.file.buffer.length === 0) {
        throw createError('File appears to be empty or corrupted.', 400);
      }

      // Parse the resume
      const parsedResume = await this.resumeParserService.parseResume(
        req.file.buffer,
        req.file.mimetype,
        req.customStructure
      );

      const processingTime = Date.now() - startTime;

      // Log successful completion
      logger.info('Resume parsing completed successfully', {
        filename: req.file.originalname,
        processingTimeMs: processingTime,
        hasCustomStructure: !!req.customStructure,
        resultKeys: Object.keys(parsedResume),
        ip: req.ip
      });

      // Return successful response
      const response: ApiResponse<any> = {
        success: true,
        data: parsedResume,
        message: req.customStructure 
          ? 'Resume parsed successfully with custom structure' 
          : 'Resume parsed successfully with default structure'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in parseResume controller:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filename: req.file?.originalname,
        mimetype: req.file?.mimetype,
        hasCustomStructure: !!req.customStructure,
        ip: req.ip
      });

      next(error);
    }
  };

  /**
   * Get supported file formats
   * GET /api/v1/resume/formats
   */
  getSupportedFormats = async (
    req: Request,
    res: Response<ApiResponse<{ formats: string[]; descriptions: Record<string, string> }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const supportedFormats = this.resumeParserService.getSupportedFileTypes();
      
      // Add format descriptions
      const descriptions: Record<string, string> = {
        'application/pdf': 'PDF - Portable Document Format',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX - Microsoft Word Document',
        'text/plain': 'TXT - Plain Text File'
      };

      const response: ApiResponse<{ formats: string[]; descriptions: Record<string, string> }> = {
        success: true,
        data: { 
          formats: supportedFormats,
          descriptions 
        },
        message: 'Supported formats retrieved successfully'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getSupportedFormats controller:', error);
      next(error);
    }
  };

  /**
   * Get available parsing fields for default structure
   * GET /api/v1/resume/fields
   */
  getParsingFields = async (
    req: Request,
    res: Response<ApiResponse<{ fields: string[]; categories: Record<string, string[]> }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const fields = [
        'personalInfo.fullName',
        'personalInfo.email',
        'personalInfo.phone',
        'personalInfo.location',
        'personalInfo.linkedinUrl',
        'personalInfo.githubUrl',
        'personalInfo.portfolioUrl',
        'summary',
        'experience[].company',
        'experience[].position',
        'experience[].startDate',
        'experience[].endDate',
        'experience[].location',
        'experience[].description',
        'experience[].achievements',
        'education[].institution',
        'education[].degree',
        'education[].field',
        'education[].startDate',
        'education[].endDate',
        'education[].gpa',
        'education[].achievements',
        'skills.technical',
        'skills.soft',
        'skills.tools',
        'skills.frameworks',
        'skills.languages',
        'certifications[].name',
        'certifications[].issuer',
        'certifications[].date',
        'certifications[].expiryDate',
        'certifications[].credentialId',
        'languages[].name',
        'languages[].proficiency',
        'projects[].name',
        'projects[].description',
        'projects[].technologies',
        'projects[].url',
        'projects[].githubUrl',
        'projects[].startDate',
        'projects[].endDate',
        'achievements'
      ];

      // Organize fields by category
      const categories: Record<string, string[]> = {
        'Personal Information': [
          'personalInfo.fullName',
          'personalInfo.email',
          'personalInfo.phone',
          'personalInfo.location',
          'personalInfo.linkedinUrl',
          'personalInfo.githubUrl',
          'personalInfo.portfolioUrl'
        ],
        'Professional Summary': ['summary'],
        'Work Experience': [
          'experience[].company',
          'experience[].position',
          'experience[].startDate',
          'experience[].endDate',
          'experience[].location',
          'experience[].description',
          'experience[].achievements'
        ],
        'Education': [
          'education[].institution',
          'education[].degree',
          'education[].field',
          'education[].startDate',
          'education[].endDate',
          'education[].gpa',
          'education[].achievements'
        ],
        'Skills': [
          'skills.technical',
          'skills.soft',
          'skills.tools',
          'skills.frameworks',
          'skills.languages'
        ],
        'Certifications': [
          'certifications[].name',
          'certifications[].issuer',
          'certifications[].date',
          'certifications[].expiryDate',
          'certifications[].credentialId'
        ],
        'Languages': [
          'languages[].name',
          'languages[].proficiency'
        ],
        'Projects': [
          'projects[].name',
          'projects[].description',
          'projects[].technologies',
          'projects[].url',
          'projects[].githubUrl',
          'projects[].startDate',
          'projects[].endDate'
        ],
        'Achievements': ['achievements']
      };

      const response: ApiResponse<{ fields: string[]; categories: Record<string, string[]> }> = {
        success: true,
        data: { fields, categories },
        message: 'Parsing fields retrieved successfully'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getParsingFields controller:', error);
      next(error);
    }
  };

  /**
   * Get default parsing structure template
   * GET /api/v1/resume/structure
   */
  getDefaultStructure = async (
    req: Request,
    res: Response<ApiResponse<{ structure: any; examples: any }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const defaultStructure = this.resumeParserService.getDefaultStructure();

      // Provide example structures for common use cases
      const examples = {
        minimal: {
          name: "",
          email: "",
          phone: "",
          skills: "",
          summary: ""
        },
        hrFocused: {
          candidate: {
            fullName: "",
            contactInfo: {
              email: "",
              phone: "",
              location: ""
            }
          },
          workHistory: [
            {
              employer: "",
              jobTitle: "",
              duration: "",
              responsibilities: ""
            }
          ],
          qualifications: {
            education: "",
            certifications: "",
            coreSkills: ""
          }
        },
        technical: {
          developer: {
            name: "",
            contact: "",
            githubProfile: ""
          },
          technicalSkills: {
            programmingLanguages: "",
            frameworks: "",
            databases: "",
            tools: ""
          },
          projects: [
            {
              title: "",
              description: "",
              techStack: "",
              repositoryUrl: ""
            }
          ],
          experience: [
            {
              company: "",
              role: "",
              duration: "",
              keyAchievements: ""
            }
          ]
        }
      };

      const response: ApiResponse<{ structure: any; examples: any }> = {
        success: true,
        data: { 
          structure: defaultStructure,
          examples 
        },
        message: 'Default parsing structure retrieved successfully'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getDefaultStructure controller:', error);
      next(error);
    }
  };

  /**
   * Test AI connectivity and service health
   * GET /api/v1/resume/test
   */
  testAIConnection = async (
    req: Request,
    res: Response<ApiResponse<{ 
      connected: boolean; 
      message: string; 
      provider: string;
      responseTime?: number;
      details?: any;
    }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const startTime = Date.now();
      
      logger.info('Starting AI connection test', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const isConnected = await this.resumeParserService.testAIConnection();
      const providerInfo = this.resumeParserService.getAIProviderInfo();
      const responseTime = Date.now() - startTime;

      logger.info('AI connection test completed', {
        connected: isConnected,
        provider: providerInfo.name,
        responseTime,
        ip: req.ip
      });
      
      const response: ApiResponse<{ 
        connected: boolean; 
        message: string; 
        provider: string;
        responseTime: number;
        details: any;
      }> = {
        success: true,
        data: { 
          connected: isConnected,
          message: isConnected 
            ? `AI service (${providerInfo.name}) is working correctly` 
            : `AI service (${providerInfo.name}) connection failed`,
          provider: providerInfo.name,
          responseTime,
          details: {
            configured: providerInfo.configured,
            timestamp: new Date().toISOString()
          }
        },
        message: isConnected ? 'AI connection test successful' : 'AI connection test failed'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in testAIConnection controller:', error);
      next(error);
    }
  };

  /**
   * Get AI provider information and supported providers
   * GET /api/v1/resume/provider
   */
  getProviderInfo = async (
    req: Request,
    res: Response<ApiResponse<{ 
      current: {
        provider: string; 
        configured: boolean;
        model?: string;
      };
      supported: string[];
      capabilities: Record<string, any>;
    }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const providerInfo = this.resumeParserService.getAIProviderInfo();
      
      // Dynamically import to get supported providers
      const { AIParserFactory } = await import('../services/ai/aiParserFactory');
      const supportedProviders = AIParserFactory.getSupportedProviders();

      // Provider capabilities and features
      const capabilities = {
        google: {
          name: 'Google AI (Gemini)',
          features: ['Fast processing', 'Multilingual support', 'High accuracy'],
          models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.0-pro']
        },
        openai: {
          name: 'OpenAI (GPT)',
          features: ['Advanced reasoning', 'Detailed analysis', 'Complex structures'],
          models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
        },
        anthropic: {
          name: 'Anthropic (Claude)',
          features: ['Safety focused', 'Long context', 'Detailed extraction'],
          models: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']
        },
        azure: {
          name: 'Azure OpenAI',
          features: ['Enterprise grade', 'Regional deployment', 'Compliance ready'],
          models: ['gpt-4', 'gpt-35-turbo']
        }
      };
      
      const response: ApiResponse<{ 
        current: {
          provider: string; 
          configured: boolean;
          model?: string;
        };
        supported: string[];
        capabilities: Record<string, any>;
      }> = {
        success: true,
        data: {
          current: {
            provider: providerInfo.name,
            configured: providerInfo.configured
          },
          supported: supportedProviders,
          capabilities
        },
        message: 'AI provider information retrieved successfully'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getProviderInfo controller:', error);
      next(error);
    }
  };

  /**
   * Get parsing statistics and usage information
   * GET /api/v1/resume/stats
   */
  getStats = async (
    req: Request,
    res: Response<ApiResponse<{
      uptime: number;
      version: string;
      supportedFormats: number;
      availableFields: number;
      aiProvider: string;
      systemInfo: any;
    }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const supportedFormats = this.resumeParserService.getSupportedFileTypes();
      const providerInfo = this.resumeParserService.getAIProviderInfo();
      
      const stats = {
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        supportedFormats: supportedFormats.length,
        availableFields: 41, // Total number of extractable fields
        aiProvider: providerInfo.name,
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: {
            used: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
          }
        }
      };

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'System statistics retrieved successfully'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getStats controller:', error);
      next(error);
    }
  };

  /**
   * Validate custom structure format
   * POST /api/v1/resume/validate-structure
   */
  validateCustomStructure = async (
    req: Request,
    res: Response<ApiResponse<{
      valid: boolean;
      errors?: string[];
      suggestions?: string[];
      fieldCount?: number;
    }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { structure } = req.body;

      if (!structure) {
        throw createError('No structure provided in request body', 400);
      }

      const validation = this.validateStructureFormat(structure);

      const response: ApiResponse<{
        valid: boolean;
        errors?: string[];
        suggestions?: string[];
        fieldCount?: number;
      }> = {
        success: true,
        data: validation,
        message: validation.valid 
          ? 'Structure is valid and ready to use' 
          : 'Structure has validation issues'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in validateCustomStructure controller:', error);
      next(error);
    }
  };

  /**
   * Helper method to validate structure format
   */
  private validateStructureFormat(structure: any): {
    valid: boolean;
    errors?: string[];
    suggestions?: string[];
    fieldCount?: number;
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (typeof structure !== 'object' || structure === null) {
      errors.push('Structure must be a valid JSON object');
      return { valid: false, errors };
    }

    if (Array.isArray(structure)) {
      errors.push('Root structure cannot be an array, must be an object');
    }

    const fieldCount = this.countFields(structure);
    
    if (fieldCount === 0) {
      errors.push('Structure appears to be empty');
    }

    if (fieldCount > 100) {
      suggestions.push('Large structures may impact performance. Consider simplifying.');
    }

    // Check for common field naming issues
    const fieldNames = this.getFieldNames(structure);
    if (fieldNames.some(name => name.includes(' '))) {
      suggestions.push('Consider using camelCase or snake_case instead of spaces in field names');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      fieldCount
    };
  }

  /**
   * Helper method to count fields in structure
   */
  private countFields(obj: any, count = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return count;
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        count++;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key]) && obj[key].length > 0) {
            count = this.countFields(obj[key][0], count);
          } else if (!Array.isArray(obj[key])) {
            count = this.countFields(obj[key], count);
          }
        }
      }
    }

    return count;
  }

  /**
   * Helper method to get field names from structure
   */
  private getFieldNames(obj: any, names: string[] = []): string[] {
    if (typeof obj !== 'object' || obj === null) {
      return names;
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        names.push(key);
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key]) && obj[key].length > 0) {
            this.getFieldNames(obj[key][0], names);
          } else if (!Array.isArray(obj[key])) {
            this.getFieldNames(obj[key], names);
          }
        }
      }
    }

    return names;
  }
}