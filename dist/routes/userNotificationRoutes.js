"use strict";
/**
 * @file User Notification Routes
 * @author eventFlow Team
 * @description Endpoint untuk notifikasi user (get, mark as read, unread count)
*/
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userNotificationController_1 = require("../controllers/userNotificationController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /user-notifications/read-all:
 *   post:
 *     summary: Tandai seluruh notifikasi user sebagai sudah dibaca
 *     tags: [UserNotification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifikasi ditandai sudah dibaca
 *       401:
 *         description: Unauthorized
 */
router.post('/read-all', userNotificationController_1.markAllNotificationsRead);
/**
 * @swagger
 * /user-notifications/me:
 *   get:
 *     summary: Ambil semua notifikasi user
 *     tags: [UserNotification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List notifikasi user
 *       401:
 *         description: Unauthorized
*/
router.get('/me', userNotificationController_1.getUserNotifications);
/**
 * @swagger
 * /user-notifications/{notificationId}/read:
 *   post:
 *     summary: Tandai notifikasi user sebagai sudah dibaca
 *     tags: [UserNotification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID notifikasi
 *     responses:
 *       200:
 *         description: Notifikasi ditandai sudah dibaca
 *       401:
 *         description: Unauthorized
 */
router.post('/:notificationId/read', userNotificationController_1.markNotificationRead);
/**
 * @swagger
 * /user-notifications/me/read-list:
 *   get:
 *     summary: Ambil jumlah notifikasi user yang sudah dibaca
 *     tags: [UserNotification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jumlah notifikasi belum dibaca
 *       401:
 *         description: Unauthorized
 */
router.get('/me/read-list', userNotificationController_1.getListReadNotifications);
/**
 * @swagger
 * /user-notifications/me/unread-list:
 *   get:
 *     summary: Ambil jumlah notifikasi user yang belum dibaca
 *     tags: [UserNotification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jumlah notifikasi belum dibaca
 *       401:
 *         description: Unauthorized
 */
router.get('/me/unread-list', userNotificationController_1.getListUnreadNotifications);
/**
 * @swagger
 * /user-notifications/:notificationId/delete:
 *   delete:
 *     summary: Menghapus notifikasi user spesifik
 *     tags: [UserNotification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID notifikasi
 *     responses:
 *       200:
 *         description: Notifikasi telah terhapus!
 *       401:
 *         description: Unauthorized
 */
router.delete('/:notificationId/delete', userNotificationController_1.deleteUserNotificationById);
/**
 * @swagger
 * /user-notifications/:eventId/delete:
 *   delete:
 *     summary: Menghapus notifikasi user berdasarkan event yang diikuti
 *     tags: [UserNotification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID notifikasi
 *     responses:
 *       200:
 *         description: Seluruh notifikasi dalam event ini telah terhapus!
 *       401:
 *         description: Unauthorized
 */
router.delete('/:eventId/delete', userNotificationController_1.deleteAllNotificationByEvent);
/**
 * @swagger
 * /user-notifications/delete-all:
 *   delete:
 *     summary: Menghapus seluruh notifkasi user
 *     tags: [UserNotification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seluruh notifikasi telah terhapus!
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete-all', userNotificationController_1.deleteAllNotificationForUser);
exports.default = router;
