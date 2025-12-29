
/**
 * @file deviceController.ts
 * @module controllers/deviceController
 * @author eventFlow Team
 * @description Handles device registration, push token update, and user device deletion endpoints.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, Prisma, JWT
 */
import { Request, Response } from 'express';
import {
  findDeviceByPushToken,
  createDevice,
  updateDevice,
  deleteDevice as deleteDeviceRepo,
  findDevicesByUserId,
} from '../repositories/deviceRepository';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import { Device } from '../config/prisma';
import { JWTPayload } from '../types/jwtPayload';
import { verifyJwt } from '../utils/jwt';

// Register or update device push token
export const registerDevice = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { pushToken } = req.body;
    if (!pushToken)
      return res.status(400).json(errorResponse('Missing pushToken'));
    let device: Device | null = await findDeviceByPushToken(pushToken);
    if (device) {
      device = await updateDevice(device.id, {
        userId: payload.userId,
        lastLoginAt: new Date(),
      });
    } else {
      device = await createDevice({ userId: payload.userId, pushToken });
    }
    res.json(baseResponse({ success: true, data: device }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Get all devices for current user
export const getMyDevices = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const devices: Device[] = await findDevicesByUserId(payload.userId);
    res.json(baseResponse({ success: true, data: devices }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Delete device (logout)
export const deleteDevice = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { deviceId } = req.params;
    await deleteDeviceRepo(deviceId);
    res.json(baseResponse({ success: true }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
