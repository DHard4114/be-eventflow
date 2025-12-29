/**
 * @file baseResponse.ts
 * @module utils/baseResponse
 * @author eventFlow Team
 * @description Utility untuk membentuk response API standar (success, error, data) agar konsisten di seluruh aplikasi.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency -
 */
import { BaseResponse } from '../types/baseResponse';

export function baseResponse<T>(params: {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}): BaseResponse<T> {
  return {
    success: params.success,
    message: params.message,
    data: params.data,
    error: params.error
  };
}

export function errorResponse(error: unknown): BaseResponse<never> {
  let errorMsg = 'Internal server error';
  if (typeof error === 'object' && error && 'error' in error) {
    errorMsg = (error as { error: string }).error;
  }
  return baseResponse({ success: false, error: errorMsg });
}
