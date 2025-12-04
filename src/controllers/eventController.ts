/**
 * File: eventController.ts
 * Author: eventFlow Team
 * Deskripsi: Mengelola endpoint CRUD event, detail event, dan partisipasi/join event.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Express, Prisma, JWT
*/
import { Request, Response } from 'express';
import {
  findEventById,
  listEvents as listEventsRepo,
  createEvent as createEventRepo,
  updateEvent as updateEventRepo,
  deleteEvent as deleteEventRepo,
} from '../repositories/eventRepository';
import { joinOrReactivateEventParticipant, countEventParticipants, unjoinAllParticipantsByEventId} from '../repositories/eventParticipantRepository';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
// ...existing code...
import { JWTPayload } from '../types/jwtPayload';
import { verifyJwt } from '../utils/jwt';
import { generateJoinCode } from '../utils/generateJoinCode';
import { emitEventUpdate, emitAbsensiUpdate, emitNotification} from '../utils/socket';
import { Event } from '../types/event';
import type { EventParticipant } from '../types/eventParticipant';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const {
      name,
      description,
      startTime,
      endTime,
      locationName,
      latitude,
      longitude,
    } = req.body;
    if (
      !name ||
      !startTime ||
      !endTime ||
      !locationName ||
      !latitude ||
      !longitude
    ) {
      return res.status(400).json(errorResponse('Missing fields'));
    }
    const joinCode = generateJoinCode();
    const prismaEvent = await createEventRepo({
      name,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      locationName,
      latitude,
      longitude,
      joinCode, // Use the generated joinCode
      organizer: { connect: { id: payload.userId } },
    });
    // ORGANIZER otomatis jadi peserta event (single-record logic)
    await joinOrReactivateEventParticipant(payload.userId, prismaEvent.id);
    // Update totalParticipants di Event setelah counting
    const totalParticipants = await countEventParticipants(prismaEvent.id);
    await updateEventRepo(prismaEvent.id, { totalParticipants });
    const updatedEvent = await findEventById(prismaEvent.id);
    const event: Event = {
      ...updatedEvent!,
      description: updatedEvent?.description ?? undefined,
      maxParticipants: updatedEvent?.maxParticipants ?? undefined,
      totalParticipants,
    };
    res.json(baseResponse({ success: true, data: event }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prismaEvent = await findEventById(id);
    if (!prismaEvent)
      return res.status(404).json(errorResponse('Event not found'));
    const event: Event = {
      ...prismaEvent,
      description: prismaEvent.description ?? undefined,
      maxParticipants: prismaEvent.maxParticipants ?? undefined,
    };
    res.json(baseResponse({ success: true, data: event }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const listEvents = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let prismaEvents = await listEventsRepo();
    if (status && typeof status === 'string') {
      prismaEvents = prismaEvents.filter((e) => e.status === status);
    }
    const events: Event[] = await Promise.all(
      prismaEvents.map(async e => ({
        ...e,
        description: e.description ?? undefined,
        maxParticipants: e.maxParticipants ?? undefined,
        totalParticipants: await countEventParticipants(e.id),
      }))
    );
    res.json(baseResponse({ success: true, data: events }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { id } = req.params;
    const data = req.body;
    const prismaEvent = await updateEventRepo(id, data);

    // Jika status event diubah ke ONGOING/UPCOMING, organizer otomatis aktif sebagai participant
    if ((data.status === 'ONGOING' || data.status === 'UPCOMING') && prismaEvent.organizerId) {
      await joinOrReactivateEventParticipant(prismaEvent.organizerId, id);
    }

    const event: Event = {
      ...prismaEvent,
      description: prismaEvent.description ?? undefined,
      maxParticipants: prismaEvent.maxParticipants ?? undefined,
    };
    emitEventUpdate(id, event);
    res.json(baseResponse({ success: true, data: event }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { id } = req.params;
    await deleteEventRepo(id);
    res.json(baseResponse({ success: true }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
/**
 * Update status absensi peserta dan emit kehadiran ke semua client event
 * (Contoh endpoint: POST /events/:id/absensi)
*/
export const updateAbsensi = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { id } = req.params;
    const { attendanceStatus } = req.body;
    if (!attendanceStatus)
      return res.status(400).json(errorResponse('Status absensi kosong'));
    // Simpan status absensi di EventParticipant
    // (Implementasi update di repository sesuai skema)
    // emit ke semua client event
    const absensiPayload: EventParticipant = {
      userId: payload.userId,
      eventId: id,
      joinedAt: new Date(),
      nodeColor: undefined,
      attendanceStatus: undefined,
    };
  
    emitAbsensiUpdate(id, absensiPayload);
    res.json(baseResponse({ success: true, data: absensiPayload }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const joinEvent = async (req: Request, res: Response) => {
  try {
    // --- Auth & Input Validation ---
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }
    const { id } = req.params;
    const { joinCode } = req.body;
    
    // --- Event Validation ---
    const event = await findEventById(id);
    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }
    if (event.joinCode !== joinCode) {
      return res.status(400).json(errorResponse('Invalid join code'));
    }
    
    // --- Participant Count Validation ---
    const { listEventParticipants } = await import(
      '../repositories/eventParticipantRepository'
    );
    const participantList = await listEventParticipants(id);
    const participantCount = participantList.length;
    if (event.maxParticipants && participantCount >= event.maxParticipants) {
      // Emit real-time notification to all clients
      // const { emitNotification } = await import('../utils/socket');
      emitNotification({
        type: 'EVENT_FULL',
        eventId: id,
        message: 'Event sudah penuh, tidak bisa join lebih banyak peserta.',
      });
      return res.status(400).json(errorResponse('Event sudah penuh'));
    }
    
    // --- Create/Reactivate Participant (single-record logic) ---
    await joinOrReactivateEventParticipant(payload.userId, id);
    // Update totalParticipants di Event setelah counting
    const totalParticipants = await countEventParticipants(id);
    await updateEventRepo(id, { totalParticipants });
    const eventAfterJoin = await findEventById(id);
    const eventResponse: Event = {
      ...eventAfterJoin!,
      description: eventAfterJoin?.description ?? undefined,
      maxParticipants: eventAfterJoin?.maxParticipants ?? undefined,
      totalParticipants,
    };
    res.json(baseResponse({ success: true, data: eventResponse }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

/**
 * Selesaikan event: auto-unjoin semua peserta dan update status event
 */
export const finishEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload || payload.role !== 'ORGANIZER') {
      return res.status(403).json(errorResponse('Forbidden: Only organizers can finish an event.'));
    }

    const { id: eventId } = req.params;
    const event = await findEventById(eventId);

    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }

    if (event.organizerId !== payload.userId) {
      return res.status(403).json(errorResponse('Forbidden: You are not the organizer of this event.'));
    }

    // Unjoin semua peserta aktif
    const unjoinedCount = await unjoinAllParticipantsByEventId(eventId);

    // Hitung ulang total peserta aktif (harusnya 0)
    const totalParticipants = await countEventParticipants(eventId);

    // Update status event menjadi COMPLETED dan totalParticipants
    await updateEventRepo(eventId, { status: 'COMPLETED', totalParticipants });

    emitEventUpdate(eventId, {
      ...event,
      status: 'COMPLETED',
      totalParticipants,
      description: event.description ?? undefined,
      maxParticipants: event.maxParticipants ?? undefined,
    });

    res.json(baseResponse({ success: true, message: `Event '${event.name}' marked as completed. ${unjoinedCount} participants unjoined. Total participants: ${totalParticipants}` }));
  } catch (err) {
    console.error('Finish event error:', err);
    res.status(500).json(errorResponse(err));
  }
};