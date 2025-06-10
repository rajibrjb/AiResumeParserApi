import multer from 'multer';
import { Request } from 'express';
import { config } from '../config/config';
import { createError } from './errorHandler';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(`File type ${file.mimetype} is not supported. Allowed types: ${config.allowedFileTypes.join(', ')}`, 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
    files: 1
  }
});

export const uploadMiddleware = (req: any, res: any, next: any) => {
  let multerInstance = upload.any();
  
  multerInstance(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(createError(`File size exceeds limit of ${config.maxFileSize / 1024 / 1024}MB`, 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(createError('Only one file is allowed', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(createError('Unexpected field name. Please use one of: resume, file, document, upload', 400));
        }
      }
      return next(err);
    }
    
    if (!req.files || req.files.length === 0) {
      return next(createError('No file uploaded. Please provide a resume file.', 400));
    }
    
    req.file = req.files[0];
    
    if (req.body.customStructure) {
      try {
        req.customStructure = JSON.parse(req.body.customStructure);
      } catch (error) {
        return next(createError('Invalid JSON format in customStructure field', 400));
      }
    }
    
    next();
  });
};
