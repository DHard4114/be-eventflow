/**
 * @file jwtPayload.ts
 * @module types/jwtPayload
 * @author eventFlow Team
 * @description Type definitions for JWT payload structure.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface JWTPayload {
  userId: string;
  email?: string;
  role?: 'PARTICIPANT' | 'ORGANIZER';
  // Tambahkan field lain jika diperlukan
}
