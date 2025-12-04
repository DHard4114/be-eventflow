# Report AI Flow - eventFlow Backend

## Overview
Dokumen ini menjelaskan alur proses laporan (report) dengan integrasi AI (teks, gambar, audio) pada backend eventFlow, sesuai endpoint asli sistem.

---

## Flow Proses Report

### 1. Participant Submit Report
- **Endpoint:** `POST /reports/events/:id`
- **Proses:**
  - User mengisi form: kategori, deskripsi, lokasi, upload media (foto/video/audio).
  - Backend menerima request, simpan data dan file media.

### 2. Backend Analisis AI
- Setelah report tersimpan:
  - **Teks:** Deskripsi dikirim ke AI lokal (IndoBERT) via service di `src/ai/text/textService.ts`.
  - **Gambar:** Jika ada gambar, file dikirim ke AI lokal (YOLO/MobileNet) via `src/ai/image/imageService.ts`.
  - **Audio:** Jika ada audio, file dikirim ke AI lokal (Whisper/Vosk) via `src/ai/audio/audioService.ts`.
- Hasil analisis AI disimpan di tabel `ReportAIResult`.

### 3. Organizer Mendapatkan Notifikasi Real-Time
- Organizer event menerima notifikasi report baru (via socket).
- Data yang diterima: data report + hasil AI.

### 4. Organizer Melihat Daftar Report
- **Endpoint:** `GET /reports/events/:id/reports`
- Organizer bisa melihat semua report event beserta hasil AI.

### 5. Organizer Melihat Statistik
- **Endpoint:** `GET /reports/events/:id/statistics`
- Dashboard statistik laporan event, bisa include insight dari AI.

### 6. Organizer Melihat Laporan Urgent
- **Endpoint:** `GET /reports/events/:id/urgent`
- Laporan urgent (kategori SECURITY, status PENDING), bisa diprioritaskan berdasarkan hasil AI.

### 7. Organizer Update Status Report
- **Endpoint:** `PATCH /reports/:reportId/status`
- Organizer update status dan catatan, bisa berdasarkan insight AI.

### 8. Organizer Broadcast Laporan Penting
- **Endpoint:** `POST /reports/:reportId/broadcast`
- Broadcast laporan ke semua participant, bisa include hasil AI.

### 9. Batch Update Status
- **Endpoint:** `PATCH /reports/batch-update`
- Organizer update status banyak report sekaligus.

### 10. Hapus Laporan
- **Endpoint:** `DELETE /reports/:reportId`
- Organizer atau pembuat report bisa menghapus laporan.

---

## Ringkasan Flow
1. User submit report (POST /reports/events/:id)
2. Backend simpan data, analisis AI (teks/gambar/audio)
3. Simpan hasil AI ke database
4. Organizer dapat notifikasi real-time
5. Organizer akses report, statistik, urgent, update status, broadcast, batch update, hapus

---

## Catatan
- Semua proses AI dilakukan secara modular dan scalable.
- Hasil AI dapat digunakan untuk insight, prioritas, dan automasi pada sistem laporan event.
