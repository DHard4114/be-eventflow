/**
 * @file virtualArea.ts
 * @module types/virtualArea
 * @author eventFlow Team
 * @description Type definitions for VirtualArea entity.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */


export type RawVirtualArea = {
  id: string;
  name: string;
  area: string; // GeoJSON string
  color: string;
  eventId: string;
};