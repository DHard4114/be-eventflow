/**
 * @file device.ts
 * @module types/device
 * @author eventFlow Team
 * @description Type definitions for Device entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface Device {
  id: string;
  pushToken: string;
  lastLoginAt: Date;
  userId: string;
}
