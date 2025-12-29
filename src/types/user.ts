/**
 * @file user.ts
 * @module types/user
 * @author eventFlow Team
 * @description Type definitions for User entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  role: 'PARTICIPANT' | 'ORGANIZER';
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}
