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

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import eventRoutes from './routes/eventRoutes';
import eventParticipantRoutes from './routes/eventParticipantRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import virtualAreaRoutes from './routes/virtualAreaRoutes';
import locationRoutes from './routes/locationRoutes';
import userNotificationRoutes from './routes/userNotificationRoutes';
import deviceRoutes from './routes/deviceRoutes';
import chatRoutes from './routes/chatRoutes';
import pollRoutes from './routes/pollRoutes';
import reportAIResultRoutes from './routes/reportAIResultRoutes';
import importantSpotRoutes from './routes/importantSpotRoutes';
import { setSocketInstance } from './utils/socket';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import cors from 'cors';



console.log('EventFlow backend starting...');
const app = express();
const server = http.createServer(app);

// Middleware log semua request
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));

const io = new SocketIOServer(server, {
  cors: {
    origin: env.SOCKET_IO_ORIGIN,
    methods: ['GET', 'POST']
  }
});
setSocketInstance(io);


app.use(express.json());

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }', // opsional: hide topbar
  customSiteTitle: 'eventFlow API Docs',
}));

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('EventFlow backend is running!');
});

app.use('/auths', authRoutes);
app.use('/users', userRoutes);
app.use('/events', eventRoutes);
app.use('/event-participants', eventParticipantRoutes);
app.use('/notifications', notificationRoutes);
app.use('/user-notifications', userNotificationRoutes);
app.use('/reports', reportRoutes);
app.use('/reports-ai', reportAIResultRoutes);
app.use('/virtual-area', virtualAreaRoutes);
app.use('/locations', locationRoutes);
app.use('/chats', chatRoutes);
app.use('/polls', pollRoutes);
app.use('/devices', deviceRoutes);
app.use('/important-spots', importantSpotRoutes);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  // Client mengirim event 'joinEventRoom' dengan eventId
  socket.on('joinEventRoom', (eventId: string) => {
    socket.join(eventId);
    console.log(`Socket ${socket.id} joined event room ${eventId}`);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Error handler middleware (harus di paling akhir)
app.use(errorHandler);

const PORT = env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
