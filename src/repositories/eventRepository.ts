/**
 * @file eventRepository.ts
 * @module repositories/eventRepository
 * @author eventFlow Team
 * @description Repository for querying, creating, updating, and deleting events in the database.
 * @created 2025-11-10
 * @lastModified 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Prisma
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
