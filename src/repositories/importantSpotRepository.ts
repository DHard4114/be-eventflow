
/**
 * @file importantSpotRepository.ts
 * @module repositories/importantSpotRepository
 * @author eventFlow Team
 * @description Repository for accessing ImportantSpot data (event important points). Features: CRUD important spots, filter by event, update, delete.
 * @created 2025-11-10
 * @lastModified 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Prisma, ../config/prisma
 */
import { prisma, ImportantSpot, SpotType } from '../config/prisma';

export class ImportantSpotRepository {
  async createSpot(data: {
    eventId: string;
    name: string;
    latitude: number;
    longitude: number;
    type: SpotType;
    customType?: string;
  }): Promise<ImportantSpot> {
    return prisma.importantSpot.create({ data });
  }

  async getSpotsByEvent(eventId: string): Promise<ImportantSpot[]> {
    return prisma.importantSpot.findMany({
      where: { eventId },
      orderBy: { name: 'asc' },
    });
  }

  async getSpotById(id: string): Promise<ImportantSpot | null> {
    return prisma.importantSpot.findUnique({ where: { id } });
  }

  async updateSpot(id: string, data: Partial<Omit<ImportantSpot, 'id' | 'eventId'>>): Promise<ImportantSpot> {
    return prisma.importantSpot.update({
      where: { id },
      data,
    });
  }

  async deleteSpot(id: string): Promise<ImportantSpot> {
    return prisma.importantSpot.delete({ where: { id } });
  }
}
