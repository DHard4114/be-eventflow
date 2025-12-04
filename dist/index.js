"use strict";
/**
 * File: index.ts
 * Author: eventFlow Team
 * Deskripsi: Entry point utama backend eventFlow. Inisialisasi Express, Socket.io, Swagger, dan semua route API.
 * Dibuat: 2025-11-11
 * Terakhir Diubah: 2025-11-11
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Express, Socket.io, Swagger, Prisma
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const eventParticipantRoutes_1 = __importDefault(require("./routes/eventParticipantRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const virtualAreaRoutes_1 = __importDefault(require("./routes/virtualAreaRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const userNotificationRoutes_1 = __importDefault(require("./routes/userNotificationRoutes"));
const deviceRoutes_1 = __importDefault(require("./routes/deviceRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const pollRoutes_1 = __importDefault(require("./routes/pollRoutes"));
const reportAIResultRoutes_1 = __importDefault(require("./routes/reportAIResultRoutes"));
const importantSpotRoutes_1 = __importDefault(require("./routes/importantSpotRoutes"));
const socket_1 = require("./utils/socket");
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const cors_1 = __importDefault(require("cors"));
console.log('EventFlow backend starting...');
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Middleware log semua request
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type']
}));
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.env.SOCKET_IO_ORIGIN,
        methods: ['GET', 'POST']
    }
});
(0, socket_1.setSocketInstance)(io);
app.use(express_1.default.json());
// Swagger UI endpoint
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    customCss: '.swagger-ui .topbar { display: none }', // opsional: hide topbar
    customSiteTitle: 'eventFlow API Docs',
}));
app.get('/', (req, res) => {
    res.send('EventFlow backend is running!');
});
app.use('/auths', authRoutes_1.default);
app.use('/users', userRoutes_1.default);
app.use('/events', eventRoutes_1.default);
app.use('/event-participants', eventParticipantRoutes_1.default);
app.use('/notifications', notificationRoutes_1.default);
app.use('/user-notifications', userNotificationRoutes_1.default);
app.use('/reports', reportRoutes_1.default);
app.use('/reports-ai', reportAIResultRoutes_1.default);
app.use('/virtual-area', virtualAreaRoutes_1.default);
app.use('/locations', locationRoutes_1.default);
app.use('/chats', chatRoutes_1.default);
app.use('/polls', pollRoutes_1.default);
app.use('/devices', deviceRoutes_1.default);
app.use('/important-spots', importantSpotRoutes_1.default);
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    // Client mengirim event 'joinEventRoom' dengan eventId
    socket.on('joinEventRoom', (eventId) => {
        socket.join(eventId);
        console.log(`Socket ${socket.id} joined event room ${eventId}`);
    });
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});
// Error handler middleware (harus di paling akhir)
app.use(errorHandler_1.errorHandler);
const PORT = env_1.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
