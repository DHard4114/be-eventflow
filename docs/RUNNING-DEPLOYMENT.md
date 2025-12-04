# Panduan Menjalankan & Deploy Backend Eventflow

## 1. Menjalankan Backend Secara Lokal

### Prasyarat
- Node.js v18+
- PostgreSQL (Neon, Railway, atau lokal)
- Prisma CLI
- File `.env` berisi konfigurasi DB & API Key

### Langkah
1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Migrasi database:
   ```bash
   npx prisma migrate dev
   ```
4. Jalankan server:
   ```bash
   npm run dev
   ```

## 2. Deploy ke Railway

### Langkah
1. Push project ke GitHub.
2. Buat project baru di Railway, hubungkan ke repo.
3. Set environment variable (DB, API Key) di Railway dashboard.
4. Railway otomatis build & deploy (gunakan script `npm run build` dan `npm start`).
5. Pastikan file `.env` tidak ikut di repo (sudah di .gitignore).

## 3. Deploy ke Vercel (API Only)

> Vercel cocok untuk serverless API (Express/Next.js API routes). Untuk full backend, Railway lebih direkomendasikan.

### Langkah
1. Push project ke GitHub.
2. Buat project baru di Vercel, hubungkan ke repo.
3. Set environment variable di dashboard Vercel.
4. Pastikan entry point API di `api/` atau gunakan adapter (misal: `vercel.json` untuk Express).
5. Vercel otomatis build & deploy.

## 4. Catatan Penting
- Jangan commit file `.env` ke repo.
- Untuk deploy, pastikan DB sudah accessible dari Railway/Vercel.
- Untuk Prisma, gunakan database URL dari Railway/Neon.
- Untuk Gemini API, simpan key di environment variable.

---

> Untuk pertanyaan lebih lanjut, cek README.md atau hubungi developer.
