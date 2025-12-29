/**
 * @file report.ts
 * @module types/report
 * @author eventFlow Team
 * @description Type definitions for Report entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface Report {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  reporterId: string;
  eventId: string;
  createdAt: Date;
  mediaUrls?: string[];
}
