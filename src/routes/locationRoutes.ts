/**
 * @file Location Routes
 * @author eventFlow Team
 * @description Endpoint untuk manajemen lokasi peserta event (update, get lokasi)
 */

import { Router } from 'express';
import {
  updateLocation,
  getEventLocations,
  getMyLocation,
} from '../controllers/locationController';

const router = Router();

/**
 * @swagger
 * /locations/{eventId}:
 *   post:
 *     summary: Update lokasi peserta pada event
 *     tags: [Location]
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
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Lokasi berhasil diupdate
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Unauthorized
 */
router.post('/:eventId', updateLocation);

/**
 * @swagger
 * /locations/{eventId}:
 *   get:
 *     summary: Ambil semua lokasi peserta pada event
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *     responses:
 *       200:
 *         description: List lokasi peserta
 */
router.get('/:eventId', getEventLocations);

/**
 * @swagger
 * /locations/{eventId}/me:
 *   get:
 *     summary: Ambil lokasi user saat ini pada event
 *     tags: [Location]
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
 *         description: Lokasi user
 *       401:
 *         description: Unauthorized
 */
router.get('/:eventId/me', getMyLocation);

export default router;
