
/**
 * @file eventParticipantRoutes.ts
 * @module routes/eventParticipantRoutes
 * @author eventFlow Team
 * @description Endpoints for event participant CRUD and queries.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, ../controllers/eventParticipantController
 */
import { Router } from 'express';

import {
  getEventParticipant,
  listParticipants,
  addParticipant,
  unjoinParticipant,
  removeParticipant,
  countParticipants,
  getEventParticipantHistory,
  getAttendanceStatistics,
  updateParticipantAttendance,
  processEndedEvents
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
 * /event-participants/{eventId}/attendance-stats:
 *   get:
 *     summary: Get attendance statistics untuk event
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
 *         description: ID event
 *     responses:
 *       200:
 *         description: Attendance statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalParticipants:
 *                       type: number
 *                     present:
 *                       type: number
 *                     absent:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     attendanceRate:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get('/:eventId/attendance-stats', requireAuth, getAttendanceStatistics);

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



/**
 * @swagger
 * /event-participants/{eventId}/{userId}/attendance:
 *   patch:
 *     summary: Update attendance status (manual override by organizer)
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
 *         description: ID event
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attendanceStatus:
 *                 type: string
 *                 enum: [PENDING, PRESENT, ABSENT]
 *             required:
 *               - attendanceStatus
 *     responses:
 *       200:
 *         description: Attendance status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Participant not found
 *       500:
 *         description: Server error
 */
router.patch('/:eventId/:userId/attendance', requireAuth, updateParticipantAttendance);

/**
 * @swagger
 * /event-participants/process-ended-events:
 *   post:
 *     summary: Process ended events and mark PENDING as ABSENT
 *     description: Trigger untuk mark attendance setelah event selesai. Bisa dipanggil dari external cron service atau manual.
 *     tags:
 *       - EventParticipant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     processedEvents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           eventId:
 *                             type: string
 *                           eventName:
 *                             type: string
 *                           markedAbsent:
 *                             type: number
 *       500:
 *         description: Server error
 */
router.post('/process-ended-events', requireAuth, processEndedEvents);

export default router;
