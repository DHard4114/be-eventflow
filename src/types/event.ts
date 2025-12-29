/**
 * @file event.ts
 * @module types/event
 * @author eventFlow Team
 * @description Type definitions for Event entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface Event {
  id: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  locationName: string;
  latitude: number;
  longitude: number;
  status: string;
  joinCode: string;
  organizerId: string;
  totalParticipants: number;
  maxParticipants?: number;
  createdAt: Date;
  updatedAt: Date;
}
