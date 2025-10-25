import { Router } from 'express';
import multer from 'multer';
import { VerificationController } from '../controllers/verification.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export function createVerificationRoutes(controller: VerificationController): Router {
  const router = Router();

  router.post('/verify', upload.single('image'), (req, res) => controller.verifyLabel(req, res));

  return router;
}