import { Router } from 'express';
import {
  getAIResultsByReport,
  getAIResult,
  updateAIResult,
  deleteAIResult,
  // postAnalyzeAndSaveAIResult
} from '../controllers/reportAIResultController';

const router = Router();

// /**
//  * @swagger
//  * /reports-ai:
//  *   post:
//  *     summary: Membuat hasil AI baru untuk report
//  *     tags: [ReportAIResult]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/ReportAIResultInput'
//  *     responses:
//  *       201:
//  *         description: Hasil AI berhasil dibuat
//  *       400:
//  *         description: Data tidak valid
//  */
// router.post('/', createAIResult);

// router.post('/', postAnalyzeAndSaveAIResult);

/**
 * @swagger
 * /reports-ai/report/{reportId}:
 *   get:
 *     summary: Ambil semua hasil AI untuk report tertentu
 *     tags: [ReportAIResult]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID report
 *     responses:
 *       200:
 *         description: List hasil AI untuk report
 */
router.get('/report/:reportId', getAIResultsByReport);

/**
 * @swagger
 * /reports-ai/{id}:
 *   get:
 *     summary: Ambil detail hasil AI berdasarkan ID
 *     tags: [ReportAIResult]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hasil AI
 *     responses:
 *       200:
 *         description: Detail hasil AI
 *       404:
 *         description: Data tidak ditemukan
 */
router.get('/:id', getAIResult);

/**
 * @swagger
 * /reports-ai/{id}:
 *   put:
 *     summary: Update hasil AI berdasarkan ID
 *     tags: [ReportAIResult]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hasil AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportAIResultInput'
 *     responses:
 *       200:
 *         description: Hasil AI berhasil diupdate
 *       404:
 *         description: Data tidak ditemukan
 */
router.put('/:id', updateAIResult);

/**
 * @swagger
 * /reports-ai/{id}:
 *   delete:
 *     summary: Hapus hasil AI berdasarkan ID
 *     tags: [ReportAIResult]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hasil AI
 *     responses:
 *       200:
 *         description: Hasil AI berhasil dihapus
 *       404:
 *         description: Data tidak ditemukan
 */
router.delete('/:id', deleteAIResult);

export default router;
