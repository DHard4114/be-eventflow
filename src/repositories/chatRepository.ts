
/**
 * @file chatRepository.ts
 * @module repositories/chatRepository
 * @author eventFlow Team
 * @description Repository for ChatMessage database operations (group chat event, DM, etc.).
 * @created 2025-11-11
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Prisma
 */
import { prisma } from '../config/prisma';

export const createChatMessage = async (data: {
  eventId: string;
  userId: string;
  message: string;
}) => {
  return prisma.chatMessage.create({ data });
};

export const listChatMessages = async (eventId: string) => {
  return prisma.chatMessage.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
  });
};

// Overload: listChatMessages with userId to exclude deleted messages
export const listChatMessagesForUser = async (eventId: string, userId: string) => {
  const deleted = await prisma.chatMessageDelete.findMany({
    where: { userId },
    select: { chatMessageId: true }
  });
  const excludeIds = deleted.map(d => d.chatMessageId);
  return prisma.chatMessage.findMany({
    where: {
      eventId,
      NOT: { id: { in: excludeIds } }
    },
    orderBy: { createdAt: 'asc' }
  });
};

// Ambil pesan chat by id
export const getChatMessageById = async (id: string) => {
  return prisma.chatMessage.findUnique({ where: { id } });
};

// Update pesan chat (edit pesan)
export const updateChatMessage = async (
  id: string,
  data: { message?: string },
) => {
  return prisma.chatMessage.update({ where: { id }, data });
};

// Hapus pesan chat secara permanen (admin/panitia)
export const deleteChatMessage = async (id: string) => {
  return prisma.chatMessage.delete({ where: { id } });
};

// Hapus pesan hanya untuk diri sendiri (soft delete)
// Implementasi: Insert ke tabel ChatMessageDelete
export const deleteChatMessageForUser = async (chatMessageId: string, userId: string) => {
  return prisma.chatMessageDelete.create({
    data: { chatMessageId, userId }
  });
};
