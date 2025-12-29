/**
 * @file userNotificationController.ts
 * @module controllers/userNotificationController
 * @author eventFlow Team
 * @description Handles user notification endpoints, including retrieval, marking as read, and unread notification count.
 * @created 2025-11-10
 * @lastModified 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, Prisma, JWT, ../repositories/userNotificationRepository, ../repositories/notificationRepository, ../utils/baseResponse, ../types/notification, ../types/jwtPayload, ../utils/jwt
 */
import { Request, Response } from 'express';
import {
  listUserNotifications,
  updateUserNotification,
  listUserUnreadNotifications,
  listUserReadNotifications,
  deleteUserNotification,
  deleteAllNotification,
  deleteAllUserNotificationEvent,
  markAllNotificationsAsRead
} from '../repositories/userNotificationRepository';
import { findNotificationById } from '../repositories/notificationRepository';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import { Notification } from '../types/notification';
import { JWTPayload } from '../types/jwtPayload';
import { verifyJwt } from '../utils/jwt';

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const userNotifications = await listUserNotifications(payload.userId);
    const notifications: Notification[] = await Promise.all(
      userNotifications.map(async (un) => {
        const notification = await findNotificationById(un.notificationId);
        return notification
          ? {
            ...notification,
            eventId: notification.eventId ?? undefined,
            category: notification.category ?? undefined,
          }
          : null;
      })
    ).then(arr => arr.filter(n => n !== null) as Notification[]);
    res.json(baseResponse({ success: true, data: notifications }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { notificationId } = req.params;
    const updatedUserNotif = await updateUserNotification(
      notificationId,
      payload.userId,
      { isRead: true, readAt: new Date() },
    );
    const notification = await findNotificationById(updatedUserNotif.notificationId);
    const updated: Notification | null = notification
      ? {
        ...notification,
        eventId: notification.eventId ?? undefined,
        category: notification.category ?? undefined,
      }
      : null;
    res.json(baseResponse({ success: true, data: updated }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const getListUnreadNotifications = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const unreadNotifications = await listUserUnreadNotifications(payload.userId);
    res.json(baseResponse({ success: true, data: { unreadNotifications } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const getListReadNotifications = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const readNotifications = await listUserReadNotifications(payload.userId);
    res.json(baseResponse({ success: true, data: { readNotifications } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }
    const updatedCount = await markAllNotificationsAsRead(payload.userId);
    res.json(baseResponse({
      success: true,
      data: {
        updatedCount
      }
    }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const deleteUserNotificationById = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { notificationId } = req.params;
    await deleteUserNotification(notificationId, payload.userId);
    res.json(baseResponse({ success: true, data: null }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const deleteAllNotificationByEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { eventId } = req.params;
    await deleteAllUserNotificationEvent(payload.userId, eventId);
    res.json(baseResponse({ success: true, data: null }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const deleteAllNotificationForUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    await deleteAllNotification(payload.userId);
    res.json(baseResponse({ success: true, data: null }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
