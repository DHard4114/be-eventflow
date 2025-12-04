"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * File: chatRoutes.ts
 * Author: eventFlow Team
 * Deskripsi: Routing endpoint chat event (group chat, dsb) dengan dokumentasi Swagger.
 * Dibuat: 2025-11-11
 * Versi: 1.0.0
 * Lisensi: MIT
 */
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const router = (0, express_1.Router)();
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
router.post('/:eventId', chatController_1.sendGroupChat);
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
router.get('/:eventId', chatController_1.getGroupChat);
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
router.patch('/:chatId', chatController_1.updateGroupChat);
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
router.delete('/:chatId', chatController_1.deleteGroupChat);
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
router.delete('/:chatId/me', chatController_1.deleteGroupChatForUser);
exports.default = router;
