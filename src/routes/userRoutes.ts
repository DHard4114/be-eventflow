/**
 * @file User Routes
 * @author eventFlow Team
 * @description Endpoint untuk manajemen profil user (get, update, delete)
 */

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  deleteUser,
} from '../controllers/userController';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Ambil profil user saat ini
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil user
 *       401:
 *         description: Unauthorized
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update profil user (partial update - semua field optional)
 *     description: |
 *       Bisa update foto saja, name saja, phoneNumber saja, atau kombinasi.
 *       Field yang tidak dikirim tidak akan berubah.
 *       **Cara pakai di Swagger:**
 *       - Centang checkbox field yang mau diupdate
 *       - Kosongkan field yang tidak mau diubah
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nama user (optional)
 *                 example: "John Doe"
 *               phoneNumber:
 *                 type: string
 *                 description: Nomor telepon user (optional)
 *                 example: "+6281234567890"
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File avatar user - image (optional)
 *     responses:
 *       200:
 *         description: Profil user berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error (e.g., Cloudinary upload failed)
 */
router.patch('/me', upload.single('avatar'), updateProfile);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Hapus user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User berhasil dihapus
 *       401:
 *         description: Unauthorized
 */
router.delete('/me', deleteUser);

export default router;
