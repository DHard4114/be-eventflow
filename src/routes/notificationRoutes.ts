
/**
 * @file Notification Routes
 * @author eventFlow Team
 * @description Endpoint untuk notifikasi event dan user
 */

import { Router } from 'express';
import { requireAuth } from '../utils/requireAuth';
import { requireRole } from '../middleware/requireRole';
import {
  createBroadcast,
  getEventNotifications,
  sendCustomNotification
} from '../controllers/notificationController';

const router = Router();

/**
 * @swagger
 * /notifications/custom/{eventId}:
 *   post:
 *     summary: Kirim notifikasi custom dari organizer ke participant event
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
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
 *               participantId:
 *                 type: string
 *                 description: ID participant event
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [GENERAL, EVENT_UPDATE, SECURITY_ALERT]
 *                 description: Label/kategori notifikasi (badge)
 *               deliveryMethod:
 *                 type: string
 *                 enum: [INDIVIDUAL, BROADCAST]
 *                 description: Metode pengiriman notifikasi
 *     responses:
 *       200:
 *         description: Notifikasi berhasil dikirim ke participant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Participant not found
 */
router.post('/custom/:eventId', requireAuth, requireRole(['ORGANIZER']),sendCustomNotification);

/**
 * @swagger
 * /notifications/broadcast:
 *   post:
 *     summary: Broadcast notifikasi ke event
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - title
 *             properties:
 *               eventId:
 *                 type: string
 *               message:
 *                 type: string
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [GENERAL, EVENT_UPDATE, SECURITY_ALERT]
 *                 description: Label/kategori notifikasi (badge)
 *     responses:
 *       200:
 *         description: Notifikasi berhasil dibroadcast
 *       400:
 *         description: Data tidak lengkap
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/broadcast',
  requireAuth,
  requireRole(['ORGANIZER']),
  createBroadcast,
);


/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Ambil semua notifikasi pada suatu event tertentu
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *     responses:
 *       200:
 *         description: List notifikasi user
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', requireAuth, getEventNotifications);


export default router;
