"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertParticipantLocation = exports.listParticipantLocations = exports.findParticipantLocation = void 0;
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
const prisma_1 = require("../config/prisma");
const findParticipantLocation = async (userId, eventId) => {
    return prisma_1.prisma.participantLocation.findUnique({
        where: { userId_eventId: { userId, eventId } },
    });
};
exports.findParticipantLocation = findParticipantLocation;
const listParticipantLocations = async (eventId) => {
    return prisma_1.prisma.participantLocation.findMany({ where: { eventId } });
};
exports.listParticipantLocations = listParticipantLocations;
const upsertParticipantLocation = async (userId, eventId, latitude, longitude, lastGeofenceStatus) => {
    return prisma_1.prisma.participantLocation.upsert({
        where: { userId_eventId: { userId, eventId } },
        update: { latitude, longitude, lastUpdatedAt: new Date(), lastGeofenceStatus },
        create: { userId, eventId, latitude, longitude, lastGeofenceStatus },
    });
};
exports.upsertParticipantLocation = upsertParticipantLocation;
