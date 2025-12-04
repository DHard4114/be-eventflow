"use strict";
/**
 * @file Auth Routes
 * @author eventFlow Team
 * @description Endpoint untuk autentikasi user (register, login, update, delete)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const requireAuth_1 = require("../utils/requireAuth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /auths/register:
 *   post:
 *     summary: Register user baru
 *     description: Registrasi user baru ke eventFlow.
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
 *                 description: Nama lengkap user
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: Email user
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: Password user (minimal 6 karakter)
 *                 example: password123
 *               phoneNumber:
 *                 type: string
 *                 description: Nomor telepon user
 *                 example: "081234567890"
 *     responses:
 *       200:
 *         description: User berhasil diregistrasi
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
 *         description: Data tidak lengkap
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Bad Request
 *               message: All fields are required
 *       409:
 *         description: Email sudah terdaftar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Conflict
 *               message: Email already registered
 */
router.post('/register', authController_1.register);
/**
 * @swagger
 * /auths/register-as-organizer:
 *   post:
 *     summary: Register Dashboard
 *     description: Registrasi Organizer baru ke eventFlow.
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
 *                 description: Nama lengkap user
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: Email user
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: Password user (minimal 6 karakter)
 *                 example: password123
 *               phoneNumber:
 *                 type: string
 *                 description: Nomor telepon user
 *                 example: "081234567890"
 *     responses:
 *       200:
 *         description: User berhasil diregistrasi
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
 *         description: Data tidak lengkap
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Bad Request
 *               message: All fields are required
 *       409:
 *         description: Email sudah terdaftar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Conflict
 *               message: Email already registered
 */
router.post('/register-as-organizer', authController_1.regitserAsOrganizer);
/**
 * @swagger
 * /auths/login:
 *   post:
 *     summary: Login user
 *     description: Login user ke eventFlow dan mendapatkan JWT token.
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
 *                 description: Email user
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: Password user
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login berhasil
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
 *                   description: JWT token untuk autentikasi
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImlhdCI6MTYxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *       400:
 *         description: Data tidak lengkap
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Bad Request
 *               message: Email and password are required
 *       401:
 *         description: Kredensial salah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Unauthorized
 *               message: Invalid credentials
 */
router.post('/login', authController_1.login);
/**
 * @swagger
 * /auths/update:
 *   patch:
 *     summary: Update data user
 *     description: Update data user yang sedang login. Memerlukan JWT token.
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
 *                 description: Nama user
 *                 example: John Doe Updated
 *               phoneNumber:
 *                 type: string
 *                 description: Nomor telepon user
 *                 example: "081234567890"
 *               avatarUrl:
 *                 type: string
 *                 description: URL avatar user
 *                 example: https://example.com/avatar.jpg
 *               password:
 *                 type: string
 *                 description: Password baru (opsional)
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: User berhasil diupdate
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
 *         description: Unauthorized - Token tidak valid atau tidak ada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Unauthorized
 *               message: Invalid or missing token
 *       400:
 *         description: Data tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/update', requireAuth_1.requireAuth, authController_1.updateUser);
/**
 * @swagger
 * /auths/delete:
 *   delete:
 *     summary: Hapus user
 *     description: Hapus user yang sedang login dari eventFlow. Memerlukan JWT token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak ada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Unauthorized
 *               message: Invalid or missing token
 */
router.delete('/delete', requireAuth_1.requireAuth, authController_1.deleteUser);
exports.default = router;
