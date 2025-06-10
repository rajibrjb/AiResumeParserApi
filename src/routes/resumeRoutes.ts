import { Router } from 'express';
import { ResumeController } from '../controllers/resume.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { validateFileUpload } from '../middleware/validation.middleware';

const router = Router();
const resumeController = new ResumeController();

// POST /api/v1/resume/parse - Parse resume file with optional custom structure
router.post('/parse', uploadMiddleware, validateFileUpload, resumeController.parseResume);

// GET /api/v1/resume/formats - Get supported file formats
router.get('/formats', resumeController.getSupportedFormats);

// GET /api/v1/resume/fields - Get available parsing fields
router.get('/fields', resumeController.getParsingFields);

// GET /api/v1/resume/structure - Get default parsing structure template
router.get('/structure', resumeController.getDefaultStructure);

// GET /api/v1/resume/test - Test AI connectivity
router.get('/test', resumeController.testAIConnection);

// GET /api/v1/resume/provider - Get AI provider information
router.get('/provider', resumeController.getProviderInfo);

export { router as resumeRoutes };
