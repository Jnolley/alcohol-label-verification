import express from 'express';
import { VerificationController } from './api/controllers/verification.controller';
import { createVerificationRoutes } from './api/routes/verification.routes';
import { VerificationManager } from './services/manager/label-verification';
import { FieldValidator } from './services/validation/field-validation';
import { ImageValidator } from './services/utility/image-processing';
import { TextExtractor } from './services/engine/ocr';
import { LabelVerifier } from './services/engine/verification';
import { Normalizer } from './services/utility/normalization';

export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use((req, res, next) => {
    const allowedOrigin = process.env.CORS_ORIGIN || '*';
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Dependency injection
  const fieldValidator = new FieldValidator();
  const imageValidator = new ImageValidator();
  const textExtractor = new TextExtractor();
  const normalizer = new Normalizer();
  const labelVerifier = new LabelVerifier(normalizer);

  const verificationManager = new VerificationManager(
    fieldValidator,
    imageValidator,
    textExtractor,
    labelVerifier
  );

  const verificationController = new VerificationController(verificationManager);

  // Routes
  app.use('/api', createVerificationRoutes(verificationController));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}