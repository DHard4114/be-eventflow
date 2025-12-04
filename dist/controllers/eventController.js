"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishEvent = exports.joinEvent = exports.updateAbsensi = exports.deleteEvent = exports.updateEvent = exports.listEvents = exports.getEvent = exports.createEvent = void 0;
const eventRepository_1 = require("../repositories/eventRepository");
const eventParticipantRepository_1 = require("../repositories/eventParticipantRepository");
const baseResponse_1 = require("../utils/baseResponse");
const baseResponse_2 = require("../utils/baseResponse");
const jwt_1 = require("../utils/jwt");
const generateJoinCode_1 = require("../utils/generateJoinCode");
const socket_1 = require("../utils/socket");
const createEvent = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { name, description, startTime, endTime, locationName, latitude, longitude, } = req.body;
        if (!name ||
            !startTime ||
            !endTime ||
            !locationName ||
            !latitude ||
            !longitude) {
            return res.status(400).json((0, baseResponse_2.errorResponse)('Missing fields'));
        }
        const joinCode = (0, generateJoinCode_1.generateJoinCode)();
        const prismaEvent = await (0, eventRepository_1.createEvent)({
            name,
            description,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            locationName,
            latitude,
            longitude,
            joinCode, // Use the generated joinCode
            organizer: { connect: { id: payload.userId } },
        });
        // ORGANIZER otomatis jadi peserta event (single-record logic)
        await (0, eventParticipantRepository_1.joinOrReactivateEventParticipant)(payload.userId, prismaEvent.id);
        // Update totalParticipants di Event setelah counting
        const totalParticipants = await (0, eventParticipantRepository_1.countEventParticipants)(prismaEvent.id);
        await (0, eventRepository_1.updateEvent)(prismaEvent.id, { totalParticipants });
        const updatedEvent = await (0, eventRepository_1.findEventById)(prismaEvent.id);
        const event = {
            ...updatedEvent,
            description: updatedEvent?.description ?? undefined,
            maxParticipants: updatedEvent?.maxParticipants ?? undefined,
            totalParticipants,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: event }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.createEvent = createEvent;
const getEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const prismaEvent = await (0, eventRepository_1.findEventById)(id);
        if (!prismaEvent)
            return res.status(404).json((0, baseResponse_2.errorResponse)('Event not found'));
        const event = {
            ...prismaEvent,
            description: prismaEvent.description ?? undefined,
            maxParticipants: prismaEvent.maxParticipants ?? undefined,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: event }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.getEvent = getEvent;
const listEvents = async (req, res) => {
    try {
        const { status } = req.query;
        let prismaEvents = await (0, eventRepository_1.listEvents)();
        if (status && typeof status === 'string') {
            prismaEvents = prismaEvents.filter((e) => e.status === status);
        }
        const events = await Promise.all(prismaEvents.map(async (e) => ({
            ...e,
            description: e.description ?? undefined,
            maxParticipants: e.maxParticipants ?? undefined,
            totalParticipants: await (0, eventParticipantRepository_1.countEventParticipants)(e.id),
        })));
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: events }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.listEvents = listEvents;
const updateEvent = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { id } = req.params;
        const data = req.body;
        const prismaEvent = await (0, eventRepository_1.updateEvent)(id, data);
        // Jika status event diubah ke ONGOING/UPCOMING, organizer otomatis aktif sebagai participant
        if ((data.status === 'ONGOING' || data.status === 'UPCOMING') && prismaEvent.organizerId) {
            await (0, eventParticipantRepository_1.joinOrReactivateEventParticipant)(prismaEvent.organizerId, id);
        }
        const event = {
            ...prismaEvent,
            description: prismaEvent.description ?? undefined,
            maxParticipants: prismaEvent.maxParticipants ?? undefined,
        };
        (0, socket_1.emitEventUpdate)(id, event);
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: event }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { id } = req.params;
        await (0, eventRepository_1.deleteEvent)(id);
        res.json((0, baseResponse_1.baseResponse)({ success: true }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.deleteEvent = deleteEvent;
/**
 * Update status absensi peserta dan emit kehadiran ke semua client event
 * (Contoh endpoint: POST /events/:id/absensi)
*/
const updateAbsensi = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload)
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        const { id } = req.params;
        const { attendanceStatus } = req.body;
        if (!attendanceStatus)
            return res.status(400).json((0, baseResponse_2.errorResponse)('Status absensi kosong'));
        // Simpan status absensi di EventParticipant
        // (Implementasi update di repository sesuai skema)
        // emit ke semua client event
        const absensiPayload = {
            userId: payload.userId,
            eventId: id,
            joinedAt: new Date(),
            nodeColor: undefined,
            attendanceStatus: undefined,
        };
        (0, socket_1.emitAbsensiUpdate)(id, absensiPayload);
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: absensiPayload }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.updateAbsensi = updateAbsensi;
const joinEvent = async (req, res) => {
    try {
        // --- Auth & Input Validation ---
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload) {
            return res.status(401).json((0, baseResponse_2.errorResponse)('Unauthorized'));
        }
        const { id } = req.params;
        const { joinCode } = req.body;
        // --- Event Validation ---
        const event = await (0, eventRepository_1.findEventById)(id);
        if (!event) {
            return res.status(404).json((0, baseResponse_2.errorResponse)('Event not found'));
        }
        if (event.joinCode !== joinCode) {
            return res.status(400).json((0, baseResponse_2.errorResponse)('Invalid join code'));
        }
        // --- Participant Count Validation ---
        const { listEventParticipants } = await Promise.resolve().then(() => __importStar(require('../repositories/eventParticipantRepository')));
        const participantList = await listEventParticipants(id);
        const participantCount = participantList.length;
        if (event.maxParticipants && participantCount >= event.maxParticipants) {
            // Emit real-time notification to all clients
            // const { emitNotification } = await import('../utils/socket');
            (0, socket_1.emitNotification)({
                type: 'EVENT_FULL',
                eventId: id,
                message: 'Event sudah penuh, tidak bisa join lebih banyak peserta.',
            });
            return res.status(400).json((0, baseResponse_2.errorResponse)('Event sudah penuh'));
        }
        // --- Create/Reactivate Participant (single-record logic) ---
        await (0, eventParticipantRepository_1.joinOrReactivateEventParticipant)(payload.userId, id);
        // Update totalParticipants di Event setelah counting
        const totalParticipants = await (0, eventParticipantRepository_1.countEventParticipants)(id);
        await (0, eventRepository_1.updateEvent)(id, { totalParticipants });
        const eventAfterJoin = await (0, eventRepository_1.findEventById)(id);
        const eventResponse = {
            ...eventAfterJoin,
            description: eventAfterJoin?.description ?? undefined,
            maxParticipants: eventAfterJoin?.maxParticipants ?? undefined,
            totalParticipants,
        };
        res.json((0, baseResponse_1.baseResponse)({ success: true, data: eventResponse }));
    }
    catch (err) {
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.joinEvent = joinEvent;
/**
 * Selesaikan event: auto-unjoin semua peserta dan update status event
 */
const finishEvent = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const payload = token ? (0, jwt_1.verifyJwt)(token) : null;
        if (!payload || payload.role !== 'ORGANIZER') {
            return res.status(403).json((0, baseResponse_2.errorResponse)('Forbidden: Only organizers can finish an event.'));
        }
        const { id: eventId } = req.params;
        const event = await (0, eventRepository_1.findEventById)(eventId);
        if (!event) {
            return res.status(404).json((0, baseResponse_2.errorResponse)('Event not found'));
        }
        if (event.organizerId !== payload.userId) {
            return res.status(403).json((0, baseResponse_2.errorResponse)('Forbidden: You are not the organizer of this event.'));
        }
        // Unjoin semua peserta aktif
        const unjoinedCount = await (0, eventParticipantRepository_1.unjoinAllParticipantsByEventId)(eventId);
        // Hitung ulang total peserta aktif (harusnya 0)
        const totalParticipants = await (0, eventParticipantRepository_1.countEventParticipants)(eventId);
        // Update status event menjadi COMPLETED dan totalParticipants
        await (0, eventRepository_1.updateEvent)(eventId, { status: 'COMPLETED', totalParticipants });
        (0, socket_1.emitEventUpdate)(eventId, {
            ...event,
            status: 'COMPLETED',
            totalParticipants,
            description: event.description ?? undefined,
            maxParticipants: event.maxParticipants ?? undefined,
        });
        res.json((0, baseResponse_1.baseResponse)({ success: true, message: `Event '${event.name}' marked as completed. ${unjoinedCount} participants unjoined. Total participants: ${totalParticipants}` }));
    }
    catch (err) {
        console.error('Finish event error:', err);
        res.status(500).json((0, baseResponse_2.errorResponse)(err));
    }
};
exports.finishEvent = finishEvent;
