import { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';

const app = createApp();

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
