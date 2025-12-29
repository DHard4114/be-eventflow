/**
 * @file socket.ts
 * @module types/socket
 * @author eventFlow Team
 * @description Type definitions for socket-related events and payloads.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface EventFullNotification {
  type: 'EVENT_FULL';
  eventId: string;
  message: string;
}
