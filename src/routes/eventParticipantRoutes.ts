
/**
 * @file eventParticipantRoutes.ts
 * @author eventFlow Team
 * @description Endpoint khusus untuk EventParticipant CRUD dan query
 */
import { Router } from 'express';

import {
  getEventParticipant,
  listParticipants,
  addParticipant,
  unjoinParticipant,
  removeParticipant,
  countParticipants,
  getEventParticipantHistory
} from '../controllers/eventParticipantController';
import { requireAuth } from '../utils/requireAuth';

const router = Router();

/**
 * @swagger
 * /event-participants/{eventId}/{userId}/history:
 *   get:
 *     summary: Get history partisipasi user pada event
 *     tags:
 *       - EventParticipant
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user
 *     responses:
 *       200:
 *         description: History partisipasi user pada event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventParticipant'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get('/:eventId/:userId/history', getEventParticipantHistory);

/**
 * @swagger
 * /event-participants/{eventId}/get-list:
 *   get:
 *     summary: List peserta aktif event
 *     tags:
 *       - EventParticipant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List peserta
 */
router.get('/:eventId/get-list', requireAuth, listParticipants);

/**
 * @swagger
 * /event-participants/{eventId}/count:
 *   get:
 *     summary: Hitung peserta aktif event
 *     tags:
 *       - EventParticipant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jumlah peserta
 */
router.get('/:eventId/count', requireAuth, countParticipants);

/**
 * @swagger
 * /event-participants/{eventId}/{userId}:
 *   get:
 *     summary: Get peserta aktif by userId & eventId
 *     tags:
 *       - EventParticipant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data peserta
 */
router.get('/:eventId/:userId', requireAuth, getEventParticipant);

/**
 * @swagger
 * /event-participants/{eventId}/add-participants:
 *   post:
 *     summary: Tambah peserta event
 *     tags:
 *       - EventParticipant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Peserta ditambahkan
 */
router.post('/:eventId/add-participants', requireAuth, addParticipant);


/**
 * @swagger
 * /event-participants/{eventId}/{userId}/unjoin:
 *   patch:
 *     summary: Unjoin peserta event
 *     tags:
 *       - EventParticipant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Peserta di-unjoin
 */
router.patch('/:eventId/:userId/unjoin', requireAuth, unjoinParticipant);

/**
 * @swagger
 * /event-participants/{id}/delete:
 *   delete:
 *     summary: Hapus record peserta by id
 *     tags:
 *       - EventParticipant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Peserta dihapus
 */
router.delete('/:id/delete', requireAuth, removeParticipant);

export default router;
