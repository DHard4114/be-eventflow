/**
 * File: eventParticipantRepository.ts
 * Author: eventFlow Team
 * Deskripsi: Repository untuk query dan update data partisipan event di database.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Prisma
*/
import { prisma, EventParticipant } from '../config/prisma';

// Cek apakah user adalah peserta aktif event
export const isEventParticipant = async (eventId: string, userId: string): Promise<boolean> => {
  const participant = await prisma.eventParticipant.findFirst({
    where: { eventId, userId, isActive: true },
  });
  return !!participant;
};

// Cari record aktif (isActive = true) untuk user dan event
export const findActiveEventParticipant = async (
  userId: string,
  eventId: string,
): Promise<EventParticipant | null> => {
  return prisma.eventParticipant.findFirst({
    where: { userId, eventId, isActive: true },
  });
};

// List peserta aktif pada event
export const listEventParticipants = async (
  eventId: string,
): Promise<EventParticipant[]> => {
  return prisma.eventParticipant.findMany({
    where: { eventId, isActive: true },
    include: { user: true } });
};

// List history partisipasi user pada event (termasuk yang sudah unjoin)
export const listEventParticipantHistory = async (
  userId: string,
  eventId: string
): Promise<EventParticipant[]> => {
  return prisma.eventParticipant.findMany({
    where: { userId, eventId },
    orderBy: { joinedAt: 'asc' }
  });
};

// Unjoin semua peserta aktif pada event (auto-unjoin saat event selesai)
export const unjoinAllParticipantsByEventId = async (
  eventId: string
): Promise<number> => {
  const result = await prisma.eventParticipant.updateMany({
    where: { eventId, isActive: true },
    data: { isActive: false, leftAt: new Date() },
  });
  return result.count;
};

// Join or reactivate participant (single-record logic)
export const joinOrReactivateEventParticipant = async (
  userId: string,
  eventId: string,
): Promise<EventParticipant> => {
  const existing = await prisma.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (existing) {
    // Reactivate and reset leftAt
    return prisma.eventParticipant.update({
      where: { userId_eventId: { userId, eventId } },
      data: { isActive: true, joinedAt: new Date(), leftAt: null },
    });
  } else {
    // Create new single record
    return prisma.eventParticipant.create({
      data: { userId, eventId, isActive: true, joinedAt: new Date(), leftAt: null },
    });
  }
};

// Unjoin participant (single-record logic)
export const unjoinEventParticipant = async (
  userId: string,
  eventId: string,
): Promise<EventParticipant | null> => {
  const existing = await prisma.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (!existing) return null;
  return prisma.eventParticipant.update({
    where: { userId_eventId: { userId, eventId } },
    data: { isActive: false, leftAt: new Date() },
  });
};


// Hapus record by id (jika memang perlu hapus fisik)
export const deleteEventParticipant = async (
  id: string,
): Promise<EventParticipant> => {
  return prisma.eventParticipant.delete({
    where: { id },
  });
};

// Hitung total peserta aktif event
export const countEventParticipants = async (eventId: string): Promise<number> => {
  return prisma.eventParticipant.count({ where: { eventId, isActive: true } });
};

// Update attendance status participant (untuk auto check-in)
export const updateAttendanceStatus = async (
  userId: string,
  eventId: string,
  status: 'PENDING' | 'PRESENT' | 'ABSENT',
  checkInTime?: Date
): Promise<EventParticipant | null> => {
  const existing = await prisma.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (!existing) return null;

  return prisma.eventParticipant.update({
    where: { userId_eventId: { userId, eventId } },
    data: {
      attendanceStatus: status,
      ...(checkInTime && { checkInTime }),
    },
  });
};

// Get attendance statistics untuk event
export const getAttendanceStats = async (eventId: string) => {
  const participants = await prisma.eventParticipant.findMany({
    where: { eventId, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  const total = participants.length;
  const present = participants.filter(p => p.attendanceStatus === 'PRESENT').length;
  const absent = participants.filter(p => p.attendanceStatus === 'ABSENT').length;
  const pending = participants.filter(p => p.attendanceStatus === 'PENDING').length;

  return {
    totalParticipants: total,
    present,
    absent,
    pending,
    attendanceRate: total > 0 ? ((present / total) * 100).toFixed(2) : '0.00',
    participants: participants.map(p => ({
      id: p.id,
      user: p.user,
      attendanceStatus: p.attendanceStatus,
      checkInTime: p.checkInTime,
      joinedAt: p.joinedAt,
    })),
  };
};

// Mark semua pending participants jadi absent (untuk cronjob)
export const markPendingAsAbsent = async (eventId: string): Promise<number> => {
  const result = await prisma.eventParticipant.updateMany({
    where: {
      eventId,
      attendanceStatus: 'PENDING',
      isActive: true,
    },
    data: {
      attendanceStatus: 'ABSENT',
    },
  });
  return result.count;
};