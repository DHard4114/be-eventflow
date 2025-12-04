"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVirtualArea = exports.updateVirtualArea = exports.createVirtualArea = exports.listVirtualAreas = exports.findVirtualAreaByEventAndId = exports.searchVirtualAreaByLocation = exports.findVirtualAreaById = exports.getUserCurrentVirtualArea = void 0;
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
const prisma_1 = require("../config/prisma");
const geo_1 = require("../utils/geo");
const cuid_1 = __importDefault(require("cuid"));
// Cek area virtual tempat user berada berdasarkan lokasi
const getUserCurrentVirtualArea = async (eventId, latitude, longitude) => {
    // Ambil semua area event sebagai GeoJSON
    const areas = await prisma_1.prisma.$queryRawUnsafe('SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE "eventId" = $1', eventId);
    for (const area of areas) {
        if (area.area) {
            const geo = JSON.parse(area.area);
            if ((0, geo_1.isLocationInsideGeofence)({ latitude, longitude }, geo.coordinates)) {
                return { id: area.id, name: area.name };
            }
        }
    }
    return null;
};
exports.getUserCurrentVirtualArea = getUserCurrentVirtualArea;
const findVirtualAreaById = async (id) => {
    const result = await prisma_1.prisma.$queryRawUnsafe('SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE id = $1 LIMIT 1', id);
    return result[0] || null;
};
exports.findVirtualAreaById = findVirtualAreaById;
const searchVirtualAreaByLocation = async (eventId, latitude, longitude) => {
    const result = await prisma_1.prisma.$queryRawUnsafe('SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE "eventId" = $1 AND ST_Contains(area, ST_SetSRID(ST_MakePoint($2, $3), 4326)) LIMIT 1', eventId, longitude, latitude);
    return result[0] || null;
};
exports.searchVirtualAreaByLocation = searchVirtualAreaByLocation;
const findVirtualAreaByEventAndId = async (eventId, areaId) => {
    const result = await prisma_1.prisma.$queryRawUnsafe('SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE "eventId" = $1 AND id = $2 LIMIT 1', eventId, areaId);
    return result[0] || null;
};
exports.findVirtualAreaByEventAndId = findVirtualAreaByEventAndId;
const listVirtualAreas = async (eventId) => {
    return prisma_1.prisma.$queryRawUnsafe('SELECT id, name, ST_AsGeoJSON(area) as area, color, "eventId" FROM "VirtualArea" WHERE "eventId" = $1', eventId);
};
exports.listVirtualAreas = listVirtualAreas;
const createVirtualArea = async (data) => {
    // Insert area sebagai geometry dari GeoJSON string
    const { name, area, color, eventId } = data;
    // Generate CUID manual agar konsisten dengan Prisma default(cuid())
    const id = (0, cuid_1.default)();
    const result = await prisma_1.prisma.$queryRawUnsafe('INSERT INTO "VirtualArea" (id, name, area, color, "eventId") VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4, $5) RETURNING id, name, ST_AsGeoJSON(area) as area, color, "eventId"', id, name, area, color, eventId);
    return result[0];
};
exports.createVirtualArea = createVirtualArea;
const updateVirtualArea = async (id, data) => {
    const { name, area, color } = data;
    let setClauses = [];
    let params = [];
    let idx = 1;
    if (name) {
        setClauses.push(`name = $${idx++}`);
        params.push(name);
    }
    if (area) {
        setClauses.push(`area = ST_GeomFromGeoJSON($${idx++})`);
        params.push(area);
    }
    if (color) {
        setClauses.push(`color = $${idx++}`);
        params.push(color);
    }
    if (setClauses.length === 0)
        throw new Error('No fields to update');
    params.push(id);
    const result = await prisma_1.prisma.$queryRawUnsafe(`UPDATE "VirtualArea" SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id, name, ST_AsGeoJSON(area) as area, color, "eventId"`, ...params);
    return result[0];
};
exports.updateVirtualArea = updateVirtualArea;
const deleteVirtualArea = async (id) => {
    const result = await prisma_1.prisma.$queryRawUnsafe('DELETE FROM "VirtualArea" WHERE id = $1 RETURNING id, name, ST_AsGeoJSON(area) as area, color, "eventId"', id);
    return result[0];
};
exports.deleteVirtualArea = deleteVirtualArea;
