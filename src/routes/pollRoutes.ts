/**
 * File: pollRoutes.ts
 * Author: eventFlow Team
 * Deskripsi: Routing endpoint voting/polling event dengan real-time Socket.io support.
 * Dibuat: 2025-11-11
 * Versi: 2.0.0
 * Lisensi: MIT
*/
import { Router } from 'express';
import {
  createPollController,
  submitVote,
  getPollResults,
  unPollVote,
  getEventPollsController,
  deletePollController,
  getUserVote
} from '../controllers/pollController';

const router = Router();

/**
 * @swagger
 * /polls/{eventId}:
 *   post:
 *     summary: Membuat polling baru pada event
 *     tags: [Poll]
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
 *               - question
 *               - options
 *             properties:
 *               question:
 *                 type: string
 *                 example: "Siapa MC terbaik?"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Asep", "Budi", "Cici"]
 *     responses:
 *       200:
 *         description: Poll berhasil dibuat
 *       400:
 *         description: Data tidak lengkap
 *       401:
 *         description: Unauthorized
 *     security:
 *       - bearerAuth: []
 */
router.post('/:eventId', createPollController);

/**
 * @swagger
 * /polls/{pollId}/vote:
 *   post:
 *     summary: Submit vote pada polling event (real-time)
 *     tags: [Poll]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID polling
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pollOptionId
 *             properties:
 *               pollOptionId:
 *                 type: string
 *                 example: "option123"
 *     responses:
 *       200:
 *         description: Vote berhasil disimpan dan hasil voting terupdate real-time
 *     security:
 *       - bearerAuth: []
 */
router.post('/:pollId/vote', submitVote);

/**
 * @swagger
 * /polls/{eventId}:
 *   get:
 *     summary: Ambil semua polling pada event dengan statistik
 *     tags: [Poll]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *     responses:
 *       200:
 *         description: List polling event dengan statistik voting
 *       400:
 *         description: eventId wajib diisi
 */
router.get('/:eventId', getEventPollsController);

/**
 * @swagger
 * /polls/{pollId}/results:
 *   get:
 *     summary: Ambil hasil polling event dengan statistik lengkap
 *     tags: [Poll]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID polling
 *     responses:
 *       200:
 *         description: Hasil polling dengan persentase dan total votes
 */
router.get('/:pollId/results', getPollResults);

/**
 * @swagger
 * /polls/{pollId}/my-vote:
 *   get:
 *     summary: Ambil vote user pada polling tertentu
 *     tags: [Poll]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID polling
 *     responses:
 *       200:
 *         description: Informasi vote user
 *     security:
 *       - bearerAuth: []
 */
router.get('/:pollId/my-vote', getUserVote);

/**
 * @swagger
 * /polls/{pollId}/unvote:
 *   post:
 *     summary: Un-vote (hapus vote polling event) - real-time
 *     tags: [Poll]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID polling
 *     responses:
 *       200:
 *         description: Vote berhasil dihapus dan hasil voting terupdate real-time
 *     security:
 *       - bearerAuth: []
 */
router.post('/:pollId/unvote', unPollVote);

/**
 * @swagger
 * /polls/{pollId}:
 *   delete:
 *     summary: Hapus polling event (real-time)
 *     tags: [Poll]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID polling
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *     responses:
 *       200:
 *         description: Poll berhasil dihapus dan notifikasi real-time dikirim
 *       400:
 *         description: pollId wajib diisi
 *       401:
 *         description: Unauthorized
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:pollId', deletePollController);

export default router;