# Deploy Socket.io Server ke Railway

## Masalah
Vercel tidak support WebSocket/Socket.io karena serverless architecture. Socket.io butuh persistent long-running server.

## Solusi: Deploy Socket Server Terpisah di Railway

### 1. Buat File `socket-server.ts` untuk Socket-only server

```typescript
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setSocketInstance } from './utils/socket';
import dotenv from 'dotenv';

dotenv.config();

const server = http.createServer();

const allowedOrigins = [
  process.env.SOCKET_IO_ORIGIN || '*',
  process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
].filter(Boolean);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setSocketInstance(io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on('join_event', (eventId: string) => {
    socket.join(eventId);
    console.log(`Socket ${socket.id} joined event room ${eventId}`);
  });
  
  socket.on('leave_event', (eventId: string) => {
    socket.leave(eventId);
    console.log(`Socket ${socket.id} left event room ${eventId}`);
  });
  
  socket.on('join_poll', (pollId: string) => {
    socket.join(`poll_${pollId}`);
    console.log(`Socket ${socket.id} joined poll room ${pollId}`);
  });
  
  socket.on('leave_poll', (pollId: string) => {
    socket.leave(`poll_${pollId}`);
    console.log(`Socket ${socket.id} left poll room ${pollId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 4001;
server.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
```

### 2. Update `package.json` - Add Socket Server Script

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "socket": "ts-node src/socket-server.ts",
    "socket:prod": "node dist/socket-server.js"
  }
}
```

### 3. Create `railway.toml`

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run socket:prod"
restartPolicyType = "always"

[env]
NODE_ENV = "production"
```

### 4. Deploy Steps

#### A. Deploy ke Railway (Socket Server)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Set environment variables di Railway dashboard:
# - SOCKET_IO_ORIGIN=https://your-frontend.vercel.app
# - FRONTEND_ORIGIN=https://your-frontend.vercel.app
# - DATABASE_URL=your-neon-db-url
# - JWT_SECRET=your-jwt-secret
# - PORT=4001

# Deploy
railway up
```

#### B. Vercel Config (REST API only)
Update `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "SOCKET_SERVER_URL": "https://your-app.railway.app"
  }
}
```

### 5. Update Controllers untuk Emit ke External Socket Server

Update `src/utils/socket.ts`:
```typescript
import { io as ioClient } from 'socket.io-client';

let io: SocketIOServer | null = null;
let externalSocket: any = null;

// For local development
export const setSocketInstance = (instance: SocketIOServer) => {
  io = instance;
};

// For production (Vercel → Railway)
export const connectToExternalSocket = () => {
  if (process.env.SOCKET_SERVER_URL) {
    externalSocket = ioClient(process.env.SOCKET_SERVER_URL, {
      auth: {
        serverKey: process.env.SOCKET_SERVER_KEY // Add auth for security
      }
    });
    console.log('Connected to external Socket.io server');
  }
};

export const emitLocationUpdate = (eventId: string, payload: LocationUpdatePayload) => {
  // Local development
  if (io) {
    io.to(eventId).emit('locationUpdate', payload);
  }
  // Production (emit via HTTP to Railway server)
  else if (externalSocket) {
    externalSocket.emit('server_emit', {
      room: eventId,
      event: 'locationUpdate',
      data: payload
    });
  }
};
```

### 6. Update Railway Socket Server untuk Accept Server Events

```typescript
io.on('connection', (socket) => {
  // ... existing client handlers
  
  // Handle server-to-client broadcast dari Vercel
  socket.on('server_emit', ({ room, event, data }) => {
    // Verify auth
    if (socket.handshake.auth.serverKey === process.env.SOCKET_SERVER_KEY) {
      io.to(room).emit(event, data);
    }
  });
});
```

### 7. Frontend Config

```javascript
// Connect to Railway Socket server
const socket = io('https://your-app.railway.app', {
  transports: ['websocket', 'polling']
});

// REST API calls tetap ke Vercel
const API_URL = 'https://your-api.vercel.app';
```

## Architecture Diagram

```
┌─────────────┐
│   Frontend  │
│  (Vercel)   │
└──────┬──────┘
       │
       ├────────────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  REST API   │  │  Socket.io  │
│  (Vercel)   │  │  (Railway)  │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬───────┘
                ▼
         ┌──────────────┐
         │   Database   │
         │   (Neon)     │
         └──────────────┘
```

## Alternative: Render (Easier Setup)

Deploy full backend ke Render.com:
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Create Web Service
4. Set environment variables
5. Deploy command: `npm run build && npm start`

✅ Render support WebSocket out of the box
✅ Free tier available
✅ Auto deploy on git push

## Testing

### Local:
```bash
# Terminal 1: REST API
npm run dev

# Terminal 2: Socket Server
npm run socket
```

### Production:
```bash
# REST API
curl https://your-api.vercel.app/

# Socket.io
# Test dengan Socket.io client dari browser console
```

## Environment Variables

### Railway (.env)
```
PORT=4001
SOCKET_IO_ORIGIN=https://your-frontend.vercel.app
FRONTEND_ORIGIN=https://your-frontend.vercel.app
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
SOCKET_SERVER_KEY=random-secret-key-for-auth
```

### Vercel (.env.production)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
SOCKET_SERVER_URL=https://your-app.railway.app
SOCKET_SERVER_KEY=same-random-secret-key
FRONTEND_ORIGIN=https://your-frontend.vercel.app
```

## Costs

- **Railway**: $5/month after free trial (500 hours free)
- **Render**: Free tier available (auto-sleep after inactivity)
- **Vercel**: Free for API (Hobby plan)

## Recommended: Full Deploy to Render

Paling simple: Deploy semua (REST + Socket) ke Render.com
- No need for separate servers
- WebSocket works out of the box
- Free tier available
- Easy setup

**Yang mau saya implementasikan?** 🚀
