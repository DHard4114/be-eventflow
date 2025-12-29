/**
 * @file notification.ts
 * @module types/notification
 * @author eventFlow Team
 * @description Type definitions for Notification entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  eventId?: string;
  category?: string;
  createdAt: Date;
}
