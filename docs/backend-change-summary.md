# Backend eventFlow - Change Summary

## 1. Prisma Schema & Database
- Menambah model `ImportantSpot` dan enum `SpotType` pada `prisma/schema.prisma`.
- Menambah relasi dua arah: `Event` <-> `ImportantSpot`.
- Menjalankan migrasi Prisma untuk update schema.

## 2. Repository
- Membuat `src/repositories/importantSpotRepository.ts` untuk CRUD spot penting event.

## 3. Controller
- Membuat `src/controllers/importantSpotController.ts` (fungsi ekspor, bukan class).
- Menggunakan response standar dari `baseResponse.ts`.

## 4. Routes
- Membuat `src/routes/importantSpotRoutes.ts` dengan endpoint:
  - POST `/important-spots/:eventId` (hanya ORGANIZER, create spot)
  - GET `/important-spots/event/:eventId` (list spot by event)
  - GET `/important-spots/:id` (detail spot)
  - PUT `/important-spots/update/:id` (update spot, ORGANIZER)
  - DELETE `/important-spots/:id` (delete spot, ORGANIZER)
- Memastikan tidak ada duplikat/bentrok route.

## 5. Integrasi ke Index
- Menambahkan route `/important-spots` ke `src/index.ts`.

## 6. Swagger & Test Case
- Menambah dokumentasi Swagger lengkap untuk semua endpoint spot.
- Memberikan contoh test case request/response untuk create, get, update spot.

## 7. Middleware
- Memastikan middleware `requireRole` dan `errorHandler` terpasang dan berfungsi.

## 8. Socket Real-Time
- Inisialisasi Socket.io di backend.
- Client join room event dengan eventId.
- Backend emit event real-time (misal: lokasi, notifikasi) ke room event.
- Client menerima event sesuai room yang diikuti.
- Memberikan contoh kode emit event dari controller ke client.

## 9. Validasi Struktur
- Audit seluruh repo, controller, routes, index, socket, dan middleware.
- Memastikan tidak ada duplikat, bentrok, atau error pada struktur dan endpoint.

## 10. Perubahan EventParticipant
- Memperbaiki single-record logic join/unjoin pada event participant.
- Menambah validasi dan update count peserta event secara otomatis.
- Menambah endpoint dan controller untuk history, count, dan unjoin participant.
- Menyesuaikan response dan integrasi dengan event dan spot.

## 11. Perubahan Geofence Status


**Hasil Akhir:**



## Lampiran Detail Kode yang Berubah

### 1. `prisma/schema.prisma`
- Penambahan:
  ```prisma
  model ImportantSpot {
    id           Int        @id @default(autoincrement())
    event        Event      @relation(fields: [eventId], references: [id])
    eventId      Int
    name         String
    description  String?
    latitude     Float
    longitude    Float
    spotType     SpotType
    createdAt    DateTime   @default(now())
    updatedAt    DateTime   @updatedAt
  }

  enum SpotType {
    ENTRY
    EXIT
    CHECKPOINT
    OTHER
  }
  ```

### 2. `src/repositories/importantSpotRepository.ts`
- Fungsi CRUD: `createImportantSpot`, `getImportantSpotsByEvent`, `getImportantSpotById`, `updateImportantSpot`, `deleteImportantSpot`.

### 3. `src/controllers/importantSpotController.ts`
- Fungsi ekspor:
  - `createImportantSpot`
  - `getImportantSpotsByEvent`
  - `getImportantSpotById`
  - `updateImportantSpot`
  - `deleteImportantSpot`
- Menggunakan response dari `baseResponse.ts`.

### 4. `src/routes/importantSpotRoutes.ts`
- Endpoint baru:
  - `POST /important-spots/:eventId`
  - `GET /important-spots/event/:eventId`
  - `GET /important-spots/:id`
  - `PUT /important-spots/update/:id`
  - `DELETE /important-spots/:id`
- Proteksi ORGANIZER via middleware.

### 5. `src/index.ts`
- Penambahan:
  ```ts
  import importantSpotRoutes from './routes/importantSpotRoutes';
  app.use('/important-spots', importantSpotRoutes);
  ```

### 6. `src/controllers/eventParticipantController.ts`
- Perbaikan logika single-record join/unjoin event.
- Penambahan validasi dan update count peserta event.
- Fungsi baru: `getParticipantHistory`, `getParticipantCount`, `unjoinEvent`.

### 7. Geofence Status
- Penambahan logika di controller dan repository untuk status geofence (masuk/keluar area).
- Endpoint baru untuk status geofence event/participant.
- Emit event status geofence ke client via Socket.io:
  ```ts
  io.to(`event_${eventId}`).emit('geofenceStatus', { participantId, status });
  ```

### 8. Dokumentasi & Test Case
- Penambahan Swagger untuk endpoint spot dan geofence status.
- Contoh request/response di docs dan Swagger.

---


**Catatan:**
- Semua perubahan di atas sudah di-audit, tidak ada duplikat/bentrok, dan terintegrasi dengan modul lain.

---

## Perbedaan Utama dengan Versi Sebelumnya

### 1. Geofence Status
- **Sebelumnya:**
  - Tidak ada logika atau endpoint khusus untuk status geofence event/participant.
  - Status peserta hanya berupa join/unjoin event tanpa validasi posisi terhadap spot/geofence.
  - Tidak ada event real-time terkait status geofence yang di-broadcast ke client.

- **Sekarang:**
  - Ada logika backend untuk cek posisi peserta terhadap spot penting/geofence secara real-time.
  - Status geofence (masuk/keluar area) diupdate otomatis dan tersedia via endpoint baru.
  - Event status geofence di-broadcast ke client melalui Socket.io (misal: `geofenceStatus`).
  - Dokumentasi dan contoh response status geofence tersedia di Swagger.

### 2. EventParticipant
- **Sebelumnya:**
  - Logika join/unjoin event masih memungkinkan duplikasi record participant.
  - Tidak ada validasi otomatis update count peserta event.
  - Endpoint untuk history/count/unjoin participant belum tersedia.

- **Sekarang:**
  - Logika join/unjoin event sudah single-record, tidak ada duplikasi.
  - Validasi dan update count peserta event berjalan otomatis.
  - Endpoint dan controller untuk history, count, dan unjoin participant sudah tersedia.

### 3. ImportantSpot
- **Sebelumnya:**
  - Tidak ada model, repository, controller, atau endpoint untuk spot penting event.

- **Sekarang:**
  - Tersedia model, repository, controller, dan endpoint CRUD untuk spot penting event.
  - Spot penting terintegrasi dengan event dan geofence logic.

---

**Ringkasan:**
- Fitur geofence status, spot penting, dan validasi event participant kini jauh lebih lengkap, modular, dan real-time dibandingkan versi sebelumnya.
