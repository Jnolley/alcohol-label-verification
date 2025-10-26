import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';

export function createAdminRoutes(controller: AdminController): Router {
  const router = Router();

  // Login endpoint - uses auth middleware to validate credentials
  router.post('/login', adminAuthMiddleware, (req, res) => controller.login(req, res));

  // All other routes require authentication
  router.use(adminAuthMiddleware);

  // Submissions management
  router.get('/submissions', (req, res) => controller.getSubmissions(req, res));
  router.get('/submissions/:id', (req, res) => controller.getSubmissionById(req, res));
  router.patch('/submissions/:id', (req, res) => controller.updateSubmissionStatus(req, res));

  return router;
}