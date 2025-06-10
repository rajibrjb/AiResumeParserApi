import { IAIParser, AIProviderConfig } from '../../../interfaces/aiParser.interface';
import { CustomParsingStructure } from '../../../types/resume.types';
import { logger } from '../../../utils/logger';

export abstract class BaseAIParser implements IAIParser {
  protected config: AIProviderConfig;
  protected providerName: string;

  constructor(config: AIProviderConfig, providerName: string) {
    this.config = config;
    this.providerName = providerName;
  }

  abstract parseResume(content: string, customStructure?: CustomParsingStructure): Promise<any>;
  abstract testConnection(): Promise<boolean>;

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 10;
  }

  getProviderName(): string {
    return this.providerName;
  }

  protected buildPrompt(content: string, customStructure?: CustomParsingStructure): string {
    if (customStructure) {
      return this.buildCustomPrompt(content, customStructure);
    }
    return this.buildDefaultPrompt(content);
  }

  protected buildCustomPrompt(content: string, customStructure: CustomParsingStructure): string {
    return `
You are an expert resume parser. Parse the following resume text and extract structured information.
Return the response as a valid JSON object that EXACTLY matches the structure provided below.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no explanations, no additional text
2. Follow the EXACT structure provided - do not add, remove, or rename any fields
3. Preserve all field names exactly as given in the template
4. If information is not available, use appropriate defaults:
   - For strings: use empty string "" or null
   - For arrays: use empty array []
   - For objects: use empty object {} or fill with null values
   - For numbers: use null or 0
5. Ensure all dates are in YYYY-MM format or "Present" for current positions
6. For fields that are empty strings ("") but should contain arrays, convert to appropriate arrays
7. Respect the data types implied by the template structure
8. Extract ALL relevant information from the resume, even if partially complete

TEMPLATE STRUCTURE TO FOLLOW EXACTLY:
${JSON.stringify(customStructure, null, 2)}

RESUME CONTENT TO PARSE:
${content}

RESPOND WITH JSON MATCHING THE EXACT TEMPLATE STRUCTURE:`;
  }

  protected buildDefaultPrompt(content: string): string {
    return `
You are an expert resume parser. Parse the following resume text and extract structured information.
Return the response as a valid JSON object with a comprehensive structure.

INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no explanations, no additional text
2. Extract ALL available information from the resume
3. Use null for missing information, empty arrays [] for missing lists
4. Ensure all dates are in YYYY-MM format or "Present" for current positions
5. Create a comprehensive structure that captures all resume information

RESUME CONTENT TO PARSE:
${content}

RESPOND WITH COMPREHENSIVE JSON STRUCTURE:`;
  }

  protected cleanJsonResponse(text: string): string {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.trim();
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned;
  }

  protected processCustomStructure(aiResponse: any, customStructure: CustomParsingStructure): any {
    if (!customStructure) {
      return aiResponse;
    }

    const result = this.deepClone(customStructure);
    this.smartFillStructure(result, aiResponse, customStructure);
    return result;
  }

  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  private smartFillStructure(target: any, source: any, template: any): void {
    if (!source || typeof source !== 'object') {
      return;
    }

    for (const key in template) {
      if (!template.hasOwnProperty(key)) continue;

      const templateValue = template[key];
      const sourceValue = source[key];

      if (Array.isArray(templateValue)) {
        if (Array.isArray(sourceValue)) {
          target[key] = sourceValue;
        } else if (templateValue.length > 0 && typeof templateValue[0] === 'object') {
          if (Array.isArray(sourceValue)) {
            target[key] = sourceValue.map((item: any) => {
              const itemResult = this.deepClone(templateValue[0]);
              this.smartFillStructure(itemResult, item, templateValue[0]);
              return itemResult;
            });
          } else {
            target[key] = [];
          }
        } else {
          target[key] = Array.isArray(sourceValue) ? sourceValue : 
                       (sourceValue !== null && sourceValue !== undefined ? [sourceValue] : []);
        }
      } else if (typeof templateValue === 'object' && templateValue !== null) {
        if (typeof sourceValue === 'object' && sourceValue !== null) {
          this.smartFillStructure(target[key], sourceValue, templateValue);
        }
      } else {
        if (sourceValue !== null && sourceValue !== undefined) {
          target[key] = sourceValue;
        }
      }
    }

    this.fuzzyMatchFields(target, source, template);
  }

  private fuzzyMatchFields(target: any, source: any, template: any): void {
    const templateKeys = Object.keys(template);
    const sourceKeys = Object.keys(source);

    for (const sourceKey of sourceKeys) {
      if (templateKeys.includes(sourceKey)) {
        continue;
      }

      const normalizedSourceKey = sourceKey.toLowerCase().replace(/[_-]/g, '');
      
      for (const templateKey of templateKeys) {
        const normalizedTemplateKey = templateKey.toLowerCase().replace(/[_-]/g, '');
        
        if (normalizedSourceKey === normalizedTemplateKey ||
            normalizedSourceKey.includes(normalizedTemplateKey) ||
            normalizedTemplateKey.includes(normalizedSourceKey)) {
          
          if (this.isEmptyValue(target[templateKey], template[templateKey])) {
            if (Array.isArray(template[templateKey])) {
              target[templateKey] = Array.isArray(source[sourceKey]) ? source[sourceKey] : [source[sourceKey]];
            } else {
              target[templateKey] = source[sourceKey];
            }
          }
          break;
        }
      }
    }
  }

  private isEmptyValue(value: any, templateValue: any): boolean {
    if (Array.isArray(templateValue)) {
      return !Array.isArray(value) || value.length === 0;
    }
    if (typeof templateValue === 'object' && templateValue !== null) {
      return false;
    }
    return value === templateValue || value === null || value === undefined || value === '';
  }
}