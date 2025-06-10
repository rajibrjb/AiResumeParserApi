export interface IDocumentProcessor {
  extractText(buffer: Buffer, mimeType: string): Promise<string>;
  getSupportedMimeTypes(): string[];
}
