/**
 * @file userRoutes.ts
 * @module routes/userRoutes
 * @author eventFlow Team
 * @description Endpoints for user profile management (get, update, delete).
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, ../controllers/userController, multer
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
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update user profile (partial update - all fields optional)
 *     description: |
 *       You can update only the avatar, only the name, only the phoneNumber, or any combination.
 *       Fields not sent will remain unchanged.
 *       **How to use in Swagger:**
 *       - Check the checkbox for the fields you want to update
 *       - Leave fields you do not want to change empty
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
 *                 description: User name (optional)
 *                 example: "John Doe"
 *               phoneNumber:
 *                 type: string
 *                 description: User phone number (optional)
 *                 example: "+6281234567890"
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: User avatar file - image (optional)
 *     responses:
 *       200:
 *         description: User profile updated successfully
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
 *     summary: Delete user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/me', deleteUser);

export default router;
