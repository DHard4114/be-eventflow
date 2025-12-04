/**
 * File: locationController.ts
 * Author: eventFlow Team
 * Deskripsi: Mengelola endpoint update lokasi peserta event, pengambilan lokasi user, dan list lokasi peserta.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Express, Prisma, JWT
*/
import { Request, Response } from 'express';
import {
  upsertParticipantLocation,
  listParticipantLocations,
  findParticipantLocation,
} from '../repositories/participantLocationRepository';
import { listVirtualAreas } from '../repositories/virtualAreaRepository';
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
    // 1. Ambil semua area virtual event
    const areas = await listVirtualAreas(eventId);
    // 2. Cek apakah lokasi user di dalam area
    const isInside = areas.some(area => {
      try {
        return isLocationInsideGeofence({ latitude, longitude }, JSON.parse(area.area).coordinates);
      } catch {
        return false;
      }
    });
    const status = isInside ? 'INSIDE' : 'OUTSIDE';

    // 3. Ambil status sebelumnya
    const prevLocation = await findParticipantLocation(payload.userId, eventId);
    const prevStatus = prevLocation?.lastGeofenceStatus;

    // 4. Jika keluar zona, trigger alert
    if (prevStatus === 'INSIDE' && status === 'OUTSIDE') {
      emitGeofenceEvent(eventId, {
        userId: payload.userId,
        status: 'outside', // sesuai tipe GeofencePayload
        timestamp: new Date(),
      });
      // TODO: Buat notifikasi SECURITY_ALERT ke organizer di sini jika ada sistem notifikasi
    }

    // 5. Simpan lokasi dan status baru
    const location = await upsertParticipantLocation(
      payload.userId,
      eventId,
      latitude,
      longitude,
      status // <-- simpan status baru
    );

    // Map ParticipantLocation to EventParticipant for socket emit
    const locationPayload = {
      userId: payload.userId,
      eventId,
      joinedAt: new Date(),
      nodeColor: undefined,
      attendanceStatus: undefined,
    };
    emitLocationUpdate(eventId, locationPayload);
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
