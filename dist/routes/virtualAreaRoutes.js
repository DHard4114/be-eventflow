"use strict";
/**
 * @file Virtual Area Routes
 * @author eventFlow Team
 * @description Endpoint untuk manajemen area virtual event (CRUD geofence)
*/
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const virtualAreaController_1 = require("../controllers/virtualAreaController");
const requireAuth_1 = require("../utils/requireAuth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /virtual-area/{eventId}/current:
 *   get:
 *     summary: Get user current virtual area by location
 *     tags:
 *       - VirtualArea
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
 *         description: Area virtual user
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lokasi user tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get('/:eventId/current', virtualAreaController_1.getCurrentVirtualArea);
/**
 * @swagger
 * /virtual-area/{eventId}:
 *   post:
 *     summary: Buat area virtual (geofence) pada event
 *     tags: [VirtualArea]
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
 *               - name
 *               - area
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *               area:
 *                 type: object
 *                 example:
 *                   type: Polygon
 *                   coordinates:
 *                     - [
 *                         [116.4858, -8.3885],
 *                         [116.4866, -8.3885],
 *                         [116.4866, -8.3891],
 *                         [116.4858, -8.3891],
 *                         [116.4858, -8.3885]
 *                       ]
 *               color:
 *                 type: string
 *                 example: "#1E90FF"
 *           example:
 *             name: Zona Registrasi Sembalun
 *             area:
 *               type: Polygon
 *               coordinates:
 *                 - [
 *                     [116.4858, -8.3885],
 *                     [116.4866, -8.3885],
 *                     [116.4866, -8.3891],
 *                     [116.4858, -8.3891],
 *                     [116.4858, -8.3885]
 *                   ]
 *             color: "#1E90FF"
 *     responses:
 *       200:
 *         description: Area virtual berhasil dibuat
 *       400:
 *         description: Data tidak lengkap
 *       401:
 *         description: Unauthorized
*/
router.post('/:eventId', requireAuth_1.requireAuth, virtualAreaController_1.createVirtualArea);
/**
 * @swagger
 * /virtual-area/{eventId}/get-all:
 *   get:
 *     summary: Ambil semua area virtual pada event
 *     tags: [VirtualArea]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *     responses:
 *       200:
 *         description: List area virtual event
*/
router.get('/:eventId/get-all', virtualAreaController_1.getVirtualAreas);
/**
 * @swagger
 * /virtual-area/{eventId}/{areaId}:
 *   get:
 *     summary: Ambil area virtual tertentu pada event
 *     tags: [VirtualArea]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID area virtual
 *     responses:
 *       200:
 *         description: Area virtual ditemukan
 *       404:
 *         description: Area virtual tidak ditemukan
 */
router.get('/:eventId/:areaId', virtualAreaController_1.getVirtualAreaById);
/**
 * @swagger
 * /virtual-area/{eventId}/search:
 *   get:
 *     summary: Cari area virtual yang mengandung lokasi user (geofencing)
 *     tags: [VirtualArea]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID event
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude user
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude user
 *     responses:
 *       200:
 *         description: Area virtual yang mengandung lokasi user
 *       404:
 *         description: Tidak ada area yang mengandung lokasi
*/
router.get('/:eventId/search', virtualAreaController_1.searchVirtualAreaByLocation);
/**
 * @swagger
 * /events/virtual-areas/{areaId}:
 *   patch:
 *     summary: Update area virtual event
 *     tags: [VirtualArea]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID area virtual
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Area virtual berhasil diupdate
 *       401:
 *         description: Unauthorized
 */
router.patch('/virtual-areas/:areaId', requireAuth_1.requireAuth, virtualAreaController_1.updateVirtualArea);
/**
 * @swagger
 * /virtual-area/{areaId}:
 *   delete:
 *     summary: Hapus area virtual event
 *     tags: [VirtualArea]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID area virtual
 *     responses:
 *       200:
 *         description: Area virtual berhasil dihapus
 *       401:
 *         description: Unauthorized
 */
router.delete('/:areaId', requireAuth_1.requireAuth, virtualAreaController_1.deleteVirtualArea);
exports.default = router;
