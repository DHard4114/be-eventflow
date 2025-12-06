

/**
 * File: notificationController.ts
 * Author: eventFlow Team
 * Deskripsi: Mengelola endpoint broadcast notifikasi event, pengambilan dan update status notifikasi user.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Express, Prisma, JWT
*/
import { Request, Response } from 'express';
import { listNotifications, createNotification } from '../repositories/notificationRepository';
import { createUserNotification } from '../repositories/userNotificationRepository';
import { prisma } from '../config/prisma';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import { verifyJwt } from '../utils/jwt';
import { JWTPayload } from '../types/jwtPayload';
import { emitNotification } from '../utils/socket';
import { Notification } from '../types/notification';
import { findEventById, isEventOrganizer } from '../repositories/eventRepository';
import { findActiveEventParticipant } from '../repositories/eventParticipantRepository';

export const sendCustomNotification = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload || payload.role !== 'ORGANIZER') {
      return res.status(403).json(errorResponse('Forbidden: Only organizer can send custom notification.'));
    }
    const { eventId } = req.params;
    const { participantId, title, message, type } = req.body;
    if (!participantId || !title || !message || !type) {
      return res.status(400).json(errorResponse('participantId, title, message, type wajib diisi'));
    }
    // Validasi organizer event
    const organizerValid = await isEventOrganizer(eventId, payload.userId);
    if (!organizerValid) {
      return res.status(403).json(errorResponse('Forbidden: You are not the organizer of this event.'));
    }
    // Validasi participant aktif di event
    const participant = await findActiveEventParticipant(participantId, eventId);
    if (!participant) {
      return res.status(404).json(errorResponse('Participant not found or not active in this event.'));
    }
    // Buat notifikasi
    const notif = await createNotification({
      title,
      message,
      type,
      eventId,
      deliveryMethod: 'INDIVIDUAL',
      createdBy: { connect: { id: payload.userId } },
      userNotifications: {
        create: [{ user: { connect: { id: participantId } } }]
      }
    });
    // Emit real-time
    emitNotification({
      id: notif.id,
      title,
      message,
      type,
      eventId,
      createdAt: notif.createdAt
    });
    res.json(baseResponse({ success: true, data: notif, message: 'Notifikasi berhasil dikirim ke participant.' }));
  } catch (err) {
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

export const createBroadcast = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { eventId, category, message, title, type } = req.body;
    if (!eventId || !message || !title)
      return res.status(400).json(errorResponse('Missing fields'));
    // Validasi event dan hak broadcast
    const event = await findEventById(eventId);
    if (!event)
      return res.status(404).json(errorResponse('Event not found'));
    if (event.organizerId !== payload.userId)
      return res.status(403).json(errorResponse('Anda bukan organizer event ini'));
    // Validasi type agar hanya enum NotificationType
    const allowedTypes = ['GENERAL', 'EVENT_UPDATE', 'SECURITY_ALERT', 'REPORT_FEEDBACK'];
    const notifType = allowedTypes.includes(type) ? type : 'GENERAL';
    // 1. Buat notifikasi event
    const prismaNotification = await createNotification({
      eventId,
      category,
      message,
      title,
      type: notifType,
      deliveryMethod: 'BROADCAST',
      createdBy: { connect: { id: payload.userId } },
    });
    // 2. Ambil semua peserta event (exclude organizer)
    const participants = await prisma.eventParticipant.findMany({ 
      where: { 
        eventId,
        userId: { not: event.organizerId }
      } 
    });
    // 3. Assign notifikasi ke semua peserta
    await Promise.all(participants.map(async (p) => {
      await createUserNotification({
        notification: { connect: { id: prismaNotification.id } },
        user: { connect: { id: p.userId } },
      });
    }));
    const notification: Notification = {
      ...prismaNotification,
      eventId: prismaNotification.eventId ?? undefined,
      category: prismaNotification.category ?? undefined,
    };
    emitNotification(notification);
    res.json(baseResponse({ success: true, data: notification }));
  } catch (err) {
    next(err);
  }
};

export const getEventNotifications = async (req: Request, res: Response, next: Function) => {
  try {
    const { id: eventId } = req.params;
    if (!eventId) return res.status(400).json(errorResponse('eventId wajib diisi'));
    
    // Get event to find organizer
    const event = await findEventById(eventId);
    if (!event) return res.status(404).json(errorResponse('Event not found'));
    
    const notifications = await listNotifications(eventId);
    
    // Transform response to include receiver field and exclude organizer
    const transformedNotifications = notifications.map((notif) => {
      const { userNotifications, createdBy, ...rest } = notif;
      
      // Filter out organizer from receivers
      const receivers = userNotifications
        .map((un) => un.user)
        .filter((user) => user.id !== event.organizerId);
      
      return {
        ...rest,
        // Return single receiver object for INDIVIDUAL, not array
        receiver: notif.deliveryMethod === 'INDIVIDUAL' && receivers.length > 0 
          ? receivers[0]  // Take first receiver as object
          : undefined,
        createdBy: createdBy || undefined, // Include creator info
        userNotifications // Keep this for fallback in frontend
      };
    });
    
    res.json(baseResponse({ success: true, data: transformedNotifications }));
  } catch (err) {
    next(err);
  }
};

