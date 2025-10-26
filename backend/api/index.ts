import express from 'express';
import cors from 'cors';
import { VerificationController } from '../src/api/controllers/verification.controller';
import { createVerificationRoutes } from '../src/api/routes/verification.routes';
import { AdminController } from '../src/api/controllers/admin.controller';
import { createAdminRoutes } from '../src/api/routes/admin.routes';
import { VerificationManager } from '../src/services/manager/label-verification/implementation/verification-manager';
import { FieldValidator } from '../src/services/validation/field-validation/implementation/field-validator';
import { ImageValidator } from '../src/services/utility/image-processing/implementation/image-validator';
import { TextExtractor } from '../src/services/engine/ocr/implementation/text-extractor';
import { LabelVerifier } from '../src/services/engine/verification/implementation/label-verifier';
import { Normalizer } from '../src/services/utility/normalization/implementation/normalizer';
import { SubmissionStore } from '../src/storage/implementation/submission.store';
import { ImagePreprocessor } from '../src/services/utility/image-processing/implementation/image-preprocessor';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

const fieldValidator = new FieldValidator();
const imageValidator = new ImageValidator();
const imagePreprocessor = new ImagePreprocessor();
const textExtractor = new TextExtractor(imagePreprocessor);
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

export default app;
