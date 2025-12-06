# Notification Receiver Display with Organizer Exclusion

## Overview
Enhanced notification system to display receiver information for INDIVIDUAL notifications and exclude organizers from participant lists across the application.

## Changes Made

### 1. Notification Repository (`src/repositories/notificationRepository.ts`)
**Updated**: `listNotifications` function

```typescript
export const listNotifications = async (eventId: string) => {
  return prisma.notification.findMany({ 
    where: { eventId },
    include: {
      userNotifications: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });
};
```

**Purpose**: Include userNotifications with user details (id, name, email, avatarUrl) to display receivers.

---

### 2. Notification Controller (`src/controllers/notificationController.ts`)

#### Updated: `getEventNotifications` function
```typescript
export const getEventNotifications = async (req: Request, res: Response, next: Function) => {
  try {
    const { id: eventId } = req.params;
    if (!eventId) return res.status(400).json(errorResponse('eventId wajib diisi'));
    
    // Get event to find organizer
    const event = await findEventById(eventId);
    if (!event) return res.status(404).json(errorResponse('Event not found'));
    
    const notifications = await listNotifications(eventId);
    
    // Transform response to include receiver field and exclude organizer
    const transformedNotifications = notifications.map((notif: any) => {
      const { userNotifications, ...rest } = notif;
      
      // Filter out organizer from receivers
      const receivers = userNotifications
        .map((un: any) => un.user)
        .filter((user: any) => user.id !== event.organizerId);
      
      return {
        ...rest,
        receiver: notif.deliveryMethod === 'INDIVIDUAL' ? receivers : undefined
      };
    });
    
    res.json(baseResponse({ success: true, data: transformedNotifications }));
  } catch (err) {
    next(err);
  }
};
```

**Purpose**: 
- Transform response to include `receiver` field for INDIVIDUAL notifications
- Filter out organizer from receiver list
- Only show receiver field for INDIVIDUAL deliveryMethod

#### Updated: `createBroadcast` function
```typescript
// Get all participants (exclude organizer)
const participants = await prisma.eventParticipant.findMany({ 
  where: { 
    eventId,
    userId: { not: event.organizerId }
  } 
});
```

**Purpose**: Exclude organizer when broadcasting notifications to participants.

---

### 3. Report Controller (`src/controllers/reportController.ts`)

#### Updated: `broadcastReport` function
```typescript
// Get event to find organizer ID
const event = await prisma.event.findUnique({
  where: { id: report.eventId }
});
if (!event) {
  return res.status(404).json(errorResponse('Event tidak ditemukan'));
}

// Get all participants (exclude organizer)
const participants = await prisma.eventParticipant.findMany({
  where: { 
    eventId: report.eventId,
    userId: { not: event.organizerId }
  },
  include: { user: true }
});
```

**Purpose**: Exclude organizer when broadcasting reports to participants.

---

### 4. Event Participant Repository (`src/repositories/eventParticipantRepository.ts`)

#### Updated: `listEventParticipants` function
```typescript
export const listEventParticipants = async (
  eventId: string,
  excludeOrganizer: boolean = false
): Promise<EventParticipant[]> => {
  if (excludeOrganizer) {
    // Get event to find organizer ID
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    if (!event) return [];
    
    return prisma.eventParticipant.findMany({
      where: { 
        eventId, 
        isActive: true,
        userId: { not: event.organizerId }
      },
      include: { user: true } 
    });
  }
  
  return prisma.eventParticipant.findMany({
    where: { eventId, isActive: true },
    include: { user: true } 
  });
};
```

**Purpose**: 
- Add optional `excludeOrganizer` parameter (default: false)
- When true, filter out organizer from participant list
- Maintains backward compatibility with existing calls

---

### 5. Event Participant Controller (`src/controllers/eventParticipantController.ts`)

#### Updated: `listParticipants` function
```typescript
export const listParticipants = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const participants = await listEventParticipants(eventId, true); // Exclude organizer
    res.json(baseResponse({ success: true, data: participants }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
```

**Purpose**: Exclude organizer when displaying participant list in UI.

---

## API Response Examples

### Get Event Notifications
**Endpoint**: `GET /api/notifications/event/:eventId`

**Response for INDIVIDUAL notification**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "title": "Security Alert",
      "message": "Please evacuate the area",
      "type": "SECURITY_ALERT",
      "category": "SECURITY",
      "deliveryMethod": "INDIVIDUAL",
      "eventId": "event-456",
      "createdAt": "2025-01-15T10:30:00Z",
      "receiver": [
        {
          "id": "user-789",
          "name": "John Doe",
          "email": "john@example.com",
          "avatarUrl": "https://example.com/avatar.jpg"
        }
      ]
    }
  ]
}
```

**Response for BROADCAST notification**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-124",
      "title": "Event Update",
      "message": "Event will start in 30 minutes",
      "type": "EVENT_UPDATE",
      "deliveryMethod": "BROADCAST",
      "eventId": "event-456",
      "createdAt": "2025-01-15T10:35:00Z",
      "receiver": undefined
    }
  ]
}
```

---

## Benefits

1. **Better UX**: Users can see who received individual notifications
2. **Organizer Exclusion**: Organizers are properly excluded from participant lists throughout the app
3. **Consistency**: All notification and participant queries now follow the same pattern
4. **Backward Compatibility**: Repository changes maintain existing behavior with optional parameters

---

## Areas Updated

- ✅ Notification display with receiver information
- ✅ Notification broadcasting (general)
- ✅ Report broadcasting
- ✅ Participant listing endpoint
- ✅ Repository layer with optional organizer exclusion

---

## Testing Checklist

- [ ] Verify INDIVIDUAL notifications show receiver field with user details
- [ ] Verify BROADCAST notifications don't show receiver field
- [ ] Verify organizer is not in participant list when listing participants
- [ ] Verify organizer doesn't receive broadcast notifications
- [ ] Verify organizer doesn't receive report broadcast
- [ ] Verify existing functionality (join count, attendance) still works correctly
