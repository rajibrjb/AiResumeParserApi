import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { config } from '../config/config';

export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    throw createError('No file uploaded. Please provide a resume file using one of these field names: resume, file, document, upload', 400);
  }

  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (!allowedMimes.includes(req.file.mimetype)) {
    throw createError(`Invalid file type: ${req.file.mimetype}. Please upload PDF, DOCX, or TXT files only.`, 400);
  }

  if (req.file.size > config.maxFileSize) {
    throw createError(`File size (${(req.file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${config.maxFileSize / 1024 / 1024}MB`, 400);
  }

  console.log(`File uploaded successfully: ${req.file.originalname} (${req.file.mimetype}, ${(req.file.size / 1024).toFixed(1)}KB)`);

  next();
};