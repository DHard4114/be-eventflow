/**
 * @file eventParticipant.ts
 * @module types/eventParticipant
 * @author eventFlow Team
 * @description Type definitions for EventParticipant entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface EventParticipant {
  userId: string;
  eventId: string;
  joinedAt: Date;
  nodeColor?: string;
  attendanceStatus?: string;
}
