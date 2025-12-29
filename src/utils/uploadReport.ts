/**
 * @file uploadReport.ts
 * @module utils/uploadReport
 * @author eventFlow Team
 * @description Utility untuk upload file laporan ke folder uploads/reports.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency multer, path, fs
 */
import multer from 'multer';
import path from 'path';






const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `report-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const uploadReport = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'audio/mpeg',
      'audio/wav'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Jenis file tidak didukung. Hanya gambar, video, dan audio yang diperbolehkan.'));
    }
  }
});
