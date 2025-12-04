
/**
 * Repository untuk akses data ImportantSpot (titik penting event)
 * Fitur: CRUD spot penting, filter by event, update, delete
 * Model: ImportantSpot, SpotType
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
