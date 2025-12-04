/**
 * @file Device Routes
 * @author eventFlow Team
 * @description Endpoint untuk manajemen device (push token, user device)
 * @swagger
 * tags:
 *   - name: Device
 *     description: Endpoint manajemen device user dan push token
 */

import { Router } from 'express';
import {
  registerDevice,
  getMyDevices,
  deleteDevice,
} from '../controllers/deviceController';

const router = Router();

/**
 * @swagger
 * /devices/register:
 *   post:
 *     summary: Register atau update device push token
 *     description: Registrasi atau update device push token user.
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pushToken
 *             properties:
 *               pushToken:
 *                 type: string
 *                 description: Token push notification device
 *     responses:
 *       200:
 *         description: Device berhasil diregistrasi/diupdate
 *       400:
 *         description: Data tidak lengkap
 *       401:
 *         description: Unauthorized
 */
router.post('/register', registerDevice);

/**
 * @swagger
 * /devices/me:
 *   get:
 *     summary: Ambil semua device milik user saat ini
 *     description: Mengambil semua device milik user yang sedang login.
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List device user
 *       401:
 *         description: Unauthorized
 */
router.get('/me', getMyDevices);

/**
 * @swagger
 * /devices/{deviceId}:
 *   delete:
 *     summary: Hapus device (logout)
 *     description: Menghapus device user (logout).
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID device yang akan dihapus
 *     responses:
 *       200:
 *         description: Device berhasil dihapus
 *       401:
 *         description: Unauthorized
 */
router.delete('/:deviceId', deleteDevice);

export default router;
