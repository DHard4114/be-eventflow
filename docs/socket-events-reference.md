# Socket.io Events Quick Reference

## Connection Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: 'your-jwt-token' }
});

// Join event room
socket.emit('join_event', eventId);

// Leave event room
socket.emit('leave_event', eventId);
```

## Available Events

### 📍 Location Tracking

#### `locationUpdate`
Real-time participant location updates
```typescript
{
  userId: string;
  eventId: string;
  latitude: number;
  longitude: number;
  geofenceStatus: 'INSIDE' | 'OUTSIDE';
  updatedAt: Date;
  user?: { id: string; name: string; avatarUrl?: string; };
}
```

#### `geofenceEvent`
Enter/exit virtual area detection
```typescript
{
  userId: string;
  status: 'inside' | 'outside';
  timestamp: Date;
}
```

### ✅ Attendance

#### `absensiUpdate`
Attendance status changes
```typescript
{
  userId: string;
  eventId: string;
  attendanceStatus: 'PENDING' | 'PRESENT' | 'ABSENT';
  checkInTime?: Date;
}
```

### 📢 Notifications

#### `notification`
General notifications to users
```typescript
{
  id: string;
  title: string;
  message: string;
  type: 'GENERAL' | 'EVENT_UPDATE' | 'SECURITY_ALERT' | 'REPORT_FEEDBACK';
  eventId?: string;
  createdAt: Date;
}
```

#### `eventBroadcast`
Broadcast announcements to all participants
```typescript
{
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  eventId: string;
  category?: string;
  createdAt: Date;
}
```

### 📝 Event Management

#### `eventUpdate`
Event details changed
```typescript
{
  id: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  // ... other event fields
}
```

### 💬 Chat

#### `chatMessage`
New chat message in event
```typescript
{
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  message: string;
  createdAt: Date;
}
```

### 📊 Polling

#### `pollCreated`
New poll created
```typescript
{
  pollId: string;
  question: string;
  options: Array<{ id: string; text: string; votes: number; }>;
  eventId: string;
  createdAt: Date;
}
```

#### `votingUpdate`
Poll results updated after vote
```typescript
{
  pollId: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    percentage?: number;
  }>;
  totalVotes: number;
  userVoted?: string | null;
}
```

#### `pollDeleted`
Poll removed
```typescript
{
  pollId: string;
  eventId: string;
}
```

### 🚨 Reports

#### `liveReport`
New incident report submitted
```typescript
{
  reportId: string;
  userId: string;
  message: string;
  mediaUrl?: string;
  createdAt: Date;
}
```

## React Hooks Example

```javascript
import { useEffect } from 'react';
import io from 'socket.io-client';

function useSocket(eventId) {
  useEffect(() => {
    const socket = io('http://localhost:4000');
    
    socket.emit('join_event', eventId);
    
    socket.on('locationUpdate', handleLocationUpdate);
    socket.on('notification', handleNotification);
    socket.on('chatMessage', handleChatMessage);
    socket.on('votingUpdate', handleVotingUpdate);
    
    return () => {
      socket.emit('leave_event', eventId);
      socket.off('locationUpdate');
      socket.off('notification');
      socket.off('chatMessage');
      socket.off('votingUpdate');
      socket.disconnect();
    };
  }, [eventId]);
}
```

## Event Constants

```typescript
export const SOCKET_EVENTS = {
  LOCATION_UPDATED: 'locationUpdate',
  ABSENSI_UPDATED: 'absensiUpdate',
  GEOFENCE_EVENT: 'geofenceEvent',
  EVENT_UPDATED: 'eventUpdate',
  VOTE_UPDATED: 'votingUpdate',
  POLL_CREATED: 'pollCreated',
  POLL_DELETED: 'pollDeleted',
  CHAT_MESSAGE: 'chatMessage',
  LIVE_REPORT: 'liveReport',
  EVENT_BROADCAST: 'eventBroadcast',
  NOTIFICATION: 'notification',
} as const;
```

## Room Management

### Join Event Room
```javascript
socket.emit('join_event', eventId);
```

### Leave Event Room
```javascript
socket.emit('leave_event', eventId);
```

### Join Poll Room (for specific poll updates)
```javascript
socket.emit('join_poll', pollId);
```

### Leave Poll Room
```javascript
socket.emit('leave_poll', pollId);
```

## Best Practices

1. **Always join event room** before listening to events
2. **Clean up listeners** on component unmount
3. **Handle reconnection** logic for mobile apps
4. **Throttle frequent updates** (location, etc.)
5. **Display connection status** to users
6. **Handle errors gracefully**

## Documentation

- [Location Update Details](./socket-location-update.md)
- [Full API Documentation](./api-contract.md)
