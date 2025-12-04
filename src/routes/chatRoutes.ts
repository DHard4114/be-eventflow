/**
 * File: chatRoutes.ts
 * Author: eventFlow Team
 * Deskripsi: Routing endpoint chat event (group chat, dsb) dengan dokumentasi Swagger.
 * Dibuat: 2025-11-11
 * Versi: 1.0.0
 * Lisensi: MIT
 */
import { Router } from 'express';
import {
  sendGroupChat,
  getGroupChat,
  updateGroupChat,
  deleteGroupChat,
  deleteGroupChatForUser,
} from '../controllers/chatController';

const router = Router();

/**
 * @swagger
 * /chats/{eventId}:
 *   post:
 *     summary: Kirim pesan chat grup event
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Halo semua!"
 *     responses:
 *       200:
 *         description: Pesan berhasil dikirim
 *     security:
 *       - bearerAuth: []
 */
router.post('/:eventId', sendGroupChat);

/**
 * @swagger
 * /chats/{eventId}:
 *   get:
 *     summary: Ambil semua pesan chat grup event
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *     responses:
 *       200:
 *         description: List pesan chat
 */
router.get('/:eventId', getGroupChat);

/**
 * @swagger
 * /chats/{chatId}:
 *   patch:
 *     summary: Edit pesan chat (hanya pemilik pesan)
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pesan chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Pesan baru"
 *     responses:
 *       200:
 *         description: Pesan berhasil diupdate
 *       403:
 *         description: Forbidden
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:chatId', updateGroupChat);

/**
 * @swagger
 * /chats/{chatId}:
 *   delete:
 *     summary: Hapus pesan chat secara permanen (admin/panitia)
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pesan chat
 *     responses:
 *       200:
 *         description: Pesan berhasil dihapus
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:chatId', deleteGroupChat);

/**
 * @swagger
 * /chats/{chatId}/me:
 *   delete:
 *     summary: Hapus pesan chat hanya untuk diri sendiri (soft delete)
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pesan chat
 *     responses:
 *       200:
 *         description: Pesan dihapus untuk user
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:chatId/me', deleteGroupChatForUser);

export default router;
