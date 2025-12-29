/**
 * @file participantLocationRepository.ts
 * @module repositories/participantLocationRepository
 * @author eventFlow Team
 * @description Repository for querying and updating event participant locations in the database.
 * @created 2025-11-10
 * @lastModified 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Prisma, ../config/prisma
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
