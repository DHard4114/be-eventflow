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
import { prisma, Prisma, Event } from '../config/prisma';

export const findEventById = async (id: string): Promise<Event | null> => {
  return prisma.event.findUnique({ where: { id } });
};

export const listEvents = async (): Promise<Event[]> => {
  return prisma.event.findMany();
};

export const createEvent = async (data: Prisma.EventCreateInput): Promise<Event> => {
  return prisma.event.create({ data });
};

export const isEventOrganizer = async (eventId: string, userId: string): Promise<boolean> => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true }
  });
  return event?.organizerId === userId;
};

export const updateEvent = async (id: string, data: Prisma.EventUpdateInput): Promise<Event> => {
  return prisma.event.update({ where: { id }, data });
};
export const deleteEvent = async (id: string): Promise<Event> => {
  return prisma.event.delete({ where: { id } });
};
