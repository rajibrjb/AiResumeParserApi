import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/resume.types';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const isOperational = err.isOperational || false;

  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    isOperational,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  const response: ApiResponse<null> = {
    success: false,
    message: isOperational ? err.message : 'Internal server error',
    errors: isOperational ? [err.message] : ['Something went wrong']
  };

  res.status(statusCode).json(response);
};

export const createError = (message: string, statusCode: number = 500): CustomError => {
  const error: CustomError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};