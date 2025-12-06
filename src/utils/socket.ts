/**
 * File: socket.ts
 * Author: eventFlow Team
 * Deskripsi: Utility untuk inisialisasi dan manajemen koneksi socket.io pada aplikasi eventFlow.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-11
 * Versi: 1.1.1
 * Lisensi: MIT
 * Dependensi: Socket.io
 */
import { Server as SocketIOServer } from 'socket.io';
import { EventFullNotification } from '../types/socket';
import { Event } from '../types/event';
import { User } from '../types/user';
import { EventParticipant } from '../types/eventParticipant';
import { Notification } from '../types/notification';

// Strict types for socket payloads
export interface GeofencePayload {
  userId: string;
  status: 'inside' | 'outside';
  timestamp: Date;
}

export interface LocationUpdatePayload {
  userId: string;
  eventId: string;
  latitude: number;
  longitude: number;
  geofenceStatus: 'INSIDE' | 'OUTSIDE';
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
  userVoted?: boolean;
}

export interface VotingPayload {
  pollId: string;
  options: PollOption[];
  totalVotes: number;
  userVoted?: string | null;
  userId?: string;
}

export interface PollCreatedPayload {
  pollId: string;
  question: string;
  options: PollOption[];
  eventId: string;
  createdAt: Date;
}

export interface PollDeletedPayload {
  pollId: string;
  eventId: string;
}

export interface LiveReportPayload {
  reportId: string;
  userId: string;
  message: string;
  mediaUrl?: string;
  createdAt: Date;
}

let io: SocketIOServer | null = null;

export const setSocketInstance = (instance: SocketIOServer) => {
  io = instance;
};

export const getSocketInstance = (): SocketIOServer => {
  if (!io) throw new Error('Socket.io instance not set');
  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

// Emit broadcast notification to all clients
/**
 * Emit broadcast notification to all clients
 * @param payload EventFullNotification | Notification
 */
export const emitNotification = (payload: EventFullNotification | Notification) => {
  if (!io) return;
  io.emit('notification', payload);
};

/**
 * Emit update lokasi peserta ke semua client di event tertentu
 * @param eventId ID event
 * @param locationPayload Data lokasi peserta dengan koordinat dan status
 */
export const emitLocationUpdate = (eventId: string, locationPayload: LocationUpdatePayload) => {
  if (!io) return;
  io.to(eventId).emit('locationUpdate', locationPayload);
};

/**
 * Emit status absensi peserta secara real-time
 * @param eventId ID event
 * @param absensiPayload Data absensi peserta
 */
export const emitAbsensiUpdate = (eventId: string, absensiPayload: EventParticipant) => {
  if (!io) return;
  io.to(eventId).emit('absensiUpdate', absensiPayload);
};

/**
 * Emit deteksi masuk/keluar area virtual (geofence)
 * @param eventId ID event
 * @param geofencePayload Data geofence (masuk/keluar area)
 */
export const emitGeofenceEvent = (eventId: string, geofencePayload: GeofencePayload) => {
  if (!io) return;
  io.to(eventId).emit('geofenceEvent', geofencePayload);
};

/**
 * Emit perubahan data event (jadwal, detail, dsb) ke semua client
 * @param eventId ID event
 * @param eventPayload Data perubahan event
 */
export const emitEventUpdate = (eventId: string, eventPayload: Event) => {
  if (!io) return;
  io.to(eventId).emit('eventUpdate', eventPayload);
};

/**
 * Emit update hasil voting/polling ke semua peserta event
 * @param eventId ID event
 * @param votingPayload Data hasil voting/polling
 */
export const emitVotingUpdate = (eventId: string, votingPayload: VotingPayload) => {
  if (!io) return;
  io.to(eventId).emit('votingUpdate', votingPayload);
};

/**
 * Emit pembuatan poll baru ke semua peserta event
 * @param eventId ID event
 * @param pollPayload Data poll yang dibuat
 */
export const emitPollCreated = (eventId: string, pollPayload: PollCreatedPayload) => {
  if (!io) return;
  io.to(eventId).emit('pollCreated', pollPayload);
};

/**
 * Emit penghapusan poll ke semua peserta event
 * @param eventId ID event
 * @param pollPayload Data poll yang dihapus
 */
export const emitPollDeleted = (eventId: string, pollPayload: PollDeletedPayload) => {
  if (!io) return;
  io.to(eventId).emit('pollDeleted', pollPayload);
};

// Emit chat message ke semua client di event tertentu
export const emitChatMessage = (eventId: string, chatPayload: { user: User; message: string; createdAt: Date }) => {
  if (!io) return;
  io.to(eventId).emit('chatMessage', chatPayload);
};

// Emit live report (laporan kejadian/media) ke admin/panitia event
export const emitLiveReport = (eventId: string, reportPayload: LiveReportPayload) => {
  if (!io) return;
  io.to(eventId).emit('liveReport', reportPayload);
};

// Emit broadcast info/pengumuman ke semua client di event tertentu
export const emitEventBroadcast = (eventId: string, infoPayload: Notification) => {
  if (!io) return;
  io.to(eventId).emit('eventBroadcast', infoPayload);
};

// Socket event connection handling
export const initializeSocketHandlers = () => {
  if (!io) return;

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join event room for real-time updates
    socket.on('join_event', (eventId: string) => {
      socket.join(eventId);
      console.log(`User ${socket.id} joined event room: ${eventId}`);
    });

    // Leave event room
    socket.on('leave_event', (eventId: string) => {
      socket.leave(eventId);
      console.log(`User ${socket.id} left event room: ${eventId}`);
    });

    // Join poll room for specific poll updates
    socket.on('join_poll', (pollId: string) => {
      socket.join(`poll_${pollId}`);
      console.log(`User ${socket.id} joined poll room: ${pollId}`);
    });

    // Leave poll room
    socket.on('leave_poll', (pollId: string) => {
      socket.leave(`poll_${pollId}`);
      console.log(`User ${socket.id} left poll room: ${pollId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

export const SOCKET_EVENTS = {
  LOCATION_UPDATED: 'locationUpdate',
  ABSENSI_UPDATED: 'absensiUpdate',
  GEOFENCE_EVENT: 'geofenceEvent',
  EVENT_UPDATED: 'eventUpdate',
  VOTE_UPDATED: 'votingUpdate',
  POLL_CREATED: 'pollCreated',
  POLL_DELETED: 'pollDeleted',
  CHAT_MESSAGE: 'chatMessage',
  LIVE_REPORT: 'liveReport',
  EVENT_BROADCAST: 'eventBroadcast',
  NOTIFICATION: 'notification',
} as const;