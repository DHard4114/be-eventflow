/**
 * @file baseResponse.ts
 * @module types/baseResponse
 * @author eventFlow Team
 * @description Type definitions for BaseResponse structure.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */

export interface BaseResponse<T = unknown> {
  /** Status response (true jika berhasil, false jika error) */
  success: boolean;
  /** Pesan tambahan */
  message?: string;
  /** Data hasil response */
  data?: T;
  /** Pesan error jika gagal */
  error?: string;
}
