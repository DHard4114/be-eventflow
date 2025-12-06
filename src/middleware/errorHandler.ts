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
import { Request, Response, NextFunction } from 'express';

// Middleware error handler
export function errorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  console.error(err); // Log error to console
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: message,
  });
}

export default errorHandler;