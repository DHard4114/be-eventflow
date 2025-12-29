/**
 * @file ai.ts
 * @module types/ai
 * @author eventFlow Team
 * @description Type definitions for AI-related entities.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */


export interface ReportAIResultInput {
  reportId: string;
  aiType: string;
  aiPayload: object;
  status: string;
  errorMsg?: string | null;
  meta?: object | null;
  createdAt?: Date;
}