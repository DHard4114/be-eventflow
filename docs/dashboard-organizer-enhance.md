# Dashboard Organizer Enhancement

## Fitur Khusus Dashboard Web
- Login sebagai organizer (akses dashboard web, bukan app mobile)
- Manajemen event dan laporan secara real-time
- Statistik dan audit hanya bisa diakses via dashboard web
- Batch update status laporan (checkbox + aksi massal)
- Export data laporan (CSV/Excel)
- Notifikasi real-time khusus organizer

### Contoh Alur Login Organizer (Web Only)
1. Organizer mengakses dashboard web melalui URL khusus.
2. Login menggunakan email dan password organizer.
3. Setelah login, hanya organizer yang bisa melihat statistik, urgent report, dan fitur manajemen event.
4. Fitur ini tidak tersedia di aplikasi mobile, hanya di dashboard web.


## Fitur Utama
- Statistik laporan event (summary, kategori, tren)
- Laporan urgent (SECURITY, status PENDING)
- Detail laporan & insight AI
- Meta audit hasil AI
- Batch update status laporan
- Notifikasi real-time

## Endpoint Backend
- `GET /reports/{eventId}/statistics` — Statistik laporan event
- `GET /reports/{eventId}/urgent` — Laporan urgent
- `GET /reports/{eventId}` — List laporan (dengan filter)
- `GET /reports/{eventId}/{reportId}` — Detail laporan
- `GET /reports/{eventId}/export` — Export data laporan (opsional)
- `POST /reports/batch-update` — Batch update status

## Rekomendasi UI/UX
- Tampilkan summary statistik (total, kategori, tren harian/mingguan)
- Highlight laporan urgent di bagian atas
- Tampilkan insight AI dan meta audit pada detail laporan
- Sediakan filter laporan (kategori, status, waktu)
- Fitur export data (CSV/Excel)
- Notifikasi real-time untuk laporan baru/urgent
- Batch update status laporan (checkbox + aksi massal)

## Meta Audit
- Tampilkan data meta dari ReportAIResult:
  - Model AI
  - Waktu eksekusi
  - Media URL
  - Versi prompt
  - Kategori, lokasi, eventId, reporterId

## Saran Pengembangan Lanjutan
- Grafik tren laporan (chart)
- Log aktivitas (audit trail)
- Integrasi notifikasi push/email
- Dashboard mobile-friendly

---

> Dokumentasi ini untuk pengembangan dan optimalisasi dashboard organizer berbasis web, agar monitoring dan penanganan laporan event lebih efisien dan informatif.
