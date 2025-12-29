/**
 * @file locationController.ts
 * @module controllers/locationController
 * @author eventFlow Team
 * @description Handles endpoints for updating event participant location, retrieving user location, and listing participant locations.
 * @created 2025-11-10
 * @lastModified 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, Prisma, JWT, ../repositories/participantLocationRepository, ../repositories/virtualAreaRepository, ../repositories/eventParticipantRepository, ../repositories/eventRepository, ../repositories/userRepository, ../utils/geo, ../utils/socket, ../utils/baseResponse, ../types/jwtPayload, ../utils/jwt
 */
import { Request, Response } from 'express';
import {
  upsertParticipantLocation,
  listParticipantLocations,
  findParticipantLocation,
} from '../repositories/participantLocationRepository';
import { listVirtualAreas } from '../repositories/virtualAreaRepository';
import { updateAttendanceStatus } from '../repositories/eventParticipantRepository';
import { findEventById } from '../repositories/eventRepository';
import { findUserById } from '../repositories/userRepository';
import { isLocationInsideGeofence } from '../utils/geo';
import { emitLocationUpdate, emitGeofenceEvent } from '../utils/socket';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import { JWTPayload } from '../types/jwtPayload';
import { verifyJwt } from '../utils/jwt';
// import { emitNotification } from '../utils/socket';

// Update participant location (POST /events/:eventId/location)
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { eventId } = req.params;
    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json(errorResponse('Invalid coordinates'));
    }
    // --- Geofence Logic ---
    // 1. Get all virtual areas for the event
    const areas = await listVirtualAreas(eventId);
    // 2. Check if user location is inside any area
    const isInside = areas.some(area => {
      try {
        return isLocationInsideGeofence({ latitude, longitude }, JSON.parse(area.area).coordinates);
      } catch {
        return false;
      }
    });
    const status = isInside ? 'INSIDE' : 'OUTSIDE';

    // 3. Get previous geofence status
    const prevLocation = await findParticipantLocation(payload.userId, eventId);
    const prevStatus = prevLocation?.lastGeofenceStatus;

    // 4. Auto Check-in Logic: If entering zone while event is ongoing
    // Trigger: transition from OUTSIDE to INSIDE, or first time, or fallback if still INSIDE
    const shouldCheckIn = 
      (prevStatus === 'OUTSIDE' && status === 'INSIDE') ||
      (!prevStatus && status === 'INSIDE') ||
      (status === 'INSIDE');
    
    if (shouldCheckIn) {
      const event = await findEventById(eventId);
      if (event) {
        const now = new Date();
        const isEventOngoing = now >= event.startTime && now <= event.endTime && event.status === 'ONGOING';
        if (isEventOngoing) {
          // Check if still PENDING (not checked-in)
          const { findActiveEventParticipant } = await import('../repositories/eventParticipantRepository');
          const participant = await findActiveEventParticipant(payload.userId, eventId);
          if (participant && participant.attendanceStatus === 'PENDING') {
            // Auto check-in: update attendance status to PRESENT
            await updateAttendanceStatus(
              payload.userId,
              eventId,
              'PRESENT',
              now
            );
            console.log(`[Auto Check-in] User ${payload.userId} marked PRESENT in event ${eventId}`);
          }
        }
      }
    }

    // 5. If user leaves the zone, trigger alert
    if (prevStatus === 'INSIDE' && status === 'OUTSIDE') {
      emitGeofenceEvent(eventId, {
        userId: payload.userId,
        status: 'outside',
        timestamp: new Date(),
      });
      // TODO: Create SECURITY_ALERT notification to organizer here if notification system exists
    }

    // 6. Save new location and status
    const location = await upsertParticipantLocation(
      payload.userId,
      eventId,
      latitude,
      longitude,
      status
    );

    // Get user info for socket payload
    const user = await findUserById(payload.userId);

    // Emit location update with complete data
    emitLocationUpdate(eventId, {
      userId: payload.userId,
      eventId,
      latitude,
      longitude,
      geofenceStatus: status,
      updatedAt: new Date(),
      user: user ? {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl || undefined
      } : undefined
    });

    res.json(baseResponse({ success: true, data: { location, geofenceStatus: status } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Get all participant locations for an event (GET /events/:eventId/locations)
export const getEventLocations = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const locations = await listParticipantLocations(eventId);
    res.json(baseResponse({ success: true, data: locations }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Get location for current user in event (GET /events/:eventId/location/me)
export const getMyLocation = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { eventId } = req.params;
    const location = await findParticipantLocation(payload.userId, eventId);
    res.json(baseResponse({ success: true, data: location }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
