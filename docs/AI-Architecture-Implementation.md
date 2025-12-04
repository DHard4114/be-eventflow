# AI Incident Analysis Feature — Real Implementation (Backend)

## 1. Data Layer
- **Database:** PostgreSQL via Prisma ORM
- **Models:**
  - Report, Event, SOP, ReportAIResult, User, Notification
- **External API:**
  - Google Places API (fasilitas terdekat)
- **ETL:**
  - Normalisasi input, validasi lokasi, cleaning text

## 2. Backend Logic
- **Report Creation:**
  - Endpoint: `POST /events/:id/reports`
  - Validasi input, cek participant, upload media
  - Simpan report ke DB
  - Emit real-time ke organizer
- **AI Insight (RAG):**
  - Service: `getGeminiIncidentAnalysis`
  - Ambil data event, reporter, lokasi, media
  - (Enhancement) Fetch fasilitas terdekat dari Google Places API
  - (Enhancement) Fetch SOP dari DB (Prisma)
  - Augment prompt Gemini dengan data retrieval
  - Kirim ke Gemini API, parsing output JSON
  - Simpan hasil ke `ReportAIResult`
- **Report Query:**
  - Endpoint: `GET /events/:id/reports` (list, filter, urgent, statistics)
  - Include relasi reporter, event, AI result

## 3. AI Service (Gemini)
- **Prompt Engineering:**
  - Prompt berisi data insiden, fasilitas terdekat, SOP, instruksi
  - Output: JSON insight, rekomendasi, meta audit
- **Multimodal:**
  - Kirim media (image) sebagai base64 ke Gemini

## 4. Evaluation & Guardrails
- **Validasi Output:**
  - Cek format JSON, relevansi, tidak berbahaya
  - Content filter pada instruksi AI
  - Audit logging setiap hasil AI
  - Organizer verifikasi sebelum broadcast
- **Metrics:**
  - Precision, recall, latency, user feedback

## 5. Example Code Snippets

### Report Creation & AI Insight (Controller)
```typescript
// ...existing code...
const report = await createReportRepo({ /* ... */ });
let aiInsight: string | null = null;
try {
  // Fetch fasilitas terdekat
  const facilitiesRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=2000&type=hospital|police|heliport&key=${process.env.GOOGLE_PLACES_API_KEY}`
  );
  const facilitiesData = await facilitiesRes.json();
  const facilities = facilitiesData.results.map((f: any) => `${f.name} (${f.vicinity})`);

  // Fetch SOP dari DB
  const sop = await prisma.sop.findMany({ where: { category } });
  const sopList = sop.map((s: any) => s.instruction);

  // Augment prompt
  aiInsight = await getGeminiIncidentAnalysis(
    eventName,
    eventDescription,
    eventLocationName,
    virtualAreaName,
    reporterName,
    reporterRole,
    category,
    description,
    latitude,
    longitude,
    mediaUrls[0],
    facilities,
    sopList
  );
  // Simpan hasil AI
  await createReportAIResult({ /* ... */ });
} catch (err) { /* ... */ }
```

### Gemini Service Enhancement
```typescript
export async function getGeminiIncidentAnalysis(
  /* ...params... */
  facilities: string[],
  sopList: string[]
): Promise<string> {
  // ...existing code...
  const prompt = [
    // ...existing prompt...
    '## FASILITAS TERDEKAT',
    ...facilities.map(f => `- ${f}`),
    '',
    '## SOP PENANGANAN',
    ...sopList.map(s => `- ${s}`),
    // ...rest of prompt...
  ].join('\n');
  // ...send to Gemini API...
}
```

### Guardrails & Audit Logging
```typescript
if (
  output.includes('berbahaya') ||
  output.length < 50 ||
  !output.includes('summary')
) {
  throw new Error('Output AI tidak valid atau berpotensi berbahaya');
}
await prisma.auditLog.create({
  data: {
    action: 'AI_ANALYSIS',
    userId: req.user.id,
    result: aiInsight,
    timestamp: new Date(),
  },
});
```

## 6. Application Integration
- **Frontend:** Dashboard web menampilkan report, insight AI, rekomendasi, fasilitas
- **Backend:** Express/Node.js, Prisma, Gemini API, Google Places API

## 7. Reflection
RAG pipeline dan validasi output AI sangat penting untuk memastikan insight yang dihasilkan benar-benar relevan, aman, dan actionable.
