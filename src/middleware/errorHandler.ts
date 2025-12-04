/**
 * File: errorHandler.ts
 * Author: eventFlow Team
 * Deskripsi: Middleware global untuk menangani error pada aplikasi Express. Mengirim response error terstruktur ke client.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Express
 */
import { Request, Response } from 'express';

// Middleware error handler
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // next: Function
) {
  console.error(err); // Log error to console
  const status = typeof err === 'object' && err && 'status' in err ? (err as { status?: number }).status || 500 : 500;
  const message = typeof err === 'object' && err && 'message' in err ? (err as { message?: string }).message || 'Internal Server Error' : 'Internal Server Error';
  res.status(status).json({
    success: false,
    error: message,
  });
}

export default errorHandler;
