/**
 * @file Report Routes - Enhanced dengan real-time features
 * @author eventFlow Team
 * @description Complete API endpoints untuk sistem laporan event
 * @version 3.0.0
 */

import { Router } from 'express';
import { requireAuth } from '../utils/requireAuth';
import {
  createReport,
  getReports,
  updateReportStatus,
  deleteReport,
  broadcastReport,
  getReportStatistics,
  getUrgentReportsHandler,
  batchUpdateStatus
} from '../controllers/reportController';

import { uploadReport } from '../utils/uploadReport';
import { handleMulterError } from '../utils/handleMulterError';

const router = Router();

/**
 * @swagger
 * /reports/{id}:
 *   post:
 *     summary: Buat laporan baru (real-time ke organizer)
 *     description: Participant membuat laporan yang langsung dikirim ke organizer via socket
 *     tags: [Report]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - description
 *               - latitude
 *               - longitude
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [SECURITY, CROWD, FACILITY, OTHER]
 *                 description: Kategori laporan
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Deskripsi detail kejadian
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Latitude lokasi kejadian
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Longitude lokasi kejadian
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: File media (foto/video/audio) max 5 file, 10MB each
 *     responses:
 *       201:
 *         description: Laporan berhasil dibuat dan organizer notified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Data tidak lengkap atau invalid
 *       401:
 *         description: Unauthorized - Token tidak valid
 *       403:
 *         description: Forbidden - Bukan participant event
 */
router.post('/:id', requireAuth, uploadReport.array('media', 5), handleMulterError, createReport);

/**
 * @swagger
 * /reports/{id}/my-reports:
 *   get:
 *     summary: Ambil daftar laporan event
 *     description: Organizer melihat semua, participant hanya miliknya
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [SECURITY, CROWD, FACILITY, OTHER]
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, RESOLVED]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter dari tanggal
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter sampai tanggal
 *     responses:
 *       200:
 *         description: List laporan event
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/my-reports', requireAuth, getReports);

/**
 * @swagger
 * /reports/{id}/statistics:
 *   get:
 *     summary: Statistik laporan event (organizer only)
 *     description: Dashboard data untuk monitoring laporan
 *     tags: [Report]
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
 *         description: Statistik laporan
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
 *                     summary:
 *                       type: object
 *                     byCategory:
 *                       type: object
 *       403:
 *         description: Bukan organizer
 */
router.get('/:id/statistics', requireAuth, getReportStatistics);

/**
 * @swagger
 * /reports/{id}/urgent:
 *   get:
 *     summary: Laporan urgent (SECURITY PENDING)
 *     description: List laporan security yang butuh perhatian segera
 *     tags: [Report]
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
 *         description: List urgent reports
 *       403:
 *         description: Bukan organizer
 */
router.get('/:id/urgent', requireAuth, getUrgentReportsHandler);

/**
 * @swagger
 * /reports/{reportId}/status:
 *   patch:
 *     summary: Update status laporan (organizer only)
 *     description: Ubah status dan tambahkan catatan organizer
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID laporan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, RESOLVED]
 *                 description: Status baru laporan
 *               adminNotes:
 *                 type: string
 *                 description: Catatan dari organizer
 *     responses:
 *       200:
 *         description: Status berhasil diupdate
 *       403:
 *         description: Bukan organizer
 */
router.patch('/:reportId/status', requireAuth, updateReportStatus);

/**
 * @swagger
 * /reports/{reportId}/broadcast:
 *   post:
 *     summary: Broadcast laporan ke semua participants
 *     description: Kirim notifikasi real-time laporan penting ke semua peserta
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID laporan yang akan di-broadcast
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               broadcastMessage:
 *                 type: string
 *                 description: Pesan custom untuk broadcast (optional)
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Tingkat urgency broadcast
 *     responses:
 *       200:
 *         description: Laporan berhasil di-broadcast
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
 *                     reportId:
 *                       type: string
 *                     notificationId:
 *                       type: string
 *                     participantsCount:
 *                       type: number
 *       403:
 *         description: Bukan organizer
 */
router.post('/:reportId/broadcast', requireAuth, broadcastReport);

/**
 * @swagger
 * /reports/batch-update:
 *   patch:
 *     summary: Update status multiple reports sekaligus
 *     description: Batch operation untuk efisiensi organizer
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportIds
 *               - status
 *             properties:
 *               reportIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of report IDs
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, RESOLVED]
 *     responses:
 *       200:
 *         description: Reports berhasil diupdate
 *       403:
 *         description: Tidak ada akses
 */
router.patch('/batch-update', requireAuth, batchUpdateStatus);

/**
 * @swagger
 * /reports/{reportId}:
 *   delete:
 *     summary: Hapus laporan
 *     description: Organizer atau pembuat laporan dapat menghapus
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID laporan
 *     responses:
 *       200:
 *         description: Laporan berhasil dihapus
 *       403:
 *         description: Tidak memiliki akses
 */
router.delete('/:reportId', requireAuth, deleteReport);

export default router;