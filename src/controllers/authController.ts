/**
 * File: authController.ts
 * Author: eventFlow Team
 * Deskripsi: Mengelola endpoint autentikasi user, registrasi, login, update data, dan penghapusan akun.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Express, Prisma, JWT
 */
import { Request, Response } from 'express';
import {
  findUserByEmail,
  createUser,
  updateUser as updateUserRepo,
  deleteUser as deleteUserRepo,
} from '../repositories/userRepository';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import bcrypt from 'bcryptjs';
import { signJwt, verifyJwt } from '../utils/jwt';
import { User } from '../types/user';
import { JWTPayload } from '../types/jwtPayload';

export const updateUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { name, phoneNumber, avatarUrl, password } = req.body;
    interface UpdateUserData {
      name?: string;
      phoneNumber?: string;
      avatarUrl?: string;
      passwordHash?: string;
    }
    let data: UpdateUserData = { name, phoneNumber, avatarUrl };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    const userRaw = await updateUserRepo(payload.userId, data);
    const user: User = {
      ...userRaw,
      passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
      avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
      phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
      googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
    };
    res.json(baseResponse({ success: true, data: user }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    await deleteUserRepo(payload.userId);
    res.json(baseResponse({ success: true }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const regitserAsOrganizer = async (req: Request, res: Response) => {
  try{
    const {name, email, password, phoneNumber} = req.body;
    if (!name || !email || !password)
      return res.status(400).json(errorResponse('Missing fields'));
    const existing = await findUserByEmail(email);
    if (existing)
      return res.status(409).json(errorResponse('Email already registered'));
    const passwordHash = await bcrypt.hash(password, 10);
    const userRaw = await createUser({
      name,
      email,
      passwordHash,
      phoneNumber,
      role: 'ORGANIZER',
    });
    const user: User = {
      ...userRaw,
      passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
      avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
      phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
      googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
    };
    res.json(baseResponse({ success: true, data: { user } }));
  }
  catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber } = req.body;
    if (!name || !email || !password)
      return res.status(400).json(errorResponse('Missing fields'));
    const existing = await findUserByEmail(email);
    if (existing)
      return res.status(409).json(errorResponse('Email already registered'));
    const passwordHash = await bcrypt.hash(password, 10);
    const userRaw = await createUser({
      name,
      email,
      passwordHash,
      phoneNumber,
    });
    const user: User = {
      ...userRaw,
      passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
      avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
      phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
      googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
    };
    // const token = signJwt({ userId: user.id, role: user.role });
    res.json(baseResponse({ success: true, data: { user } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};



export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json(errorResponse('Missing fields'));
    const userRaw = await findUserByEmail(email);
    if (!userRaw || !userRaw.passwordHash)
      return res.status(401).json(errorResponse('Invalid credentials'));
    const user: User = {
      ...userRaw,
      passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
      avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
      phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
      googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
    };
    // passwordHash is checked above, but ensure type safety for bcrypt
    if (typeof user.passwordHash !== 'string') {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json(errorResponse('Invalid credentials'));
    const token = signJwt({ userId: user.id, role: user.role });
    res.json(baseResponse({ success: true, data: { user, token } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
