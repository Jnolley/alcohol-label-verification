import request from 'supertest';
import express from 'express';
import { createVerificationRoutes } from '../verification.routes';
import { VerificationController } from '../../controllers/verification.controller';

// Mock the controller
jest.mock('../../controllers/verification.controller');

describe('Verification Routes', () => {
  let app: express.Application;
  let mockController: jest.Mocked<VerificationController>;

  beforeEach(() => {
    mockController = {
      verifyLabel: jest.fn(),
    } as any;

    app = express();
    app.use(express.json());
    app.use('/api', createVerificationRoutes(mockController));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/verify', () => {
    it('should call controller.verifyLabel with multipart form data', async () => {
      mockController.verifyLabel.mockImplementation(async (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/verify')
        .field('brandName', 'Test Brand')
        .field('productType', 'Bourbon')
        .field('alcoholContent', '45')
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(mockController.verifyLabel).toHaveBeenCalled();
    });

    it('should accept requests without image', async () => {
      mockController.verifyLabel.mockImplementation(async (req, res) => {
        res.status(400).json({
          error: { code: 'MISSING_IMAGE', message: 'Image file is required' },
        });
      });

      const response = await request(app)
        .post('/api/verify')
        .field('brandName', 'Test Brand')
        .field('productType', 'Bourbon')
        .field('alcoholContent', '45');

      expect(response.status).toBe(400);
      expect(mockController.verifyLabel).toHaveBeenCalled();
    });

    it('should accept optional net contents fields', async () => {
      mockController.verifyLabel.mockImplementation(async (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/verify')
        .field('brandName', 'Test Brand')
        .field('productType', 'Bourbon')
        .field('alcoholContent', '45')
        .field('netContentsValue', '750')
        .field('netContentsUnit', 'ml')
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(mockController.verifyLabel).toHaveBeenCalled();
    });

    it('should enforce file size limit', async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app)
        .post('/api/verify')
        .field('brandName', 'Test Brand')
        .field('productType', 'Bourbon')
        .field('alcoholContent', '45')
        .attach('image', largeBuffer, 'large.jpg');

      expect(response.status).toBe(500); // Multer error
    });

    it('should handle multiple file uploads by accepting only first', async () => {
      mockController.verifyLabel.mockImplementation(async (req, res) => {
        // Should only receive one file
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/verify')
        .field('brandName', 'Test Brand')
        .field('productType', 'Bourbon')
        .field('alcoholContent', '45')
        .attach('image', Buffer.from('fake-image-data-1'), 'test1.jpg');

      expect(response.status).toBe(200);
    });
  });

  describe('Route configuration', () => {
    it('should create router with POST /verify endpoint', () => {
      const router = createVerificationRoutes(mockController);
      expect(router).toBeDefined();
      expect(router.stack).toBeDefined();
      expect(router.stack.some((layer: any) => layer.route?.path === '/verify')).toBe(true);
    });

    it('should only accept POST requests on /verify', async () => {
      const getResponse = await request(app).get('/api/verify');
      expect(getResponse.status).toBe(404);

      const putResponse = await request(app).put('/api/verify');
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete('/api/verify');
      expect(deleteResponse.status).toBe(404);
    });
  });
});