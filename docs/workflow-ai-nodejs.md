# Workflow Integrasi AI Generatif (OpenAI/Groq) di Node.js

## 1. Daftar Akun & Dapatkan API Key
- **OpenAI**: https://platform.openai.com/signup
- **Groq**: https://groq.com/ (daftar dan dapatkan API key jika tersedia)

## 2. Instalasi Library
```bash
npm install openai groq-sdk dotenv
```

## 3. Setup Environment Variable
Buat file `.env` di root project:
```
OPENAI_API_KEY=sk-xxxxxxx
GROQ_API_KEY=gsk-xxxxxxx
```

## 4. Contoh Implementasi Endpoint Insight (Node.js)

### a. OpenAI (GPT-3.5-turbo)
```js
// src/controllers/insight.controller.js
const { Configuration, OpenAIApi } = require('openai');
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

exports.getInsight = async (req, res) => {
  const { text, location } = req.body;
  const prompt = `Anda adalah asisten AI event yang sangat ahli dalam analisis laporan dan gambar.
Laporan Kejadian:
${text}
Lokasi:
${location}

Jika tersedia gambar, analisis juga gambar tersebut (deskripsikan isi, deteksi objek, dan potensi bahaya).

Buat insight terstruktur dan actionable untuk organizer event:
1. Summary: Ringkas inti laporan dan gambar secara jelas dan singkat.
2. Recommendation: Rekomendasi tindakan nyata yang harus dilakukan oleh organizer/peserta.
3. Tips: Saran praktis yang relevan dengan lokasi, situasi, dan isi gambar.
4. Warning: Jika ada potensi bahaya dari laporan/gambar, berikan peringatan khusus.

Jawab dengan format di atas, gunakan bahasa Indonesia yang mudah dipahami dan langsung ke inti masalah. Jika tidak ada gambar, fokus pada analisis teks.`;
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
    });
    res.json({ insight: completion.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### b. Groq (Llama3/Gemma)
```js
// src/controllers/insight.controller.js
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.getInsight = async (req, res) => {
  const { text, location } = req.body;
  const prompt = `Laporan: ${text}\nLokasi: ${location}\nBuat insight terstruktur (summary, rekomendasi, tips, warning) untuk organizer event.`;
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192', // atau model lain yang aktif
      temperature: 0.3,
      max_tokens: 1024,
    });
    res.json({ insight: chatCompletion.choices[0]?.message?.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

## 4c. Gemini (Google Generative AI)
Install library:
```bash
npm install @google/generative-ai dotenv
```

Contoh implementasi:
```js
// src/controllers/insight.controller.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.getInsight = async (req, res) => {
  const { text, location } = req.body;
  const prompt = `Laporan: ${text}\nLokasi: ${location}\nBuat insight terstruktur (summary, rekomendasi, tips, warning) untuk organizer event.`;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    res.json({ insight: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

Tambahkan ke file `.env`:
```
GEMINI_API_KEY=AIzaSy...
```

## 5. Routing
```js
// src/routes/insight.routes.js
const express = require('express');
const router = express.Router();
const { getInsight } = require('../controllers/insight.controller');

router.post('/insight', getInsight);
module.exports = router;
```

## 6. Integrasi ke App
```js
// src/app.js
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const insightRoutes = require('./routes/insight.routes');
app.use('/api', insightRoutes);

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
```

## 7. Testing
- Kirim POST ke `/api/insight` dengan body `{ "text": "...", "location": "..." }`
- Response: insight generatif dari OpenAI/Groq

## 8. Catatan
- Free tier API ada limit harian/bulanan.
- Jangan commit API key ke repo publik.
- Bisa ganti prompt sesuai kebutuhan insight/report.

---

**Workflow ini siap dipakai untuk insight AI generatif di Node.js menggunakan OpenAI atau Groq.**
