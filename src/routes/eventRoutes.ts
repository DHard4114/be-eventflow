/**
 * @file Event Routes
 * @author eventFlow Team
 * @description Endpoint untuk manajemen event (CRUD, join event)
**/

import { Router } from 'express';
import { requireAuth } from '../utils/requireAuth';
import { requireRole } from '../middleware/requireRole';
import {
  createEvent,
  getEvent,
  listEvents,
  updateEvent,
  deleteEvent,
  joinEvent,
  finishEvent,
} from '../controllers/eventController';


const router = Router();

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Buat event baru
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startTime
 *               - endTime
 *               - locationName
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               locationName:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Event berhasil dibuat
 *       400:
 *         description: Data tidak lengkap
 *       401:
 *         description: Unauthorized
*/
router.post('/', requireAuth, requireRole(['ORGANIZER']), createEvent);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Ambil detail event
 *     tags: [Event]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *     responses:
 *       200:
 *         description: Detail event
 *       404:
 *         description: Event tidak ditemukan
*/
router.get('/:id', getEvent);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: List semua event
 *     tags: [Event]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter status event
 *     responses:
 *       200:
 *         description: List event
*/
router.get('/', listEvents);

/**
 * @swagger
 * /events/{id}:
 *   patch:
 *     summary: Update event
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Event berhasil diupdate
 *       401:
 *         description: Unauthorized
*/
router.patch('/:id', requireAuth, requireRole(['ORGANIZER']), updateEvent);

/**
 * @swagger
 * /events/{id}/join:
 *   post:
 *     summary: Join event dengan kode unik
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required:
 *               - joinCode
 *             properties:
 *               joinCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Berhasil join event
 *       400:
 *         description: Kode event salah
 *       401:
 *         description: Unauthorized
*/
router.post('/:id/join', requireAuth, joinEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Hapus event
 *     tags: [Event]
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
 *         description: Event berhasil dihapus
 *       401:
 *         description: Unauthorized
*/
router.delete('/:id', requireAuth, requireRole(['ORGANIZER']), deleteEvent);


/**
 * @swagger
 * /events/{id}/finish:
 *   patch:
 *     summary: Selesaikan event (organizer only)
 *     tags: [Event]
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
 *         description: Event berhasil diselesaikan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/finish', requireAuth, requireRole(['ORGANIZER']), finishEvent);

export default router;
  