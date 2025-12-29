/**
 * @file eventController.ts
 * @module controllers/eventController
 * @author eventFlow Team
 * @description Handles event CRUD endpoints, event details, and event participation/join endpoints.
 * @created 2025-11-10
 * @lastModified 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, Prisma, JWT, ../repositories/eventRepository, ../repositories/eventParticipantRepository, ../utils/baseResponse, ../types/jwtPayload, ../utils/jwt, ../utils/generateJoinCode, ../utils/socket, ../types/event, ../types/eventParticipant
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
      joinCode, // Generated join code for event
      organizer: { connect: { id: payload.userId } },
    });
    // Organizer is automatically added as a participant (single-record logic)
    await joinOrReactivateEventParticipant(payload.userId, prismaEvent.id);
    // Update totalParticipants in Event after counting
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

    // If event status is changed to ONGOING/UPCOMING, organizer is automatically reactivated as participant
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
 * Update participant attendance status and emit presence to all event clients.
 * Example endpoint: POST /events/:id/absensi
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
      return res.status(400).json(errorResponse('Attendance status is required'));
    // Save attendance status in EventParticipant (repository implementation required)
    // Emit to all event clients
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
    // Auth & Input Validation
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }
    const { id } = req.params;
    const { joinCode } = req.body;
    
    // Event Validation
    const event = await findEventById(id);
    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }
    if (event.joinCode !== joinCode) {
      return res.status(400).json(errorResponse('Invalid join code'));
    }
    
    // Participant Count Validation
    const { listEventParticipants } = await import(
      '../repositories/eventParticipantRepository'
    );
    const participantList = await listEventParticipants(id);
    const participantCount = participantList.length;
    if (event.maxParticipants && participantCount >= event.maxParticipants) {
      // Emit real-time notification to all clients if event is full
      emitNotification({
        type: 'EVENT_FULL',
        eventId: id,
        message: 'Event is full, no more participants can join.',
      });
      return res.status(400).json(errorResponse('Event is full'));
    }
    
    // Create or reactivate participant (single-record logic)
    await joinOrReactivateEventParticipant(payload.userId, id);
    // Update totalParticipants in Event after counting
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
 * Finish event: automatically unjoin all participants and update event status.
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

    // Unjoin all active participants
    const unjoinedCount = await unjoinAllParticipantsByEventId(eventId);

    // Recount total active participants (should be 0)
    const totalParticipants = await countEventParticipants(eventId);

    // Update event status to COMPLETED and totalParticipants
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