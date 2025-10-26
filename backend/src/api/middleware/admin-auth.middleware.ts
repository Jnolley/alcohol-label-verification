import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import config from '../../config';

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Basic ')) {
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

  const { username, password } = req.body;

  if (username === config.admin.username && password === config.admin.password) {
    return next();
  }

  throw createError(401, 'Invalid admin credentials');
}