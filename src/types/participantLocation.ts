/**
 * @file participantLocation.ts
 * @module types/participantLocation
 * @author eventFlow Team
 * @description Type definitions for ParticipantLocation entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface ParticipantLocation {
  latitude: number;
  lastUpdatedAt: Date;
  longitude: number;
  userId: string;
  eventId: string;
}
