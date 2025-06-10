const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import { IDocumentProcessor } from '../interfaces/documentProcessor.interface';
import { logger } from '../utils/logger';

export class DocumentProcessorService implements IDocumentProcessor {
  private supportedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPdf(buffer);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromDocx(buffer);
        case 'text/plain':
          return buffer.toString('utf-8');
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      logger.error('Error extracting text from document:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  getSupportedMimeTypes(): string[] {
    return [...this.supportedMimeTypes];
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }

  private async extractFromDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
