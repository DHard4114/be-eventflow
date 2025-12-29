
# AI Incident Analysis Feature — Architecture Canvas

## USER & USE CASE

**User story (EN):**
As an event organizer, I want an AI assistant that can analyze incident reports and provide actionable recommendations, so that I can respond quickly and accurately to emergencies.

**User story (ID):**
Sebagai organizer event, saya ingin asisten AI yang dapat menganalisis laporan insiden dan memberikan rekomendasi yang dapat langsung dilakukan, agar saya bisa merespons dengan cepat dan akurat.

**Sample queries (EN):**
- "What is the recommended response for a fire incident in area A?"
- "What nearby facilities can participants access?"
- "What evacuation instructions should be given to participants?"

**Contoh pertanyaan (ID):**
- "Apa rekomendasi penanganan untuk insiden kebakaran di area A?"
- "Fasilitas terdekat apa yang bisa diakses peserta?"
- "Bagaimana instruksi evakuasi untuk peserta?"

---

## DATA & KNOWLEDGE


**Data needed (EN):**
- Incident reports (category, description, location, media) — stored in PostgreSQL via Prisma
- Event metadata (name, location, virtual zone) — stored in PostgreSQL via Prisma
- User data (id, name, role, avatar) — stored in PostgreSQL via Prisma
- Important spots (custom locations) — stored in PostgreSQL via Prisma
- Nearby facilities (hospital, police station, helipad, etc) — fetched via Google Places API
- Incident handling SOP — stored in PostgreSQL via Prisma

**Data yang dibutuhkan (ID):**
- Laporan insiden (kategori, deskripsi, lokasi, media)
- Metadata event (nama, lokasi, zona virtual)
- Fasilitas terdekat (rumah sakit, pos polisi, helipad, dll)
- SOP penanganan insiden


**Storage/Retrieval (EN):**
- PostgreSQL (accessed via Prisma ORM) for report, event, user, important spots, SOP
- External API (Google Places API) for nearby facilities
- ETL: Data normalization, location validation, text cleaning (handled in backend service)
- (Optional) Embeddings & vector DB (pgvector) for semantic search of SOP/facilities (future)

**Penyimpanan/Pengambilan (ID):**
- PostgreSQL/Prisma untuk report, event, SOP
- API eksternal (Google Places API) untuk fasilitas terdekat
- ETL: Normalisasi data, validasi lokasi, cleaning text
- (Opsional) Embeddings & vector DB (pgvector) untuk pencarian semantik SOP/fasilitas

---

## MODELS


**Model (EN):**
- LLM API: Gemini 2.5 Flash (via @google/genai, called from backend service)
- Prompt engineering for incident analysis (prompt built in backend, includes real data)

**Model (ID):**
- LLM API: Gemini 2.5 Flash (via @google/genai)
- Prompt engineering untuk analisis insiden


**Embeddings/Fine-tuning/RAG (EN):**
- RAG pipeline: backend retrieves SOP, important spots, and facilities, then augments prompt for Gemini
- No fine-tuning needed, just prompt + RAG

**Embeddings/Fine-tuning/RAG (ID):**
- RAG pipeline: augment prompt dengan hasil retrieval data nyata (SOP, fasilitas)
- Tidak perlu fine-tuning, cukup prompt + RAG

---

## ORCHESTRATION


**Tools/Agents/Workflow (EN):**
- Express/Node.js backend exposes REST endpoints (e.g. `/analyze-report`)
- Backend retrieves report, event, user, important spots from PostgreSQL via Prisma
- Backend fetches nearby facilities from Google Places API
- Backend builds prompt and calls Gemini API
- Response parsed and sent to frontend

**Tools/Agents/Workflow (ID):**
- Function calling: `getGeminiIncidentAnalysis()`
- Workflow: frontend → backend → retrieval data → augment prompt → Gemini API → response
- (Opsional) Agent untuk multi-step reasoning jika dibutuhkan

---

## APPLICATION INTEGRATION


**Front-end → Backend (EN):**
- Web dashboard (React/Next.js) → Express/Node.js backend
- Main endpoints:
  - `POST /analyze-report` — analyze incident report with AI
  - `GET /facilities/nearby?lat=...&lng=...` — fetch nearby facilities
  - `GET /sop?category=...` — fetch SOP for incident category

**Front-end → Backend (ID):**
- Dashboard web (React/Next.js) → Express/Node.js backend
- Endpoint utama: `/analyze-report`, `/facilities/nearby`, `/sop`


**Services → AI modules (EN):**
- Backend service handles request, queries PostgreSQL via Prisma, fetches from Google Places API, augments prompt, sends to Gemini
- AI result sent to frontend for display

**Services → AI modules (ID):**
- Backend service handle request, query DB/API, augment prompt, kirim ke Gemini
- Hasil AI dikirim ke frontend untuk ditampilkan

---

## EVALUATION & GUARDRAILS


**Metrics (EN):**
- Output quality: precision, recall, recommendation relevance
- Latency: AI response time
- User feedback: rating, comments
- Test cases: output JSON validation
- Prisma logs for backend errors

**Metrik (ID):**
- Kualitas output: precision, recall, relevansi rekomendasi
- Latency: waktu respons AI
- User feedback: rating, komentar
- Test cases: validasi output JSON


**Risks & Mitigation (EN):**
- Hallucination: mitigated with RAG (real data in prompt), output validation in backend
- Privacy: limit sensitive data, audit logging (backend logs with Prisma)
- Safety: content filter, verify recommendations before broadcast

**Risiko & Mitigasi (ID):**
- Hallucination: mitigasi dengan RAG, validasi output
- Privasi: batasi data sensitif, audit logging
- Safety: content filter, verifikasi rekomendasi sebelum broadcast

**Safety rules (EN):**
- No dangerous instructions allowed
- AI output verified by organizer before sent to participant

**Aturan keamanan (ID):**
- Tidak boleh memberikan instruksi berbahaya
- Output AI diverifikasi oleh organizer sebelum dikirim ke participant

---

## IMPLEMENTATION PLAN


**Implementation Plan (EN):**
1. Data Layer:
  - Use PostgreSQL with Prisma ORM for report, event, user, important spots, SOP
  - Integrate Google Places API for nearby facilities
2. Backend Logic:
  - Create endpoint `GET /facilities/nearby?lat=...&lng=...` to fetch facilities (calls Google Places API)
  - Create endpoint `GET /sop?category=...` for SOP (fetch from PostgreSQL)
  - Create endpoint `POST /analyze-report` for AI analysis (fetches all needed data, builds prompt, calls Gemini)
  - Service `getGeminiIncidentAnalysis` augments prompt with real data (SOP, facilities, important spots)
3. AI Service:
  - Integrate Gemini API with augmented prompt (via @google/genai)
  - Parse output JSON, save to ReportAIResult table (if needed)
4. Frontend:
  - Web dashboard for report input, displaying AI insight, recommendations, facilities
5. Evaluation & Guardrails:
  - Validate AI output before broadcast (backend validation)
  - Audit logging for every recommendation sent (backend log)
  - Content filter for AI instructions (backend filter)

**Rencana Implementasi (ID):**
1. Data Layer:
  - Siapkan database PostgreSQL untuk report, event, SOP
  - Integrasi API eksternal (Google Places API) untuk fasilitas terdekat
2. Backend Logic:
  - Buat endpoint `/facilities/nearby?lat=...&lng=...` untuk fetch fasilitas
  - Buat endpoint `/sop?category=...` untuk SOP
  - Update service `getGeminiIncidentAnalysis` untuk augment prompt dengan hasil retrieval
3. AI Service:
  - Integrasi Gemini API dengan prompt yang sudah di-augment
  - Parsing output JSON, simpan ke ReportAIResult
4. Frontend:
  - Dashboard web untuk input report, menampilkan insight AI, rekomendasi, fasilitas
5. Evaluation & Guardrails:
  - Validasi output AI sebelum broadcast
  - Audit logging setiap rekomendasi yang dikirim
  - Content filter untuk instruksi AI

---

## REFLECTION

**Reflection (EN):**
The most important AI building block I need to understand better is **RAG pipelines** because they ensure AI answers are grounded in real, up-to-date knowledge and reduce hallucination risk.

**Refleksi (ID):**
Komponen AI yang paling penting untuk saya pahami lebih dalam adalah **RAG pipelines** karena memastikan jawaban AI berdasarkan pengetahuan nyata dan terkini, serta mengurangi risiko hallucination.
