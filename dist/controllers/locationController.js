"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyLocation = exports.getEventLocations = exports.updateLocation = void 0;
const participantLocationRepository_1 = require("../repositories/participantLocationRepository");
const virtualAreaRepository_1 = require("../repositories/virtualAreaRepository");
const geo_1 = require("../utils/geo");
const socket_1 = require("../utils/socket");
const baseResponse_1 = require("../utils/baseResponse");
const baseResponse_2 = require("../utils/baseResponse");
const jwt_1 = require("../utils/jwt");
// import { emitNotification } from '../utils/socket';
// Update participant location (POST /events/:eventId/location)
const updateLocation = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { eventId } = req.params;
        const { latitude, longitude } = req.body;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json((0, baseResponse_2.errorResponse)('Invalid coordinates'));
        }
        // --- Geofence Logic ---
        // 1. Ambil semua area virtual event
        const areas = await (0, virtualAreaRepository_1.listVirtualAreas)(eventId);
        // 2. Cek apakah lokasi user di dalam area
        const isInside = areas.some(area => {
            try {
                return (0, geo_1.isLocationInsideGeofence)({ latitude, longitude }, JSON.parse(area.area).coordinates);
            }
            catch {
                return false;
            }
        });
        const status = isInside ? 'INSIDE' : 'OUTSIDE';
        // 3. Ambil status sebelumnya
        const prevLocation = await (0, participantLocationRepository_1.findParticipantLocation)(payload.userId, eventId);
        const prevStatus = prevLocation?.lastGeofenceStatus;
        // 4. Jika keluar zona, trigger alert
        if (prevStatus === 'INSIDE' && status === 'OUTSIDE') {
            (0, socket_1.emitGeofenceEvent)(eventId, {
                userId: payload.userId,
                status: 'outside', // sesuai tipe GeofencePayload
                timestamp: new Date(),
            });
            // TODO: Buat notifikasi SECURITY_ALERT ke organizer di sini jika ada sistem notifikasi
        }
        // 5. Simpan lokasi dan status baru
        const location = await (0, participantLocationRepository_1.upsertParticipantLocation)(payload.userId, eventId, latitude, longitude, status // <-- simpan status baru
        );
        // Map ParticipantLocation to EventParticipant for socket emit
        const locationPayload = {
            userId: payload.userId,
            eventId,
            joinedAt: new Date(),
            nodeColor: undefined,
            attendanceStatus: undefined,
        };
        (0, socket_1.emitLocationUpdate)(eventId, locationPayload);
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: { location, geofenceStatus: status } }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.updateLocation = updateLocation;
// Get all participant locations for an event (GET /events/:eventId/locations)
const getEventLocations = async (req, res) => {
    try {
        const { eventId } = req.params;
        const locations = await (0, participantLocationRepository_1.listParticipantLocations)(eventId);
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: locations }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.getEventLocations = getEventLocations;
// Get location for current user in event (GET /events/:eventId/location/me)
const getMyLocation = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { eventId } = req.params;
        const location = await (0, participantLocationRepository_1.findParticipantLocation)(payload.userId, eventId);
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: location }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.getMyLocation = getMyLocation;
