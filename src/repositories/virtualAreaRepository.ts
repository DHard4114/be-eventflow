
/**
 * File: virtualAreaRepository.ts
 * Author: eventFlow Team
 * Deskripsi: Repository untuk query, pembuatan, update, dan penghapusan area virtual event di database.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-13
 * Versi: 1.0.1
 * Lisensi: MIT
 * Dependensi: Prisma
 * 
 * FIX: Tambahkan double quotes untuk column names yang case-sensitive (eventId)
*/
import { prisma } from '../config/prisma';
import { RawVirtualArea } from '../types/virtualArea';
import { isLocationInsideGeofence } from '../utils/geo';
import cuid from 'cuid';


// Cek area virtual tempat user berada berdasarkan lokasi
export const getUserCurrentVirtualArea = async (eventId: string, latitude: number, longitude: number) => {
  // Ambil semua area event sebagai GeoJSON
  const areas = await prisma.$queryRawUnsafe<RawVirtualArea[]>(
    'SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE "eventId" = $1',
    eventId
  );
  for (const area of areas) {
    if (area.area) {
      const geo = JSON.parse(area.area);
      if (isLocationInsideGeofence({ latitude, longitude }, geo.coordinates)) {
        return { id: area.id, name: area.name };
      }
    }
  }
  return null;
};

export const findVirtualAreaById = async (id: string): Promise<RawVirtualArea | null> => {
  const result = await prisma.$queryRawUnsafe<RawVirtualArea[]>(
    'SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE id = $1 LIMIT 1',
    id
  );
  return result[0] || null;
};

export const searchVirtualAreaByLocation = async (
  eventId: string,
  latitude: number,
  longitude: number
): Promise<RawVirtualArea | null> => {
  const result = await prisma.$queryRawUnsafe<RawVirtualArea[]>(
    'SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE "eventId" = $1 AND ST_Contains(area, ST_SetSRID(ST_MakePoint($2, $3), 4326)) LIMIT 1',
    eventId,
    longitude,
    latitude
  );
  return result[0] || null;
};

export const findVirtualAreaByEventAndId = async (
  eventId: string,
  areaId: string
): Promise<RawVirtualArea | null> => {
  const result = await prisma.$queryRawUnsafe<RawVirtualArea[]>(
    'SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE "eventId" = $1 AND id = $2 LIMIT 1',
    eventId,
    areaId
  );
  return result[0] || null;
};

export const listVirtualAreas = async (eventId: string): Promise<RawVirtualArea[]> => {
  return prisma.$queryRawUnsafe<RawVirtualArea[]>(
    'SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE "eventId" = $1',
    eventId
  );
};

export const createVirtualArea = async (data: { name: string; area: string; color: string; eventId: string }): Promise<RawVirtualArea> => {
  // Insert area sebagai geometry dari GeoJSON string
  const { name, area, color, eventId } = data;
  // Generate CUID manual agar konsisten dengan Prisma default(cuid())
  const id = cuid();
  const result = await prisma.$queryRawUnsafe<RawVirtualArea[]>(
    'INSERT INTO "VirtualArea" (id, name, area, color, "eventId") VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4, $5) RETURNING id, name, ST_AsGeoJSON(area) as area, color, "eventId"',
    id,
    name,
    area,
    color,
    eventId
  );
  return result[0];
};

export const updateVirtualArea = async (
  id: string,
  data: { name?: string; area?: string; color?: string }
): Promise<RawVirtualArea> => {
  const { name, area, color } = data;
  let setClauses = [];
  let params: unknown[] = [];
  let idx = 1;
  if (name) { setClauses.push(`name = $${idx++}`); params.push(name); }
  if (area) { setClauses.push(`area = ST_GeomFromGeoJSON($${idx++})`); params.push(area); }
  if (color) { setClauses.push(`color = $${idx++}`); params.push(color); }
  if (setClauses.length === 0) throw new Error('No fields to update');
  params.push(id);
  const result = await prisma.$queryRawUnsafe<RawVirtualArea[]>(
    `UPDATE "VirtualArea" SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id, name, ST_AsGeoJSON(area) as area, color, "eventId"`,
    ...params
  );
  return result[0];
};

export const deleteVirtualArea = async (id: string): Promise<RawVirtualArea> => {
  const result = await prisma.$queryRawUnsafe<RawVirtualArea[]>(
    'DELETE FROM "VirtualArea" WHERE id = $1 RETURNING id, name, ST_AsGeoJSON(area) as area, color, "eventId"',
    id
  );
  return result[0];
};