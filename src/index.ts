
/**
 * @file index.ts
 * @module index
 * @author eventFlow Team
 * @description Main entry point for eventFlow backend. Initializes Express, Socket.io, Swagger, and all API routes.
 * @created 2025-11-11
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, Socket.io, Swagger, Prisma
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

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

const allowedOrigins = [
  env.SOCKET_IO_ORIGIN,
  env.FRONTEND_ORIGIN
].filter(Boolean);
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true
}));

const io = new SocketIOServer(server, {
  cors: {
    origin: env.SOCKET_IO_ORIGIN,
    methods: ['GET', 'POST']
  }
});
setSocketInstance(io);


app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
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
  socket.on('joinEventRoom', (eventId: string) => {
    socket.join(eventId);
    console.log(`Socket ${socket.id} joined event room ${eventId}`);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.use(errorHandler);

export default app;

if (!process.env.VERCEL) {
  const PORT = env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
