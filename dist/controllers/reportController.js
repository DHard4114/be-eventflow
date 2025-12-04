"use strict";
/**
 * File: reportController.ts
 * Author: eventFlow Team
 * Deskripsi: Enhanced controller untuk laporan dengan real-time broadcast dan notifikasi
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-15
 * Versi: 3.0.0
 * Lisensi: MIT
 * Dependensi: Express, Prisma, Cloudinary, JWT, Socket.io
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchUpdateStatus = exports.getUrgentReportsHandler = exports.getReportStatistics = exports.deleteReport = exports.broadcastReport = exports.updateReportStatus = exports.getReports = exports.createReport = void 0;
const client_1 = require("@prisma/client");
const reportRepository_1 = require("../repositories/reportRepository");
const baseResponse_1 = require("../utils/baseResponse");
const jwt_1 = require("../utils/jwt");
const cloudinary_1 = require("../utils/cloudinary");
const socket_1 = require("../utils/socket");
const notificationRepository_1 = require("../repositories/notificationRepository");
const eventRepository_1 = require("../repositories/eventRepository");
const eventParticipantRepository_1 = require("../repositories/eventParticipantRepository");
const geminiService_1 = require("../services/geminiService");
const reportAIResultRepository_1 = require("../repositories/reportAIResultRepository");
const prisma = new client_1.PrismaClient();
/**
 * Buat laporan baru dengan real-time notification ke organizer
 */
const createReport = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_1.errorResponse)('Unauthorized'));
        }
        const { id: eventId } = req.params;
        const { category, description, latitude, longitude } = req.body;
        // Validasi input
        if (!category || !description || latitude === undefined || longitude === undefined) {
            return res.status(400).json((0, baseResponse_1.errorResponse)('Semua field wajib diisi: category, description, latitude, longitude'));
        }
        // Validasi category
        const validCategories = ['SECURITY', 'CROWD', 'FACILITY', 'OTHER'];
        if (!validCategories.includes(category)) {
            return res.status(400).json((0, baseResponse_1.errorResponse)('Kategori tidak valid'));
        }
        // Cek participant
        const isParticipant = await (0, eventParticipantRepository_1.isEventParticipant)(eventId, payload.userId);
        if (!isParticipant) {
            return res.status(403).json((0, baseResponse_1.errorResponse)('Hanya participant event yang dapat membuat laporan'));
        }
        // Handle media uploads
        let mediaUrls = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                try {
                    const url = await (0, cloudinary_1.uploadToCloudinary)(file.path, 'reports');
                    mediaUrls.push(url);
                }
                catch (err) {
                    console.error('Upload media gagal:', err);
                    return res.status(500).json((0, baseResponse_1.errorResponse)('Upload media gagal'));
                }
            }
        }
        else if (req.body.mediaUrls) {
            mediaUrls = Array.isArray(req.body.mediaUrls)
                ? req.body.mediaUrls
                : [req.body.mediaUrls];
        }
        const latNum = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
        const lngNum = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
        // Create report
        const report = await (0, reportRepository_1.createReport)({
            event: { connect: { id: eventId } },
            reporter: { connect: { id: payload.userId } },
            category,
            description,
            latitude: latNum,
            longitude: lngNum,
            mediaUrls,
            status: 'PENDING'
        });
        // --- AI Insight ---
        let aiInsight = null;
        try {
            if (description && mediaUrls.length > 0) {
                // Ambil data event untuk parameter Gemini
                const event = await prisma.event.findUnique({
                    where: { id: eventId },
                    select: { name: true, description: true, locationName: true, virtualAreas: true }
                });
                // Validasi eventLocationName
                const eventLocationName = event?.locationName || 'Unknown Location';
                const eventDescription = event?.description || '';
                const eventName = event?.name || '';
                // Ambil virtualAreaName jika ada
                let virtualAreaName = 'Unknown Zone';
                if (event?.virtualAreas && Array.isArray(event.virtualAreas) && event.virtualAreas.length > 0) {
                    virtualAreaName = event.virtualAreas[0].name || 'Unknown Zone';
                }
                // Ambil nama reporter dan role
                const reporterName = report.reporter?.name || 'Unknown Reporter';
                const reporterRole = payload.role || 'participant';
                aiInsight = await (0, geminiService_1.getGeminiIncidentAnalysis)(eventName, eventDescription, eventLocationName, virtualAreaName, reporterName, reporterRole, category, description, latitude, longitude, mediaUrls[0]);
                // Simpan hasil AI ke ReportAIResult
                await (0, reportAIResultRepository_1.createReportAIResult)({
                    reportId: report.id,
                    aiType: 'gemini-multimodal',
                    aiPayload: { insight: aiInsight },
                    status: 'SUCCESS',
                    errorMsg: null,
                    meta: {
                        model: 'gemini-2.5-flash',
                        executedAt: new Date().toISOString(),
                        mediaUrl: mediaUrls[0],
                        promptVersion: 'v3.0',
                        inputCategory: category,
                        inputLatitude: latitude,
                        inputLongitude: longitude,
                        eventId,
                        reporterId: payload.userId
                    }
                });
            }
        }
        catch (err) {
            console.error('AI Insight error:', err);
        }
        // --- End AI Insight ---
        // REAL-TIME: Emit ke organizer event
        (0, socket_1.emitLiveReport)(eventId, {
            reportId: report.id,
            userId: payload.userId,
            message: `[${category}] ${description}`,
            mediaUrl: mediaUrls[0],
            createdAt: report.createdAt,
        });
        // Buat notifikasi untuk organizer
        try {
            const event = await prisma.event.findUnique({
                where: { id: eventId },
                select: { organizerId: true, name: true }
            });
            if (event) {
                const notif = await (0, notificationRepository_1.createNotification)({
                    title: `Laporan ${category}`,
                    message: `${report.reporter.name}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
                    type: category === 'SECURITY' ? 'SECURITY_ALERT' : 'EVENT_UPDATE',
                    eventId: eventId,
                    category: category,
                    userNotifications: {
                        create: [{
                                user: { connect: { id: event.organizerId } }
                            }]
                    }
                });
                // Emit notification real-time
                (0, socket_1.emitNotification)({
                    id: notif.id,
                    title: `Laporan ${category}`,
                    message: `${report.reporter.name}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
                    type: category === 'SECURITY' ? 'SECURITY_ALERT' : 'EVENT_UPDATE',
                    eventId: eventId,
                    category: category,
                    createdAt: notif.createdAt
                });
            }
        }
        catch (notifError) {
            console.error('Gagal membuat notifikasi:', notifError);
        }
        // Kirim response ke client (bisa tambahkan aiInsight di response)
        return res.status(201).json((0, baseResponse_1.baseResponse)({
            success: true,
            data: { report, aiInsight },
            message: 'Laporan berhasil dibuat dan dianalisis AI'
        }));
    }
    catch (err) {
        console.error('Create report error:', err);
        res.status(500).json((0, baseResponse_1.errorResponse)(err instanceof Error ? err.message : 'Unknown error'));
    }
};
exports.createReport = createReport;
/**
 * Get reports dengan filter untuk organizer/participant
 */
const getReports = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_1.errorResponse)('Unauthorized'));
        }
        const { id: eventId } = req.params;
        const { category, status, startDate, endDate } = req.query;
        const isOrganizer = await (0, eventRepository_1.isEventOrganizer)(eventId, payload.userId);
        let where = { eventId };
        if (category && Object.values(client_1.ReportCategory).includes(category)) {
            where.category = category;
        }
        if (status && Object.values(client_1.ReportStatus).includes(status)) {
            where.status = status;
        }
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        let reports;
        if (isOrganizer) {
            reports = await prisma.report.findMany({
                where,
                include: {
                    reporter: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                            phoneNumber: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        else {
            reports = await prisma.report.findMany({
                where: { ...where, reporterId: payload.userId },
                include: {
                    reporter: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        const formattedReports = reports.map((r) => ({
            id: r.id,
            category: r.category,
            description: r.description,
            latitude: r.latitude,
            longitude: r.longitude,
            status: r.status,
            mediaUrls: Array.isArray(r.mediaUrls) ? r.mediaUrls : [],
            reporter: r.reporter,
            createdAt: r.createdAt
        }));
        res.json((0, baseResponse_1.baseResponse)({
            success: true,
            data: formattedReports,
            message: isOrganizer ? 'Semua laporan event' : 'Laporan Anda di event ini'
        }));
    }
    catch (err) {
        console.error('Get reports error:', err);
        res.status(500).json((0, baseResponse_1.errorResponse)(err instanceof Error ? err.message : 'Unknown error'));
    }
};
exports.getReports = getReports;
/**
 * Update status report (hanya organizer)
 */
const updateReportStatus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_1.errorResponse)('Unauthorized'));
        }
        const { reportId } = req.params;
        const { status, adminNotes } = req.body;
        if (!status) {
            return res.status(400).json((0, baseResponse_1.errorResponse)('Status wajib diisi'));
        }
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json((0, baseResponse_1.errorResponse)('Status tidak valid'));
        }
        const report = await (0, reportRepository_1.findReportById)(reportId);
        if (!report) {
            return res.status(404).json((0, baseResponse_1.errorResponse)('Laporan tidak ditemukan'));
        }
        const isOrganizer = await (0, eventRepository_1.isEventOrganizer)(report.eventId, payload.userId);
        if (!isOrganizer) {
            return res.status(403).json((0, baseResponse_1.errorResponse)('Hanya organizer event yang dapat mengupdate status laporan'));
        }
        const updateData = { status: status };
        if (adminNotes)
            updateData.adminNotes = adminNotes;
        const updatedReport = await (0, reportRepository_1.updateReport)(reportId, updateData);
        // REAL-TIME: Emit status update
        (0, socket_1.emitLiveReport)(report.eventId, {
            reportId: updatedReport.id,
            userId: 'system',
            message: `Status laporan diupdate: ${status}${adminNotes ? ` - ${adminNotes}` : ''}`,
            createdAt: new Date(),
        });
        // Notifikasi ke reporter
        const notifMessage = `Laporan Anda tentang ${report.category} telah diupdate ke: ${status}${adminNotes ? ' - ' + adminNotes : ''}`;
        const notif = await (0, notificationRepository_1.createNotification)({
            title: 'Status Laporan Diupdate',
            message: notifMessage,
            type: 'EVENT_UPDATE',
            eventId: report.eventId,
            userNotifications: {
                create: [{
                        user: { connect: { id: report.reporterId } }
                    }]
            }
        });
        (0, socket_1.emitNotification)({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            eventId: report.eventId,
            createdAt: notif.createdAt
        });
        res.json((0, baseResponse_1.baseResponse)({
            success: true,
            data: {
                id: updatedReport.id,
                status: updatedReport.status,
                adminNotes: adminNotes
            },
            message: `Status laporan berhasil diupdate menjadi ${status}`
        }));
    }
    catch (err) {
        console.error('Update report status error:', err);
        res.status(500).json((0, baseResponse_1.errorResponse)(err instanceof Error ? err.message : 'Unknown error'));
    }
};
exports.updateReportStatus = updateReportStatus;
/**
 * BROADCAST report ke semua participants
 */
const broadcastReport = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_1.errorResponse)('Unauthorized'));
        }
        const { reportId } = req.params;
        const { broadcastMessage, severity } = req.body; // severity: 'low' | 'medium' | 'high'
        const report = await (0, reportRepository_1.findReportById)(reportId);
        if (!report) {
            return res.status(404).json((0, baseResponse_1.errorResponse)('Laporan tidak ditemukan'));
        }
        const isOrganizer = await (0, eventRepository_1.isEventOrganizer)(report.eventId, payload.userId);
        if (!isOrganizer) {
            return res.status(403).json((0, baseResponse_1.errorResponse)('Hanya organizer yang dapat broadcast laporan'));
        }
        // Get all participants
        const participants = await prisma.eventParticipant.findMany({
            where: { eventId: report.eventId },
            include: { user: true }
        });
        const title = `Pengumuman: ${report.category}`;
        const message = broadcastMessage || `${report.description.substring(0, 150)}${report.description.length > 150 ? '...' : ''}`;
        // Buat notifikasi broadcast
        const notification = await (0, notificationRepository_1.createNotification)({
            title,
            message,
            type: 'BROADCAST',
            eventId: report.eventId,
            category: report.category,
            userNotifications: {
                create: participants.map((p) => ({
                    user: { connect: { id: p.userId } }
                }))
            }
        });
        // REAL-TIME: Emit broadcast ke semua participants
        (0, socket_1.emitEventBroadcast)(report.eventId, {
            id: notification.id,
            title,
            message,
            type: 'BROADCAST',
            eventId: report.eventId,
            category: report.category,
            createdAt: notification.createdAt
        });
        // Update report status
        await (0, reportRepository_1.updateReport)(reportId, {
            status: 'IN_PROGRESS'
        });
        res.json((0, baseResponse_1.baseResponse)({
            success: true,
            data: {
                reportId: report.id,
                notificationId: notification.id,
                participantsCount: participants.length,
                severity
            },
            message: `Laporan berhasil di-broadcast ke ${participants.length} participants`
        }));
    }
    catch (err) {
        console.error('Broadcast report error:', err);
        res.status(500).json((0, baseResponse_1.errorResponse)(err instanceof Error ? err.message : 'Unknown error'));
    }
};
exports.broadcastReport = broadcastReport;
/**
 * Hapus report
 */
const deleteReport = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_1.errorResponse)('Unauthorized'));
        }
        const { reportId } = req.params;
        const report = await (0, reportRepository_1.findReportById)(reportId);
        if (!report) {
            return res.status(404).json((0, baseResponse_1.errorResponse)('Laporan tidak ditemukan'));
        }
        const isOrganizer = await (0, eventRepository_1.isEventOrganizer)(report.eventId, payload.userId);
        const isReporter = report.reporterId === payload.userId;
        if (!isOrganizer && !isReporter) {
            return res.status(403).json((0, baseResponse_1.errorResponse)('Anda tidak memiliki akses untuk menghapus laporan ini'));
        }
        await (0, reportRepository_1.deleteReport)(reportId);
        res.json((0, baseResponse_1.baseResponse)({
            success: true,
            message: 'Laporan berhasil dihapus'
        }));
    }
    catch (err) {
        console.error('Delete report error:', err);
        res.status(500).json((0, baseResponse_1.errorResponse)(err instanceof Error ? err.message : 'Unknown error'));
    }
};
exports.deleteReport = deleteReport;
/**
 * Get report statistics (organizer only)
 */
const getReportStatistics = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_1.errorResponse)('Unauthorized'));
        }
        const { id: eventId } = req.params;
        const isOrganizer = await (0, eventRepository_1.isEventOrganizer)(eventId, payload.userId);
        if (!isOrganizer) {
            return res.status(403).json((0, baseResponse_1.errorResponse)('Hanya organizer yang dapat melihat statistik'));
        }
        const stats = await (0, reportRepository_1.getReportStats)(eventId);
        res.json((0, baseResponse_1.baseResponse)({
            success: true,
            data: stats,
            message: 'Statistik laporan event'
        }));
    }
    catch (err) {
        console.error('Get report statistics error:', err);
        res.status(500).json((0, baseResponse_1.errorResponse)(err instanceof Error ? err.message : 'Unknown error'));
    }
};
exports.getReportStatistics = getReportStatistics;
/**
 * Get urgent reports (SECURITY yang PENDING)
 */
const getUrgentReportsHandler = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_1.errorResponse)('Unauthorized'));
        }
        const { id: eventId } = req.params;
        const isOrganizer = await (0, eventRepository_1.isEventOrganizer)(eventId, payload.userId);
        if (!isOrganizer) {
            return res.status(403).json((0, baseResponse_1.errorResponse)('Hanya organizer yang dapat melihat urgent reports'));
        }
        const urgentReports = await (0, reportRepository_1.getUrgentReports)(eventId);
        res.json((0, baseResponse_1.baseResponse)({
            success: true,
            data: urgentReports.map(r => ({
                id: r.id,
                description: r.description,
                latitude: r.latitude,
                longitude: r.longitude,
                reporter: r.reporter,
                createdAt: r.createdAt,
                mediaUrls: Array.isArray(r.mediaUrls) ? r.mediaUrls : []
            })),
            message: `${urgentReports.length} laporan security yang memerlukan perhatian`
        }));
    }
    catch (err) {
        console.error('Get urgent reports error:', err);
        res.status(500).json((0, baseResponse_1.errorResponse)(err instanceof Error ? err.message : 'Unknown error'));
    }
};
exports.getUrgentReportsHandler = getUrgentReportsHandler;
/**
 * Batch update report status
 */
const batchUpdateStatus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_1.errorResponse)('Unauthorized'));
        }
        const { reportIds, status } = req.body;
        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.status(400).json((0, baseResponse_1.errorResponse)('reportIds wajib berupa array'));
        }
        if (!status || !['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
            return res.status(400).json((0, baseResponse_1.errorResponse)('Status tidak valid'));
        }
        // Verify organizer access for all reports
        const reports = await prisma.report.findMany({
            where: { id: { in: reportIds } },
            select: { id: true, eventId: true }
        });
        for (const report of reports) {
            const isOrganizer = await (0, eventRepository_1.isEventOrganizer)(report.eventId, payload.userId);
            if (!isOrganizer) {
                return res.status(403).json((0, baseResponse_1.errorResponse)('Anda tidak memiliki akses untuk mengupdate beberapa laporan'));
            }
        }
        const count = await (0, reportRepository_1.batchUpdateReportStatus)(reportIds, status);
        res.json((0, baseResponse_1.baseResponse)({
            success: true,
            data: { updatedCount: count },
            message: `${count} laporan berhasil diupdate ke status ${status}`
        }));
    }
    catch (err) {
        console.error('Batch update status error:', err);
        res.status(500).json((0, baseResponse_1.errorResponse)(err instanceof Error ? err.message : 'Unknown error'));
    }
};
exports.batchUpdateStatus = batchUpdateStatus;
