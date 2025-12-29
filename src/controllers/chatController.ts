
/**
 * @file chatController.ts
 * @module controllers/chatController
 * @author eventFlow Team
 * @description Handles event chat endpoints (group chat, DM, committee chat) and emits real-time messages via Socket.io.
 * @created 2025-11-11
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, Prisma, JWT, Socket.io
 */
import { Request, Response } from 'express';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import { JWTPayload } from '../types/jwtPayload';
import { verifyJwt } from '../utils/jwt';
import { emitChatMessage } from '../utils/socket';
import { ChatMessage } from '../types/chat';
import {
  createChatMessage,
  listChatMessages,
  listChatMessagesForUser,
  getChatMessageById,
  updateChatMessage,
  deleteChatMessage,
  deleteChatMessageForUser,
} from '../repositories/chatRepository';

// Kirim pesan chat grup event
export const sendGroupChat = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { eventId } = req.params;
    const { message } = req.body;
    if (!message)
      return res.status(400).json(errorResponse('Pesan kosong'));
    const chat: ChatMessage = {
      id: '', // assign real id if available
      eventId,
      user: {
        id: payload.userId,
        email: '',
        name: '',
        role: 'PARTICIPANT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message,
      createdAt: new Date(),
      virtualAreaId: undefined,
    };
    const savedChat = await createChatMessage({
      eventId,
      userId: payload.userId,
      message,
    });
    chat.id = savedChat.id;
    chat.createdAt = savedChat.createdAt;
    emitChatMessage(eventId, chat);
    res.json(baseResponse({ success: true, data: chat }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Update pesan chat (edit pesan)
export const updateGroupChat = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = token ? (verifyJwt(token) as JWTPayload) : null;
  try {
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { chatId } = req.params;
    const { message } = req.body;
    if (!message)
      return res.status(400).json(errorResponse('Pesan kosong'));
    const chat = await getChatMessageById(chatId);
    if (!chat || chat.userId !== payload.userId)
      return res.status(403).json(errorResponse('Forbidden'));
    const updated = await updateChatMessage(chatId, { message });
    res.json(baseResponse({ success: true, data: updated }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Hapus pesan chat secara permanen (admin/panitia)
export const deleteGroupChat = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = token ? (verifyJwt(token) as JWTPayload) : null;
  try {
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    const { chatId } = req.params;
    // TODO: Validasi role admin/panitia jika diperlukan
    await deleteChatMessage(chatId);
    res.json(baseResponse({ success: true }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Hapus pesan hanya untuk diri sendiri (soft delete)
export const deleteGroupChatForUser = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = token ? (verifyJwt(token) as JWTPayload) : null;
  try {
    if (!payload) return res.status(401).json(errorResponse('Unauthorized'));
    const { chatId } = req.params;
    await deleteChatMessageForUser(chatId, payload.userId);
    res.json(baseResponse({ success: true }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Ambil semua pesan chat grup event
export const getGroupChat = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    const { eventId } = req.params;
    const chats = payload
      ? await listChatMessagesForUser(eventId, payload.userId)
      : await listChatMessages(eventId);
    res.json(baseResponse({ success: true, data: chats }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
