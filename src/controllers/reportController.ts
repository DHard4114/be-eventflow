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

import { Request, Response } from 'express';
import { PrismaClient, ReportCategory, ReportStatus } from '@prisma/client';
import {
  createReport as createReportRepo,
  updateReport as updateReportRepo,
  deleteReport as deleteReportRepo,
  findReportById,
  // listEventReportsForOrganizer,
  // listEventReportsForParticipant,
  getReportStats,
  getUrgentReports,
  batchUpdateReportStatus
} from '../repositories/reportRepository';
import { baseResponse, errorResponse } from '../utils/baseResponse';
import { JWTPayload } from '../types/jwtPayload';
import { verifyJwt } from '../utils/jwt';
import { uploadToCloudinary } from '../utils/cloudinary';
import { 
  emitLiveReport, 
  emitNotification,
  emitEventBroadcast 
} from '../utils/socket';
import { createNotification } from '../repositories/notificationRepository';
import { isEventOrganizer } from '../repositories/eventRepository';
import { isEventParticipant } from '../repositories/eventParticipantRepository';
import { getGeminiIncidentAnalysis } from '../services/geminiService';
import { createReportAIResult } from '../repositories/reportAIResultRepository';

const prisma = new PrismaClient();

/**
 * Buat laporan baru dengan real-time notification ke organizer
 */
export const createReport = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const { id: eventId } = req.params;
    const { category, description, latitude, longitude } = req.body;

    // Validasi input
    if (!category || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json(
        errorResponse('Semua field wajib diisi: category, description, latitude, longitude')
      );
    }

    // Validasi category
    const validCategories = ['SECURITY', 'CROWD', 'FACILITY', 'OTHER'];
    if (!validCategories.includes(category)) {
      return res.status(400).json(errorResponse('Kategori tidak valid'));
    }

    // Cek participant
    const isParticipant = await isEventParticipant(eventId, payload.userId);
    if (!isParticipant) {
      return res.status(403).json(
        errorResponse('Hanya participant event yang dapat membuat laporan')
      );
    }

    // Handle media uploads
    let mediaUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        try {
          const url = await uploadToCloudinary(file.path, 'reports');
          mediaUrls.push(url);
        } catch (err) {
          console.error('Upload media gagal:', err);
          return res.status(500).json(errorResponse('Upload media gagal'));
        }
      }
    } else if (req.body.mediaUrls) {
      mediaUrls = Array.isArray(req.body.mediaUrls)
        ? req.body.mediaUrls
        : [req.body.mediaUrls];
    }
    const latNum = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lngNum = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    // Create report
    const report = await createReportRepo({
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
    let aiInsight: string | null = null;
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
        aiInsight = await getGeminiIncidentAnalysis(
          eventName,
          eventDescription,
          eventLocationName,
          virtualAreaName,
          reporterName,
          reporterRole,
          category,
          description,
          latitude,
          longitude,
          mediaUrls[0]
        );
        // Simpan hasil AI ke ReportAIResult
        await createReportAIResult({
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
    } catch (err) {
      console.error('AI Insight error:', err);
    }
    // --- End AI Insight ---

    // REAL-TIME: Emit ke organizer event
    emitLiveReport(eventId, {
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
        const notif = await createNotification({
          title: `Laporan ${category}`,
          message: `${report.reporter.name}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
          type: 'REPORT_FEEDBACK',
          eventId: eventId,
          category: category,
          deliveryMethod: 'INDIVIDUAL',
          userNotifications: {
            create: [{
              user: { connect: { id: event.organizerId } }
            }]
          }
        });

        // Emit notification real-time
        emitNotification({
          id: notif.id,
          title: `Laporan ${category}`,
          message: `${report.reporter.name}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
          type: 'REPORT_FEEDBACK',
          eventId: eventId,
          category: category,
          createdAt: notif.createdAt
        });
      }
    } catch (notifError) {
      console.error('Gagal membuat notifikasi:', notifError);
    }

    // Kirim response ke client (bisa tambahkan aiInsight di response)
    return res.status(201).json(baseResponse({
      success: true,
      data: { report, aiInsight },
      message: 'Laporan berhasil dibuat dan dianalisis AI'
    }));
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

/**
 * Get reports dengan filter untuk organizer/participant
 */
export const getReports = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const { id: eventId } = req.params;
    const { category, status, startDate, endDate } = req.query;
    const isOrganizer = await isEventOrganizer(eventId, payload.userId);

    let where: Record<string, unknown> = { eventId };
    if (category && Object.values(ReportCategory).includes(category as ReportCategory)) {
      where.category = category;
    }
    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      where.status = status;
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
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
    } else {
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

    res.json(baseResponse({ 
      success: true, 
      data: formattedReports,
      message: isOrganizer ? 'Semua laporan event' : 'Laporan Anda di event ini'
    }));
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

/**
 * Update status report (hanya organizer)
 */
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json(errorResponse('Status wajib diisi'));
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(errorResponse('Status tidak valid'));
    }

    const report = await findReportById(reportId);
    if (!report) {
      return res.status(404).json(errorResponse('Laporan tidak ditemukan'));
    }

    const isOrganizer = await isEventOrganizer(report.eventId, payload.userId);
    if (!isOrganizer) {
      return res.status(403).json(
        errorResponse('Hanya organizer event yang dapat mengupdate status laporan')
      );
    }

    interface UpdateData {
      status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
      adminNotes?: string;
    }

    const updateData: UpdateData = { status: status as UpdateData['status'] };
    if (adminNotes) updateData.adminNotes = adminNotes;

    const updatedReport = await updateReportRepo(reportId, updateData);

    // REAL-TIME: Emit status update
    emitLiveReport(report.eventId, {
      reportId: updatedReport.id,
      userId: 'system',
      message: `Status laporan diupdate: ${status}${adminNotes ? ` - ${adminNotes}` : ''}`,
      createdAt: new Date(),
    });

    // Notifikasi ke reporter
    const notifMessage = `Laporan Anda tentang ${report.category} telah diupdate ke: ${status}${adminNotes ? ' - ' + adminNotes : ''}`;
    const notif = await createNotification({
      title: 'Status Laporan Diupdate',
      message: notifMessage,
      type: 'REPORT_FEEDBACK',
      eventId: report.eventId,
      deliveryMethod: 'INDIVIDUAL',
      userNotifications: {
        create: [{
          user: { connect: { id: report.reporterId } }
        }]
      }
    });

    emitNotification({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      eventId: report.eventId,
      createdAt: notif.createdAt
    });

    res.json(baseResponse({ 
      success: true, 
      data: {
        id: updatedReport.id,
        status: updatedReport.status,
        adminNotes: adminNotes
      },
      message: `Status laporan berhasil diupdate menjadi ${status}`
    }));
  } catch (err) {
    console.error('Update report status error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

/**
 * BROADCAST report ke semua participants
 */
export const broadcastReport = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const { reportId } = req.params;
    const { broadcastMessage, severity } = req.body; // severity: 'low' | 'medium' | 'high'

    const report = await findReportById(reportId);
    if (!report) {
      return res.status(404).json(errorResponse('Laporan tidak ditemukan'));
    }

    const isOrganizer = await isEventOrganizer(report.eventId, payload.userId);
    if (!isOrganizer) {
      return res.status(403).json(
        errorResponse('Hanya organizer yang dapat broadcast laporan')
      );
    }

    // Get all participants
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId: report.eventId },
      include: { user: true }
    });

    const title = `Pengumuman: ${report.category}`;
    const message = broadcastMessage || `${report.description.substring(0, 150)}${report.description.length > 150 ? '...' : ''}`;

    // Buat notifikasi broadcast
    const notification = await createNotification({
      title,
      message,
      type: report.category === 'SECURITY' ? 'SECURITY_ALERT' : 'EVENT_UPDATE',
      eventId: report.eventId,
      category: report.category,
      deliveryMethod: 'BROADCAST',
      userNotifications: {
        create: participants.map((p) => ({
          user: { connect: { id: p.userId } }
        }))
      }
    });

    // REAL-TIME: Emit broadcast ke semua participants
    emitEventBroadcast(report.eventId, {
      id: notification.id,
      title,
      message,
      type: 'BROADCAST',
      eventId: report.eventId,
      category: report.category,
      createdAt: notification.createdAt
    });

    // Update report status
    await updateReportRepo(reportId, { 
      status: 'IN_PROGRESS'
    });

    res.json(baseResponse({ 
      success: true,
      data: {
        reportId: report.id,
        notificationId: notification.id,
        participantsCount: participants.length,
        severity
      },
      message: `Laporan berhasil di-broadcast ke ${participants.length} participants`
    }));
  } catch (err) {
    console.error('Broadcast report error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

/**
 * Hapus report
 */
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const { reportId } = req.params;

    const report = await findReportById(reportId);
    if (!report) {
      return res.status(404).json(errorResponse('Laporan tidak ditemukan'));
    }

    const isOrganizer = await isEventOrganizer(report.eventId, payload.userId);
    const isReporter = report.reporterId === payload.userId;

    if (!isOrganizer && !isReporter) {
      return res.status(403).json(
        errorResponse('Anda tidak memiliki akses untuk menghapus laporan ini')
      );
    }

    await deleteReportRepo(reportId);

    res.json(baseResponse({ 
      success: true,
      message: 'Laporan berhasil dihapus'
    }));
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

/**
 * Get report statistics (organizer only)
 */
export const getReportStatistics = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const { id: eventId } = req.params;

    const isOrganizer = await isEventOrganizer(eventId, payload.userId);
    if (!isOrganizer) {
      return res.status(403).json(
        errorResponse('Hanya organizer yang dapat melihat statistik')
      );
    }

    const stats = await getReportStats(eventId);

    res.json(baseResponse({ 
      success: true,
      data: stats,
      message: 'Statistik laporan event'
    }));
  } catch (err) {
    console.error('Get report statistics error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

/**
 * Get urgent reports (SECURITY yang PENDING)
 */
export const getUrgentReportsHandler = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const { id: eventId } = req.params;

    const isOrganizer = await isEventOrganizer(eventId, payload.userId);
    if (!isOrganizer) {
      return res.status(403).json(
        errorResponse('Hanya organizer yang dapat melihat urgent reports')
      );
    }

    const urgentReports = await getUrgentReports(eventId);

    res.json(baseResponse({ 
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
  } catch (err) {
    console.error('Get urgent reports error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

/**
 * Batch update report status
 */
export const batchUpdateStatus = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const { reportIds, status } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json(errorResponse('reportIds wajib berupa array'));
    }

    if (!status || !['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json(errorResponse('Status tidak valid'));
    }

    type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

    // Verify organizer access for all reports
    const reports = await prisma.report.findMany({
      where: { id: { in: reportIds } },
      select: { id: true, eventId: true }
    });

    for (const report of reports) {
      const isOrganizer = await isEventOrganizer(report.eventId, payload.userId);
      if (!isOrganizer) {
        return res.status(403).json(
          errorResponse('Anda tidak memiliki akses untuk mengupdate beberapa laporan')
        );
      }
    }

    const count = await batchUpdateReportStatus(reportIds, status as ReportStatus);

    res.json(baseResponse({ 
      success: true,
      data: { updatedCount: count },
      message: `${count} laporan berhasil diupdate ke status ${status}`
    }));
  } catch (err) {
    console.error('Batch update status error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};