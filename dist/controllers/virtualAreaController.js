"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVirtualArea = exports.updateVirtualArea = exports.searchVirtualAreaByLocation = exports.getVirtualAreaById = exports.getVirtualAreas = exports.createVirtualArea = exports.getCurrentVirtualArea = void 0;
;
const prisma_1 = require("../config/prisma");
const virtualAreaRepository_1 = require("../repositories/virtualAreaRepository");
const baseResponse_1 = require("../utils/baseResponse");
const baseResponse_2 = require("../utils/baseResponse");
const jwt_1 = require("../utils/jwt");
// Endpoint: GET /events/:eventId/virtual-area/current?lat=...&lng=...
const getCurrentVirtualArea = async (req, res) => {
    try {
        const { eventId } = req.params;
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = payload.userId;
        if (!eventId || !userId) {
            return res.status(400).json({ success: false, message: 'eventId dan userId wajib diisi' });
        }
        // Ambil lokasi user dari ParticipantLocation
        const { prisma } = require('../config/prisma');
        const location = await prisma.participantLocation.findUnique({ where: { userId_eventId: { userId, eventId } } });
        if (!location) {
            return res.status(404).json({ success: false, message: 'Lokasi user tidak ditemukan' });
        }
        const area = await (0, virtualAreaRepository_1.getUserCurrentVirtualArea)(eventId, location.latitude, location.longitude);
        return res.json({ success: true, data: area, message: area ? 'User berada di area virtual' : 'User di luar area virtual' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Unknown error' });
    }
};
exports.getCurrentVirtualArea = getCurrentVirtualArea;
const createVirtualArea = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { eventId } = req.params;
        const { name, area, color } = req.body;
        if (!name || !area || !color)
            return res.status(400).json((0, baseResponse_2.errorResponse)('Missing fields'));
        // Pastikan area dikirim sebagai GeoJSON Polygon string
        if (!area.type || area.type !== 'Polygon' || !Array.isArray(area.coordinates)) {
            return res.status(400).json((0, baseResponse_2.errorResponse)('Area must be valid GeoJSON Polygon'));
        }
        // Cek eventId valid
        const event = await prisma_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event) {
            return res.status(400).json((0, baseResponse_2.errorResponse)('Event tidak ditemukan'));
        }
        const created = await (0, virtualAreaRepository_1.createVirtualArea)({
            name,
            area: JSON.stringify(area), // Kirim sebagai string GeoJSON
            color,
            eventId
        });
        // area hasil dari repo diasumsikan string GeoJSON
        const virtualArea = {
            id: created.id,
            name: created.name,
            area: created.area ? (typeof created.area === 'string' ? JSON.parse(created.area) : created.area) : null,
            color: created.color,
            eventId: created.eventId,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: virtualArea }));
    }
    catch (err) {
        console.error('Create VirtualArea error:', err);
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.createVirtualArea = createVirtualArea;
const getVirtualAreas = async (req, res) => {
    try {
        const { eventId } = req.params;
        const repoAreas = await (0, virtualAreaRepository_1.listVirtualAreas)(eventId);
        // Diasumsikan repo sudah mengembalikan area sebagai string GeoJSON
        const areas = repoAreas.map(a => ({
            id: a.id,
            name: a.name,
            area: a.area ? (typeof a.area === 'string' ? JSON.parse(a.area) : a.area) : null,
            color: a.color,
            eventId: a.eventId,
        }));
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: areas }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.getVirtualAreas = getVirtualAreas;
const getVirtualAreaById = async (req, res) => {
    try {
        const { eventId, areaId } = req.params;
        const area = await (0, virtualAreaRepository_1.findVirtualAreaByEventAndId)(eventId, areaId);
        if (!area) {
            return res.status(404).json((0, baseResponse_2.errorResponse)('Area not found'));
        }
        const result = {
            id: area.id,
            name: area.name,
            area: area.area ? (typeof area.area === 'string' ? JSON.parse(area.area) : area.area) : null,
            color: area.color,
            eventId: area.eventId,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: result }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.getVirtualAreaById = getVirtualAreaById;
const searchVirtualAreaByLocation = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { latitude, longitude } = req.query;
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json((0, baseResponse_2.errorResponse)('Invalid latitude/longitude'));
        }
        const area = await (0, virtualAreaRepository_1.searchVirtualAreaByLocation)(eventId, lat, lon);
        if (!area) {
            return res.status(404).json((0, baseResponse_2.errorResponse)('No area contains this location'));
        }
        // area.area diasumsikan string GeoJSON
        const result = {
            id: area.id,
            name: area.name,
            area: area.area ? (typeof area.area === 'string' ? JSON.parse(area.area) : area.area) : null,
            color: area.color,
            eventId: area.eventId,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: result }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.searchVirtualAreaByLocation = searchVirtualAreaByLocation;
const updateVirtualArea = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { areaId } = req.params;
        const data = req.body;
        let updateData = { ...data };
        if (data.area) {
            if (!data.area.type || data.area.type !== 'Polygon' || !Array.isArray(data.area.coordinates)) {
                return res.status(400).json((0, baseResponse_2.errorResponse)('Area must be valid GeoJSON Polygon'));
            }
            updateData.area = JSON.stringify(data.area);
        }
        const updated = await (0, virtualAreaRepository_1.updateVirtualArea)(areaId, updateData);
        const virtualArea = {
            id: updated.id,
            name: updated.name,
            area: updated.area ? (typeof updated.area === 'string' ? JSON.parse(updated.area) : updated.area) : null,
            color: updated.color,
            eventId: updated.eventId,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: virtualArea }));
    }
    catch (err) {
        console.error('Update VirtualArea error:', err);
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.updateVirtualArea = updateVirtualArea;
const deleteVirtualArea = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { areaId } = req.params;
        await (0, virtualAreaRepository_1.deleteVirtualArea)(areaId);
        res.json((0, baseResponse_1.baseResponse)({ success: true }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.deleteVirtualArea = deleteVirtualArea;
