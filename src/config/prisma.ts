/**
 * File: prisma.ts
 * Author: eventFlow Team
 * Deskripsi: Konfigurasi dan inisialisasi Prisma Client untuk koneksi database PostgreSQL.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Prisma
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


