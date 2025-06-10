import { IAIParser } from '../interfaces/aiParser.interface';
import { IDocumentProcessor } from '../interfaces/documentProcessor.interface';
import { CustomParsingStructure } from '../types/resume.types';
import { AIParserFactory } from './ai/aiParserFactory';
import { DocumentProcessorService } from './documentProcessor.service';
import { logger } from '../utils/logger';

export class ResumeParserService {
  private aiParser: IAIParser;
  private documentProcessor: IDocumentProcessor;

  constructor(aiParser?: IAIParser, documentProcessor?: IDocumentProcessor) {
    this.aiParser = aiParser || AIParserFactory.createParser();
    this.documentProcessor = documentProcessor || new DocumentProcessorService();
  }

  async parseResume(fileBuffer: Buffer, mimeType: string, customStructure?: CustomParsingStructure): Promise<any> {
    try {
      if (!this.aiParser.isConfigured()) {
        throw new Error('AI parser is not properly configured. Please check your API key.');
      }

      logger.info(`Extracting text from document of type: ${mimeType}`);
      const extractedText = await this.documentProcessor.extractText(fileBuffer, mimeType);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content found in the document. The file might be corrupted or empty.');
      }

      logger.info('Text extraction successful', {
        textLength: extractedText.length,
        preview: extractedText.substring(0, 100),
        hasCustomStructure: !!customStructure
      });

      if (extractedText.length < 50) {
        logger.warn('Extracted text is very short', { textLength: extractedText.length });
      }

      logger.info('Starting AI parsing process');
      const parsedResume = await this.aiParser.parseResume(extractedText, customStructure);

      logger.info('Resume parsing completed successfully', {
        hasCustomStructure: !!customStructure,
        providerUsed: this.aiParser.getProviderName()
      });

      return parsedResume;

    } catch (error) {
      logger.error('Error in resume parsing service:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        mimeType,
        bufferSize: fileBuffer.length,
        hasCustomStructure: !!customStructure
      });

      if (error instanceof Error) {
        if (error.message.includes('AI') || error.message.includes('Google') || 
            error.message.includes('OpenAI') || error.message.includes('Anthropic')) {
          throw error;
        }
        if (error.message.includes('text content')) {
          throw error;
        }
      }

      throw new Error(`Resume parsing failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }

  getSupportedFileTypes(): string[] {
    return this.documentProcessor.getSupportedMimeTypes();
  }

  async testAIConnection(): Promise<boolean> {
    try {
      if (!this.aiParser.isConfigured()) {
        return false;
      }
      
      const testText = "John Doe\nSoftware Engineer\nEmail: john@example.com\nSkills: JavaScript, Python";
      await this.aiParser.parseResume(testText);
      return true;
    } catch (error) {
      logger.error('AI connection test failed:', error);
      return false;
    }
  }

  getDefaultStructure(): CustomParsingStructure {
    return {
      "personalInfo": {
        "fullName": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedinUrl": "",
        "githubUrl": "",
        "portfolioUrl": ""
      },
      "summary": "",
      "experience": [
        {
          "company": "",
          "position": "",
          "startDate": "",
          "endDate": "",
          "location": "",
          "description": "",
          "achievements": ""
        }
      ],
      "education": [
        {
          "institution": "",
          "degree": "",
          "field": "",
          "startDate": "",
          "endDate": "",
          "gpa": "",
          "achievements": ""
        }
      ],
      "skills": {
        "technical": "",
        "soft": "",
        "tools": "",
        "frameworks": "",
        "languages": ""
      },
      "certifications": [
        {
          "name": "",
          "issuer": "",
          "date": "",
          "expiryDate": "",
          "credentialId": ""
        }
      ],
      "languages": [
        {
          "name": "",
          "proficiency": ""
        }
      ],
      "projects": [
        {
          "name": "",
          "description": "",
          "technologies": "",
          "url": "",
          "githubUrl": "",
          "startDate": "",
          "endDate": ""
        }
      ],
      "achievements": ""
    };
  }

  getAIProviderInfo(): { name: string; configured: boolean } {
    return {
      name: this.aiParser.getProviderName(),
      configured: this.aiParser.isConfigured()
    };
  }
}
