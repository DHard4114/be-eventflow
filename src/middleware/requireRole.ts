
/**
 * @file requireRole.ts
 * @module middleware/requireRole
 * @author eventFlow Team
 * @description Middleware for validating user roles on specific endpoints (e.g., ORGANIZER, PARTICIPANT).
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, JWT
 */
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { verifyJwt } from '../utils/jwt';

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? verifyJwt(token) as unknown : null;
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: (payload as { userId: string }).userId } });
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    // Attach user info to request for downstream use
    (req as unknown as { user: typeof user }).user = user;
    next();
  };
};
