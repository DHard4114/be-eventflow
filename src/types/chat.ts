/**
 * @file chat.ts
 * @module types/chat
 * @author eventFlow Team
 * @description Type definitions for ChatMessage entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
import { User } from './user';

export interface ChatMessage {
  id: string;
  eventId: string;
  user: User;
  message: string;
  createdAt: Date;
  virtualAreaId?: string;
}
