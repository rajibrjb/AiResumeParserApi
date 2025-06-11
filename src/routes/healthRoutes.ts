// src/routes/healthRoutes.ts
import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { RateLimitController } from '../controllers/rateLimit.controller';

const router = Router();
const healthController = new HealthController();
const rateLimitController = new RateLimitController();

// Basic health check - compatible with your existing script
router.get('/', healthController.getHealth);

// Kubernetes/Docker health checks
router.get('/live', healthController.getLive);       // Liveness probe
router.get('/ready', healthController.getReady);     // Readiness probe

// Detailed system status
router.get('/status', healthController.getStatus);

// Rate limiting endpoints (optional - for monitoring)
router.get('/rate-limit/stats', rateLimitController.getStats);
router.get('/rate-limit/:key', rateLimitController.getStatus);
router.delete('/rate-limit/:key', rateLimitController.resetLimit);

export { router as healthRoutes };