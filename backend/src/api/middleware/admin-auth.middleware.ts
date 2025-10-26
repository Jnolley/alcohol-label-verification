import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import config from '../../config';

/**
 * Simple admin authentication middleware
 * Checks for basic auth credentials in Authorization header or body
 */
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for credentials in Authorization header (Basic Auth)
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Basic ')) {
    // Decode Basic Auth
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    // Split only on first colon to handle passwords with colons
    const colonIndex = credentials.indexOf(':');
    const username = colonIndex !== -1 ? credentials.substring(0, colonIndex) : credentials;
    const password = colonIndex !== -1 ? credentials.substring(colonIndex + 1) : '';

    if (username === config.admin.username && password === config.admin.password) {
      return next();
    }
  }

  // Check for credentials in request body (for login endpoint)
  const { username, password } = req.body;

  if (username === config.admin.username && password === config.admin.password) {
    return next();
  }

  // Unauthorized
  throw createError(401, 'Invalid admin credentials');
}