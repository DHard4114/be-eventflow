
/**
 * @file googleAuthController.ts
 * @module controllers/googleAuthController
 * @author eventFlow Team
 * @description Handles Google OAuth authentication endpoints for user login and registration.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, Prisma, JWT, Google OAuth
 */
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken)
      return res.status(400).json(errorResponse('Missing idToken'));
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch {
      return res.status(401).json(errorResponse('Invalid Google token'));
    }
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email || !payload?.name) {
      return res.status(400).json(errorResponse('Google token missing required fields'));
    }
    // Cari user berdasarkan googleId atau email
    let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: payload.email } });
    }
    // Jika belum ada, buat user baru
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.picture || undefined,
          role: 'PARTICIPANT',
        },
      });
    } else if (!user.googleId) {
      // Update googleId jika belum ada
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
      });
    }
    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json(baseResponse({ success: true, data: { token, user } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
