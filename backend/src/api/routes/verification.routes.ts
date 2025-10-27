import { Router } from 'express';
import multer from 'multer';
import { VerificationController } from '../controllers/verification.controller';
import config from '../../config';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.image.maxFileSizeBytes,
  },
});

export function createVerificationRoutes(controller: VerificationController): Router {
  const router = Router();

  router.post('/verify', upload.fields([
    { name: 'primaryImage', maxCount: 1 },
    { name: 'secondaryImage', maxCount: 1 }
  ]), (req, res) => controller.verifyLabel(req, res));

  return router;
}