import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/resume.types';

const router = Router();

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

router.get('/', (req: Request, res: Response<ApiResponse<HealthData>>) => {
  const healthData: HealthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  const response: ApiResponse<HealthData> = {
    success: true,
    data: healthData,
    message: 'Service is healthy'
  };

  res.status(200).json(response);
});

router.get('/ready', (req: Request, res: Response<ApiResponse<{ ready: boolean }>>): void => {
  const response: ApiResponse<{ ready: boolean }> = {
    success: true,
    data: { ready: true },
    message: 'Service is ready'
  };

  res.status(200).json(response);
});

export { router as healthRoutes };
