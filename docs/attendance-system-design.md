# Attendance System Design - Event Participant

## Overview
Dokumen ini menjelaskan berbagai pendekatan untuk mengimplementasikan sistem attendance (kehadiran) pada EventParticipant. Setiap pendekatan memiliki kelebihan dan kekurangan masing-masing.

---

## Current Schema
```prisma
model EventParticipant {
  id               String           @id @default(cuid())
  eventId          String
  userId           String
  attendanceStatus AttendanceStatus @default(PENDING)
  nodeColor        String?
  // ... fields lainnya
}

enum AttendanceStatus {
  PENDING    // Belum datang
  PRESENT    // Sudah hadir
  ABSENT     // Tidak hadir
}
```

---

## 🎯 Pendekatan Attendance Tracking

### **1. Geofence-Based Auto Check-in (Recommended)**
Peserta otomatis "hadir" saat masuk area event berdasarkan GPS location.

#### ✅ Kelebihan:
- **Otomatis** - Tidak perlu scan/input manual
- **Real-time** - Langsung update saat masuk area
- **UX Terbaik** - Peserta tidak perlu melakukan aksi khusus
- **Sudah ada infrastruktur** - Kita punya geofence untuk Virtual Area

#### ❌ Kekurangan:
- Bisa "diakali" jika GPS spoofing
- Perlu GPS aktif terus (battery drain)
- Tidak cocok untuk event indoor yang presisi

#### 💻 Implementation Flow:
```javascript
// Di locationController.ts saat update location
if (userInsideEventGeofence && participant.attendanceStatus === 'PENDING') {
  await eventParticipantRepository.updateAttendanceStatus(
    participantId, 
    'PRESENT'
  );
  
  // Kirim notifikasi ke organizer
  await notificationRepository.create({
    type: 'EVENT_UPDATE',
    deliveryMethod: 'INDIVIDUAL',
    recipientId: organizer.id,
    message: `${user.name} telah hadir di ${event.title}`
  });
}
```

#### 📱 API Required:
- ✅ Already exists: `POST /location/update` (sudah ada)
- ➕ New: `GET /events/:eventId/attendance-stats` (untuk organizer)

---

### **2. QR Code / Barcode Scanning**
Peserta scan QR code di lokasi event untuk check-in.

#### ✅ Kelebihan:
- **Verifikasi fisik** - Pasti di lokasi (tidak bisa GPS spoof)
- **Cepat** - Scan 1-2 detik
- **Familiar** - Banyak app pakai cara ini
- **Kontrol penuh** - Organizer tentukan titik check-in

#### ❌ Kekurangan:
- Perlu **QR code generator** di backend
- Perlu **QR scanner** di frontend (camera permission)
- Antrian jika banyak peserta datang bersamaan
- QR bisa di-screenshot dan dibagikan

#### 💻 Implementation Flow:
```javascript
// 1. Generate QR saat create event
const qrCode = generateUniqueQR(eventId);
await event.update({ checkInQR: qrCode });

// 2. Scan QR di frontend
const scannedData = await scanQRCode(); // { eventId, qrCode }

// 3. Verify dan update attendance
POST /events/:eventId/check-in
Body: { qrCode: "xyz123" }

// Backend verify:
if (event.checkInQR === qrCode && participant.attendanceStatus === 'PENDING') {
  await updateAttendanceStatus('PRESENT');
}
```

#### 📱 API Required:
- ➕ New: `POST /events/:eventId/check-in` (scan QR)
- ➕ New: `GET /events/:eventId/qr-code` (get QR image)

#### 📦 Dependencies:
```json
{
  "qrcode": "^1.5.3",              // Generate QR
  "jsqr": "^1.4.0"                 // Scan QR (frontend)
}
```

---

### **3. Manual Check-in by Organizer**
Organizer centang manual peserta yang hadir.

#### ✅ Kelebihan:
- **Paling sederhana** - Tidak perlu teknologi tambahan
- **Fleksibel** - Organizer bisa koreksi manual
- **Tidak perlu GPS/QR** - Cocok untuk event apapun

#### ❌ Kekurangan:
- Manual = prone to error
- Lambat jika peserta banyak
- Organizer bisa lupa
- Tidak real-time

#### 💻 Implementation Flow:
```javascript
// Organizer page: daftar peserta dengan toggle button
PATCH /events/:eventId/participants/:participantId
Body: { attendanceStatus: "PRESENT" }

// Middleware: requireAuth + requireEventOrganizer
```

#### 📱 API Required:
- ➕ New: `PATCH /events/:eventId/participants/:participantId` (update status)
- ➕ New: `GET /events/:eventId/participants` (list all dengan status)

---

### **4. Hybrid: Geofence + Manual Adjustment**
Kombinasi auto check-in dengan koreksi manual.

#### ✅ Kelebihan:
- Auto check-in untuk mayoritas peserta
- Manual override untuk kasus khusus (GPS error, etc)
- Best of both worlds

#### ❌ Kekurangan:
- Implementasi paling kompleks
- Perlu handle konflik (auto vs manual)

---

## 🔄 Status Transition Logic (AUTOMATIC)

### **Timeline-Based Auto Status Flow:**

```
📅 SEBELUM EVENT MULAI (Before startTime)
├─ Event Status: UPCOMING
├─ Attendance Status: PENDING (default)
└─ Auto Check-in: ❌ DISABLED

📍 SAAT EVENT BERLANGSUNG (startTime - endTime)
├─ Event Status: ONGOING
├─ Auto Check-in: ✅ ENABLED
│  └─ PENDING → PRESENT (saat masuk area geofence)
└─ Attendance Status: PENDING atau PRESENT

⏰ SETELAH EVENT SELESAI (After endTime)
├─ Trigger: POST /event-participants/process-ended-events
├─ Event Status: ONGOING/UPCOMING → COMPLETED
└─ Attendance Status: PENDING → ABSENT (auto)

🚫 EVENT DIBATALKAN (CANCELLED)
├─ Trigger: POST /event-participants/process-ended-events
├─ Event Status: CANCELLED
└─ Attendance Status: PENDING → ABSENT (auto)
```

### **Detailed Flow:**

#### 1️⃣ **Before Event Start** (`now < event.startTime`)
```javascript
// Saat user join event
attendanceStatus = 'PENDING'  // Default status
eventStatus = 'UPCOMING'      // Event belum dimulai

// User masuk area? ❌ Tidak auto check-in (event belum dimulai)
```

#### 2️⃣ **During Event** (`event.startTime <= now <= event.endTime && status === 'ONGOING'`)
```javascript
// Di locationController.ts saat update location
const userLocation = { lat, lng };
const eventGeofence = event.virtualArea;

if (isInsideGeofence(userLocation, eventGeofence)) {
  if (participant.attendanceStatus === 'PENDING' && event.status === 'ONGOING') {
    // ✅ Auto check-in
    await eventParticipantRepository.update(participantId, {
      attendanceStatus: 'PRESENT',
      checkInTime: new Date()
    });
  }
}
```

#### 3️⃣ **After Event Ends** (`now > event.endTime`)
```javascript
// Endpoint: POST /event-participants/process-ended-events
// Dipanggil oleh: External cron service atau manual trigger

async function processEndedEvents() {
  // Cari event yang baru selesai (1 jam terakhir)
  const recentlyEndedEvents = await prisma.event.findMany({
    where: {
      OR: [
        {
          // Event normal yang selesai
          endTime: { gte: oneHourAgo, lte: now },
          status: { in: ['ONGOING', 'UPCOMING'] }
        },
        {
          // Event yang dibatalkan
          status: 'CANCELLED',
          updatedAt: { gte: oneHourAgo, lte: now }
        }
      ]
    }
  });
  
  for (const event of recentlyEndedEvents) {
    // Mark semua PENDING → ABSENT
    await markPendingAsAbsent(event.id);
    
    // Update event status
    if (event.status !== 'CANCELLED') {
      await updateEventStatus(event.id, 'COMPLETED');
    }
  }
}
```

#### 4️⃣ **Event Cancelled** (Manual cancel by organizer)
```javascript
// Saat organizer cancel event
await updateEvent(eventId, { status: 'CANCELLED' });

// Lalu panggil endpoint untuk finalisasi attendance
// POST /event-participants/process-ended-events
// Akan mark semua PENDING → ABSENT
```

### **Event Status vs Attendance Behavior:**

| Event Status | Auto Check-in? | Can Mark Absent? | Description |
|--------------|----------------|------------------|-------------|
| **UPCOMING** | ❌ No | ❌ No | Event belum dimulai, attendance masih PENDING |
| **ONGOING** | ✅ Yes | ❌ No | Auto check-in aktif saat user masuk area |
| **COMPLETED** | ❌ No | ✅ Yes | Event selesai, finalisasi attendance |
| **CANCELLED** | ❌ No | ✅ Yes | Event dibatalkan, mark all as ABSENT |

### **Status Rules Summary:**

| Attendance Status | Trigger | Kondisi Event |
|-------------------|---------|---------------|
| `PENDING` | Auto saat join event | Any status |
| `PRESENT` | Auto saat masuk geofence | ONGOING only |
| `ABSENT` | Endpoint trigger | COMPLETED or CANCELLED |

### **Edge Cases:**

❓ **Bagaimana jika user terlambat tapi masih masuk area?**
- Selama event masih ONGOING dan `now <= endTime`, tetap bisa auto PRESENT
- Kalau sudah COMPLETED atau lewat `endTime`, tidak bisa auto check-in

❓ **Bagaimana jika organizer cancel event saat ONGOING?**
- Event status → CANCELLED
- Hit endpoint `process-ended-events` untuk mark PENDING → ABSENT
- Yang sudah PRESENT tetap PRESENT (ada history check-in)

❓ **Bagaimana jika GPS error atau user lupa aktifkan GPS?**
- Organizer bisa manual override via: `PATCH /:eventId/:userId/attendance`
- Atau user bisa manual check-in (jika fitur ini ditambahkan)

❓ **Bagaimana jika user keluar area lalu masuk lagi?**
- Status tetap PRESENT (tidak berubah lagi)
- Sekali PRESENT = selamanya PRESENT untuk event tersebut
- `checkInTime` tetap waktu pertama kali masuk

❓ **Bagaimana jika event di-reschedule (update startTime/endTime)?**
- Attendance status tidak terpengaruh
- Auto check-in tetap aktif sesuai waktu baru jika status ONGOING
```

---

## 📊 Attendance Report for Organizer

Organizer perlu melihat statistik kehadiran:

```javascript
GET /events/:eventId/attendance-stats

Response:
{
  "totalParticipants": 100,
  "present": 75,
  "absent": 20,
  "pending": 5,
  "attendanceRate": 75.0,
  "participants": [
    {
      "id": "xxx",
      "user": { "name": "John Doe", "email": "..." },
      "attendanceStatus": "PRESENT",
      "checkInTime": "2025-12-06T10:30:00Z"
    }
  ]
}
```

---

## 🎯 Recommendation

**Untuk MVP (Minimum Viable Product):**
1. **Geofence Auto Check-in** - Leverage existing location tracking
2. **Manual Override** - Organizer bisa koreksi jika ada error

**Untuk Full Feature:**
1. Geofence auto check-in (primary)
2. QR code scanning (alternative untuk indoor/GPS issue)
3. Manual adjustment by organizer (backup)
4. Auto mark absent via cronjob

---

## 🛠️ Implementation Checklist

### Phase 1: Basic Auto Check-in (Geofence)
- [ ] Update `locationController.ts` - tambah logic check geofence
- [ ] Update `eventParticipantRepository.ts` - tambah `updateAttendanceStatus()`
- [ ] Create `GET /events/:eventId/attendance-stats`
- [ ] Add notification saat peserta hadir
- [ ] Frontend: show "You're checked in!" notification

### Phase 2: Manual Control (Organizer)
- [ ] Create `PATCH /events/:eventId/participants/:participantId`
- [ ] Add middleware `requireEventOrganizer`
- [ ] Frontend: organizer dashboard dengan attendance list
- [ ] Frontend: toggle button untuk mark present/absent

### Phase 3: Auto Absent (Cronjob)
- [ ] Setup cronjob / scheduled task
- [ ] Implement `markAbsentForEndedEvents()`
- [ ] Add notification ke organizer tentang final attendance

### Phase 4 (Optional): QR Code
- [ ] Install QR dependencies
- [ ] Generate QR saat create event
- [ ] Create QR scan endpoint
- [ ] Frontend: QR scanner dengan camera
- [ ] Frontend: show QR code untuk organizer

---

## ❓ Questions to Decide

1. **Apakah ingin pakai GPS auto check-in?**
   - Pros: Otomatis, UX terbaik
   - Cons: Bisa diakali

2. **Perlu QR code scanning?**
   - Pros: Lebih secure, verifikasi fisik
   - Cons: Perlu dependencies tambahan, antrian

3. **Organizer bisa manual override?**
   - Recommended: YES, untuk handle edge cases

4. **Kapan auto mark ABSENT?**
   - Option A: Tepat saat event selesai
   - Option B: 1 jam setelah event selesai (grace period)

5. **Perlu track check-in time?**
   - Jika ya, tambah field `checkInTime DateTime?` di schema

---

## 📝 Schema Update (if needed)

```prisma
model EventParticipant {
  id               String           @id @default(cuid())
  eventId          String
  userId           String
  attendanceStatus AttendanceStatus @default(PENDING)
  checkInTime      DateTime?        // Waktu check-in (jika PRESENT)
  nodeColor        String?
  // ... fields lainnya
}

model Event {
  // ... existing fields
  checkInQR        String?          // QR code untuk check-in (if using QR)
}
```

---

## 🚀 Quick Start Decision Tree

```
Apakah event kamu:

📍 Outdoor dengan GPS reliable?
   → Pakai Geofence Auto Check-in

🏢 Indoor atau GPS tidak reliable?
   → Pakai QR Code Scanning

👥 Event kecil (< 50 orang)?
   → Manual Check-in by Organizer sudah cukup

🎪 Event besar dengan mixed conditions?
   → Hybrid: Geofence + QR + Manual
```

---

## 💡 Next Steps

**Silakan tentukan:**
1. Mau pakai pendekatan yang mana? (Geofence / QR / Manual / Hybrid)
2. Apakah perlu track `checkInTime`?
3. Kapan auto mark ABSENT? (immediate / grace period)

Setelah keputusan dibuat, saya siap implement! 🚀
