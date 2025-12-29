
/**
 * @file authRoutes.ts
 * @module routes/authRoutes
 * @author eventFlow Team
 * @description Endpoints for user authentication (register, login, update, delete).
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, ../controllers/authController, ../utils/requireAuth
 */

import { Router } from 'express';
import {
  register,
  login,
  updateUser,
  deleteUser,
  regitserAsOrganizer
} from '../controllers/authController';
import { requireAuth } from '../utils/requireAuth';

const router = Router();

/**
 * @swagger
 * /auths/register:
 *   post:
 *     summary: Register new user
 *     description: Register a new user to eventFlow.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: User email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: User password (minimum 6 characters)
 *                 example: password123
 *               phoneNumber:
 *                 type: string
 *                 description: User phone number
 *                 example: "081234567890"
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Incomplete data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Bad Request
 *               message: All fields are required
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Conflict
 *               message: Email already registered
 */
router.post('/register', register);

/**
 * @swagger
 * /auths/register-as-organizer:
 *   post:
 *     summary: Register as Organizer
 *     description: Register a new Organizer to eventFlow.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: User email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: User password (minimum 6 characters)
 *                 example: password123
 *               phoneNumber:
 *                 type: string
 *                 description: User phone number
 *                 example: "081234567890"
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Incomplete data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Bad Request
 *               message: All fields are required
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Conflict
 *               message: Email already registered
 */
router.post('/register-as-organizer', regitserAsOrganizer);

/**
 * @swagger
 * /auths/login:
 *   post:
 *     summary: User login
 *     description: Log in to eventFlow and receive a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: User email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImlhdCI6MTYxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *       400:
 *         description: Incomplete data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Bad Request
 *               message: Email and password are required
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Unauthorized
 *               message: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /auths/update:
 *   patch:
 *     summary: Update user data
 *     description: Update the data of the currently logged-in user. Requires JWT token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User name
 *                 example: John Doe Updated
 *               phoneNumber:
 *                 type: string
 *                 description: User phone number
 *                 example: "081234567890"
 *               avatarUrl:
 *                 type: string
 *                 description: User avatar URL
 *                 example: https://example.com/avatar.jpg
 *               password:
 *                 type: string
 *                 description: New password (optional)
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Unauthorized
 *               message: Invalid or missing token
 *       400:
 *         description: Invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/update', requireAuth, updateUser);

/**
 * @swagger
 * /auths/delete:
 *   delete:
 *     summary: Delete user
 *     description: Delete the currently logged-in user from eventFlow. Requires JWT token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Unauthorized
 *               message: Invalid or missing token
 */
router.delete('/delete', requireAuth, deleteUser);

export default router;