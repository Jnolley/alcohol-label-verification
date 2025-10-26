import express from 'express';
import cors from 'cors';
import { VerificationController } from './api/controllers/verification.controller';
import { createVerificationRoutes } from './api/routes/verification.routes';
import { AdminController } from './api/controllers/admin.controller';
import { createAdminRoutes } from './api/routes/admin.routes';
import { VerificationManager } from './services/manager/label-verification/implementation/verification-manager';
import { FieldValidator } from './services/validation/field-validation/implementation/field-validator';
import { ImageValidator } from './services/utility/image-processing/implementation/image-validator';
import { TextExtractor } from './services/engine/ocr/implementation/text-extractor';
import { LabelVerifier } from './services/engine/verification/implementation/label-verifier';
import { Normalizer } from './services/utility/normalization/implementation/normalizer';
import { SubmissionStore } from './storage/implementation/submission.store';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: true, credentials: true }));

  const fieldValidator = new FieldValidator();
  const imageValidator = new ImageValidator();
  const textExtractor = new TextExtractor();
  const normalizer = new Normalizer();
  const labelVerifier = new LabelVerifier(normalizer);

  const submissionStore = new SubmissionStore();

  const verificationManager = new VerificationManager(
    fieldValidator,
    imageValidator,
    textExtractor,
    labelVerifier
  );

  const verificationController = new VerificationController(verificationManager, submissionStore);
  const adminController = new AdminController(submissionStore);

  app.use('/api', createVerificationRoutes(verificationController));
  app.use('/api/admin', createAdminRoutes(adminController));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}