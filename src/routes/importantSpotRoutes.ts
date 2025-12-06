/**
 * File: importantSpotRoutes.ts
 * Author: eventFlow Team
 * Deskripsi: Routing untuk endpoint CRUD ImportantSpot (titik penting event)
 * Dibuat: 2025-12-01
 * Versi: 1.0.0
 * Lisensi: MIT
 */
import { Router } from 'express';
import * as importantSpotController from '../controllers/importantSpotController';
import { requireRole } from '../middleware/requireRole';

/**
 * @swagger
 * tags:
 *   name: ImportantSpot
 *   description: API untuk mengelola titik penting event
 */

const router = Router();

/**
 * @swagger
 * /important-spots/{eventId}:
 *   post:
 *     summary: Tambah titik penting event (hanya ORGANIZER)
 *     tags: [ImportantSpot]
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
 *             properties:
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [ENTRY_GATE, EXIT_GATE, CHECKPOINT, SHELTER, INFO_CENTER, STAGE, REST_AREA, VIEW_POINT, DANGER_ZONE, MEETING_POINT, HOSPITAL, OTHER]
 *               customType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Spot berhasil dibuat
 *       400:
 *         description: Data tidak lengkap
 *       403:
 *         description: "Forbidden: insufficient role"
 */
router.post('/:eventId', requireRole(['ORGANIZER']), importantSpotController.createSpot);

/**
 * @swagger
 * /important-spots/event/{eventId}:
 *   get:
 *     summary: Ambil semua spot penting untuk event tertentu
 *     tags: [ImportantSpot]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List spot penting
 */
router.get('/event/:eventId', importantSpotController.getSpotsByEvent);

/**
 * @swagger
 * /important-spots/{id}:
 *   patch:
 *     summary: Update spot penting
 *     tags: [ImportantSpot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [HOSPITAL, ENTRY_GATE, EXIT_GATE, SHELTER, INFO_CENTER, OTHER]
 *               customType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Spot berhasil diupdate
 *       404:
 *         description: Spot tidak ditemukan
 */
// CRITICAL: Route spesifik /update/:id HARUS SEBELUM route general /:id
router.patch('/:id', requireRole(['ORGANIZER']), importantSpotController.updateSpot);

/**
 * @swagger
 * /important-spots/{id}:
 *   get:
 *     summary: Ambil detail spot penting
 *     tags: [ImportantSpot]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail spot
 *       404:
 *         description: Spot tidak ditemukan
 */
// Route general /:id HARUS SETELAH semua route spesifik
router.get('/:id', importantSpotController.getSpotById);


/**
 * @swagger
 * /important-spots/{id}:
 *   delete:
 *     summary: Hapus spot penting
 *     tags: [ImportantSpot]
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
 *         description: Spot berhasil dihapus
 *       404:
 *         description: Spot tidak ditemukan
 */
router.delete('/:id', requireRole(['ORGANIZER']), importantSpotController.deleteSpot);

export default router;