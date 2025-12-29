
/**
 * @file prisma.ts
 * @module config/prisma
 * @author eventFlow Team
 * @description Prisma Client configuration and initialization for PostgreSQL database connection.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Prisma
 */
import { PrismaClient } from '@prisma/client';

export type {
  Prisma,
  UserNotification,
  Device,
  EventParticipant,
  Event,
  Notification,
  NotificationType,
  ParticipantLocation,
  Poll,
  PollOption,
  PollVote,
  Report,
  User,
  VirtualArea,
  ChatMessage,
  ChatMessageDelete,
  ReportAIResult,
  ImportantSpot,
  SpotType
} from '@prisma/client';

export const prisma = new PrismaClient();


