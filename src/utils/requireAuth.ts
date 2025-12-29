/**
 * @file requireAuth.ts
 * @module utils/requireAuth
 * @author eventFlow Team
 * @description Middleware dan utilitas untuk validasi autentikasi JWT pada setiap request API.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, ./jwt
 */
import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from './jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = token ? verifyJwt(token) as unknown : null;
  if (!payload || typeof payload !== 'object' || !('userId' in payload)) return res.status(401).json({ error: 'Unauthorized' });
  (req as unknown as { user: typeof payload }).user = payload;
  next();
}
