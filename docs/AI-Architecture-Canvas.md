
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
- Incident reports (category, description, location, media)
- Event metadata (name, location, virtual zone)
- Nearby facilities (hospital, police station, helipad, etc)
- Incident handling SOP

**Data yang dibutuhkan (ID):**
- Laporan insiden (kategori, deskripsi, lokasi, media)
- Metadata event (nama, lokasi, zona virtual)
- Fasilitas terdekat (rumah sakit, pos polisi, helipad, dll)
- SOP penanganan insiden

**Storage/Retrieval (EN):**
- PostgreSQL/Prisma for report, event, SOP
- External API (Google Places API) for nearby facilities
- ETL: Data normalization, location validation, text cleaning
- (Optional) Embeddings & vector DB (pgvector) for semantic search of SOP/facilities

**Penyimpanan/Pengambilan (ID):**
- PostgreSQL/Prisma untuk report, event, SOP
- API eksternal (Google Places API) untuk fasilitas terdekat
- ETL: Normalisasi data, validasi lokasi, cleaning text
- (Opsional) Embeddings & vector DB (pgvector) untuk pencarian semantik SOP/fasilitas

---

## MODELS

**Model (EN):**
- LLM API: Gemini 2.5 Flash (via @google/genai)
- Prompt engineering for incident analysis

**Model (ID):**
- LLM API: Gemini 2.5 Flash (via @google/genai)
- Prompt engineering untuk analisis insiden

**Embeddings/Fine-tuning/RAG (EN):**
- RAG pipeline: augment prompt with real data retrieval (SOP, facilities)
- No fine-tuning needed, just prompt + RAG

**Embeddings/Fine-tuning/RAG (ID):**
- RAG pipeline: augment prompt dengan hasil retrieval data nyata (SOP, fasilitas)
- Tidak perlu fine-tuning, cukup prompt + RAG

---

## ORCHESTRATION

**Tools/Agents/Workflow (EN):**
- Function calling: `getGeminiIncidentAnalysis()`
- Workflow: frontend → backend → data retrieval → augment prompt → Gemini API → response
- (Optional) Agent for multi-step reasoning if needed

**Tools/Agents/Workflow (ID):**
- Function calling: `getGeminiIncidentAnalysis()`
- Workflow: frontend → backend → retrieval data → augment prompt → Gemini API → response
- (Opsional) Agent untuk multi-step reasoning jika dibutuhkan

---

## APPLICATION INTEGRATION

**Front-end → Backend (EN):**
- Web dashboard (React/Next.js) → Express/Node.js backend
- Main endpoints: `/analyze-report`, `/facilities/nearby`, `/sop`

**Front-end → Backend (ID):**
- Dashboard web (React/Next.js) → Express/Node.js backend
- Endpoint utama: `/analyze-report`, `/facilities/nearby`, `/sop`

**Services → AI modules (EN):**
- Backend service handles request, queries DB/API, augments prompt, sends to Gemini
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

**Metrik (ID):**
- Kualitas output: precision, recall, relevansi rekomendasi
- Latency: waktu respons AI
- User feedback: rating, komentar
- Test cases: validasi output JSON

**Risks & Mitigation (EN):**
- Hallucination: mitigated with RAG, output validation
- Privacy: limit sensitive data, audit logging
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
  - Prepare PostgreSQL database for report, event, SOP
  - Integrate external API (Google Places API) for nearby facilities
2. Backend Logic:
  - Create endpoint `/facilities/nearby?lat=...&lng=...` to fetch facilities
  - Create endpoint `/sop?category=...` for SOP
  - Update service `getGeminiIncidentAnalysis` to augment prompt with retrieval results
3. AI Service:
  - Integrate Gemini API with augmented prompt
  - Parse output JSON, save to ReportAIResult
4. Frontend:
  - Web dashboard for report input, displaying AI insight, recommendations, facilities
5. Evaluation & Guardrails:
  - Validate AI output before broadcast
  - Audit logging for every recommendation sent
  - Content filter for AI instructions

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
