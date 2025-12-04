"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.isEventOrganizer = exports.createEvent = exports.listEvents = exports.findEventById = void 0;
/**
 * File: eventRepository.ts
 * Author: eventFlow Team
 * Deskripsi: Repository untuk query, pembuatan, update, dan penghapusan event di database.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Prisma
 */
const prisma_1 = require("../config/prisma");
const findEventById = async (id) => {
    return prisma_1.prisma.event.findUnique({ where: { id } });
};
exports.findEventById = findEventById;
const listEvents = async () => {
    return prisma_1.prisma.event.findMany();
};
exports.listEvents = listEvents;
const createEvent = async (data) => {
    return prisma_1.prisma.event.create({ data });
};
exports.createEvent = createEvent;
const isEventOrganizer = async (eventId, userId) => {
    const event = await prisma_1.prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true }
    });
    return event?.organizerId === userId;
};
exports.isEventOrganizer = isEventOrganizer;
const updateEvent = async (id, data) => {
    return prisma_1.prisma.event.update({ where: { id }, data });
};
exports.updateEvent = updateEvent;
const deleteEvent = async (id) => {
    return prisma_1.prisma.event.delete({ where: { id } });
};
exports.deleteEvent = deleteEvent;
