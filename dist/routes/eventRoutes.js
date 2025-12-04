"use strict";
/**
 * @file Event Routes
 * @author eventFlow Team
 * @description Endpoint untuk manajemen event (CRUD, join event)
**/
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../utils/requireAuth");
const requireRole_1 = require("../middleware/requireRole");
const eventController_1 = require("../controllers/eventController");
const router = (0, express_1.Router)();
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
router.post('/', requireAuth_1.requireAuth, (0, requireRole_1.requireRole)(['ORGANIZER']), eventController_1.createEvent);
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
router.get('/:id', eventController_1.getEvent);
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
router.get('/', eventController_1.listEvents);
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
router.patch('/:id', requireAuth_1.requireAuth, (0, requireRole_1.requireRole)(['ORGANIZER']), eventController_1.updateEvent);
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
router.post('/:id/join', requireAuth_1.requireAuth, eventController_1.joinEvent);
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
router.delete('/:id', requireAuth_1.requireAuth, (0, requireRole_1.requireRole)(['ORGANIZER']), eventController_1.deleteEvent);
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
router.patch('/:id/finish', requireAuth_1.requireAuth, (0, requireRole_1.requireRole)(['ORGANIZER']), eventController_1.finishEvent);
exports.default = router;
