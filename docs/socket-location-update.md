# Real-Time Location Update Socket Documentation

## Overview
Implementasi real-time location tracking menggunakan Socket.io untuk menampilkan posisi participant di peta secara live.

## Socket Event: `locationUpdate`

### Event Name
`SOCKET_EVENTS.LOCATION_UPDATED` = `'locationUpdate'`

### Trigger
Event ini di-emit setiap kali participant update lokasi mereka via API endpoint:
```
POST /api/events/:eventId/location
```

### Payload Structure

```typescript
interface LocationUpdatePayload {
  userId: string;              // ID user yang update lokasi
  eventId: string;             // ID event
  latitude: number;            // Koordinat latitude
  longitude: number;           // Koordinat longitude
  geofenceStatus: 'INSIDE' | 'OUTSIDE';  // Status dalam/luar zona
  updatedAt: Date;             // Timestamp update
  user?: {                     // Info user (optional)
    id: string;
    name: string;
    avatarUrl?: string;
  };
}
```

### Example Payload

```json
{
  "userId": "user-123",
  "eventId": "event-456",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "geofenceStatus": "INSIDE",
  "updatedAt": "2025-12-07T10:30:00.000Z",
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

## Frontend Implementation

### 1. Connect to Socket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join event room untuk terima updates
socket.emit('join_event', eventId);
```

### 2. Listen to Location Updates

```javascript
socket.on('locationUpdate', (payload) => {
  console.log('Location update received:', payload);
  
  // Update marker di peta
  updateMarkerPosition(payload.userId, {
    lat: payload.latitude,
    lng: payload.longitude
  });
  
  // Update geofence status indicator
  updateGeofenceStatus(payload.userId, payload.geofenceStatus);
  
  // Update user list
  if (payload.user) {
    updateUserList(payload.user);
  }
});
```

### 3. React Example with Google Maps

```jsx
import { useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import io from 'socket.io-client';

function LiveLocationMap({ eventId }) {
  const [participants, setParticipants] = useState({});
  
  useEffect(() => {
    const socket = io('http://localhost:4000');
    
    // Join event room
    socket.emit('join_event', eventId);
    
    // Listen for location updates
    socket.on('locationUpdate', (payload) => {
      setParticipants(prev => ({
        ...prev,
        [payload.userId]: {
          position: {
            lat: payload.latitude,
            lng: payload.longitude
          },
          name: payload.user?.name,
          avatarUrl: payload.user?.avatarUrl,
          status: payload.geofenceStatus,
          updatedAt: payload.updatedAt
        }
      }));
    });
    
    return () => {
      socket.emit('leave_event', eventId);
      socket.disconnect();
    };
  }, [eventId]);
  
  return (
    <GoogleMap
      zoom={15}
      center={{ lat: -6.2088, lng: 106.8456 }}
    >
      {Object.entries(participants).map(([userId, data]) => (
        <Marker
          key={userId}
          position={data.position}
          label={data.name}
          icon={{
            url: data.avatarUrl || '/default-avatar.png',
            scaledSize: new google.maps.Size(40, 40)
          }}
        />
      ))}
    </GoogleMap>
  );
}
```

### 4. Update Location from Mobile

```javascript
// Mobile app - Send location updates
navigator.geolocation.watchPosition(
  async (position) => {
    const { latitude, longitude } = position.coords;
    
    await fetch(`/api/events/${eventId}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ latitude, longitude })
    });
    
    // Socket akan emit ke semua participants
  },
  (error) => console.error(error),
  {
    enableHighAccuracy: true,
    distanceFilter: 10,  // Update every 10 meters
    interval: 5000       // Update every 5 seconds
  }
);
```

## Features

### ✅ Auto Check-in
- Ketika participant masuk zona saat event `ONGOING`
- Status attendance otomatis berubah `PENDING` → `PRESENT`
- Check-in time dicatat

### ✅ Geofence Detection
- Real-time detection masuk/keluar zona
- Status: `INSIDE` atau `OUTSIDE`
- Trigger `geofenceEvent` saat keluar zona

### ✅ Live Tracking
- Update posisi real-time di peta
- Tampilkan avatar dan nama participant
- Status zona (inside/outside)

## Related Events

### `geofenceEvent`
Di-emit saat participant keluar dari zona:
```typescript
{
  userId: string;
  status: 'outside';
  timestamp: Date;
}
```

## Performance Tips

1. **Throttle Updates**: Jangan update terlalu sering (min 5 detik interval)
2. **Distance Filter**: Update hanya jika bergerak > 10 meter
3. **Room Management**: Pastikan join/leave event room dengan benar
4. **Memory Management**: Clean up socket listeners saat unmount component

## Testing

```bash
# Test location update endpoint
curl -X POST http://localhost:4000/api/events/event-123/location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -6.2088,
    "longitude": 106.8456
  }'
```

## Troubleshooting

### Location tidak update di peta
- ✅ Check socket connection status
- ✅ Verify user sudah join event room
- ✅ Check console untuk error messages

### Marker tidak muncul
- ✅ Verify coordinates valid (latitude/longitude format)
- ✅ Check map bounds includes the coordinates
- ✅ Verify user data ada di payload

### Auto check-in tidak jalan
- ✅ Event status harus `ONGOING`
- ✅ Current time harus antara `startTime` dan `endTime`
- ✅ Participant attendance status harus `PENDING`
- ✅ Lokasi harus di dalam virtual area

## API Reference

### POST `/api/events/:eventId/location`
Update participant location

**Request Body:**
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "id": "loc-123",
      "userId": "user-456",
      "eventId": "event-789",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "lastGeofenceStatus": "INSIDE",
      "updatedAt": "2025-12-07T10:30:00.000Z"
    },
    "geofenceStatus": "INSIDE"
  }
}
```

## Version History

- **v1.2.0** (2025-12-07): Enhanced location update with full user info and geofence status
- **v1.1.0** (2025-11-11): Added auto check-in feature
- **v1.0.0** (2025-11-10): Initial location tracking implementation
