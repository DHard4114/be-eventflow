/**
 * File: participantLocationRepository.ts
 * Author: eventFlow Team
 * Deskripsi: Repository untuk query dan update lokasi peserta event di database.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Prisma
 */
import { prisma, ParticipantLocation } from '../config/prisma';

export const findParticipantLocation = async (
  userId: string,
  eventId: string,
): Promise<ParticipantLocation | null> => {
  return prisma.participantLocation.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
};


export const listParticipantLocations = async (
  eventId: string,
): Promise<ParticipantLocation[]> => {
  return prisma.participantLocation.findMany({ where: { eventId } });
};


export const upsertParticipantLocation = async (
  userId: string,
  eventId: string,
  latitude: number,
  longitude: number,
  lastGeofenceStatus?: string
): Promise<ParticipantLocation> => {
  return prisma.participantLocation.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: { latitude, longitude, lastUpdatedAt: new Date(), lastGeofenceStatus },
    create: { userId, eventId, latitude, longitude, lastGeofenceStatus },
  });
};
