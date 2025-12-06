/**
 * File: userController.ts
 * Author: eventFlow Team
 * Deskripsi: Mengelola seluruh endpoint API terkait user, termasuk profil, update data, dan hapus akun. Mendukung upload avatar ke Cloudinary.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Express, Prisma, JWT, Cloudinary
 */
import { Request, Response } from 'express';

import {
  findUserById,
  updateUser as updateUserRepo,
  deleteUser as deleteUserRepo,
} from '../repositories/userRepository';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import { verifyJwt } from '../utils/jwt';
import { User } from '../types/user';
import { JWTPayload } from '../types/jwtPayload';
import { uploadToCloudinary } from '../utils/cloudinary';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const userRaw = await findUserById(payload.userId);
    if (!userRaw)
      return res.status(404).json(errorResponse('User not found'));
    // Map passwordHash and avatarUrl: null -> undefined for type compatibility
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

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { name, phoneNumber } = req.body;

    let avatarUrl = req.body.avatarUrl;
    // Jika ada file avatar yang diupload (via multer)
    if (req.file) {
      try {
        avatarUrl = await uploadToCloudinary(req.file.path);
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        res.status(500).json(errorResponse(err));
        return;
      }
    }

    // Build update data object - only include fields that are provided
    const updateData: {
      name?: string;
      phoneNumber?: string;
      avatarUrl?: string;
    } = {};
    
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const userRaw = await updateUserRepo(payload.userId, updateData);
    const user: User = {
      ...userRaw,
      passwordHash: userRaw.passwordHash === null ? undefined : userRaw.passwordHash,
      avatarUrl: userRaw.avatarUrl === null ? undefined : userRaw.avatarUrl,
      phoneNumber: userRaw.phoneNumber === null ? undefined : userRaw.phoneNumber,
      googleId: userRaw.googleId === null ? undefined : userRaw.googleId,
    };
    res.json(baseResponse({ success: true, data: user }));
  } catch (err) {
    console.error('Update profile error:', err);
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
