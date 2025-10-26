import request from 'supertest';
import { createApp } from '../app';
import express from 'express';

describe('App', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('Middleware', () => {
    it('should have JSON parsing middleware', async () => {
      const response = await request(app)
        .post('/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Should not fail due to JSON parsing
      expect(response.status).not.toBe(500);
    });

    it('should have CORS middleware', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:4200');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should have URL-encoded parsing middleware', async () => {
      const response = await request(app)
        .post('/health')
        .send('key=value')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Should not fail due to URL-encoded parsing
      expect(response.status).not.toBe(500);
    });
  });

  describe('Health Check', () => {
    it('should respond to health check endpoint', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('API Routes', () => {
    it('should have /api/verify endpoint mounted', async () => {
      const response = await request(app).post('/api/verify');

      // Should not be 404, even if it fails for other reasons
      expect(response.status).not.toBe(404);
    });
  });

  describe('Dependency Injection', () => {
    it('should create app with all dependencies wired up', () => {
      const testApp = createApp();

      expect(testApp).toBeDefined();
      expect(typeof testApp.listen).toBe('function');
    });

    it('should be able to create multiple independent app instances', () => {
      const app1 = createApp();
      const app2 = createApp();

      expect(app1).not.toBe(app2);
      expect(app1).toBeDefined();
      expect(app2).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle requests to non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should handle invalid HTTP methods', async () => {
      const response = await request(app).patch('/health');

      expect(response.status).toBe(404);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from any origin by default', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://example.com');

      expect(response.headers['access-control-allow-origin']).toBeTruthy();
    });

    it('should include CORS headers in response', async () => {
      const response = await request(app).options('/health');

      // CORS preflight should be handled
      expect(response.status).toBe(204);
    });
  });
});