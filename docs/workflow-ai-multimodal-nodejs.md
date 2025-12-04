# Step-by-Step Integrasi AI API (Text, Audio, Image, Video) di Node.js

## 1. Pilih Provider & Daftar Akun
- **Text**: OpenAI, Gemini, Groq
- **Audio**: AssemblyAI, OpenAI Whisper, Google Speech-to-Text
- **Image**: Gemini Vision, Replicate, HuggingFace
- **Video**: Google Video AI, Replicate, Kapwing

## 2. Dapatkan API Key
- Login ke masing-masing provider
- Buat API key untuk setiap layanan
- Simpan API key di file `.env`:
  ```
  AI_TEXT_API_KEY=sk-xxxxxxx
  AI_AUDIO_API_KEY=xxx
  AI_IMAGE_API_KEY=xxx
  AI_VIDEO_API_KEY=xxx
  ```

## 3. Instalasi Library
```bash
npm install openai @google/generative-ai groq-sdk assemblyai @google-cloud/speech replicate dotenv
```

## 4. Setup Backend Node.js
- Buat endpoint untuk masing-masing analisis (text, audio, image, video)
- Load API key dari `.env` dengan `dotenv`

## 5. Contoh Implementasi Endpoint
### a. Text Insight (OpenAI)
```js
const { Configuration, OpenAIApi } = require('openai');
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.AI_TEXT_API_KEY }));

exports.getTextInsight = async (req, res) => {
  const { text, location } = req.body;
  const prompt = `Laporan: ${text}\nLokasi: ${location}\nBuat insight terstruktur (summary, rekomendasi, tips, warning) untuk organizer event.`;
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 512,
  });
  res.json({ insight: completion.data.choices[0].message.content });
};
```

### b. Audio Analysis (AssemblyAI)
```js
const AssemblyAI = require('assemblyai');
const aai = new AssemblyAI({ apiKey: process.env.AI_AUDIO_API_KEY });

exports.getAudioTranscript = async (req, res) => {
  // Assume audio file uploaded and accessible as req.file.path
  const transcript = await aai.transcripts.create({ audio_url: req.file.path });
  res.json({ transcript });
};
```

### c. Image Insight (Gemini Vision)
```js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.AI_IMAGE_API_KEY);

exports.getImageInsight = async (req, res) => {
  // Assume image uploaded and accessible as req.file.path
  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  const result = await model.generateContent([req.file.path]);
  res.json({ insight: result.response.text() });
};
```

### d. Video Analysis (Google Video AI)
```js
// Refer to Google Video AI docs for Node.js usage
// https://cloud.google.com/video-intelligence/docs
```

## 6. Routing & App Setup
```js
const express = require('express');
const router = express.Router();
const { getTextInsight, getAudioTranscript, getImageInsight } = require('./controllers/ai.controller');

router.post('/ai/text', getTextInsight);
router.post('/ai/audio', getAudioTranscript);
router.post('/ai/image', getImageInsight);
// router.post('/ai/video', getVideoInsight);

const app = express();
app.use(express.json());
app.use('/api', router);
app.listen(4000);
```

## 7. Workflow Kerja
1. Frontend kirim request ke endpoint `/api/ai/{tipe}` (text/audio/image/video)
2. Backend Node.js menerima request, ambil API key dari `.env`
3. Kirim data ke API provider sesuai tipe
4. Terima hasil insight/analisis dari API
5. Kirim hasil ke frontend

## 8. Tips
- Pastikan API key valid dan tidak dibagikan ke publik
- Cek limit free tier masing-masing provider
- Gunakan prompt komprehensif sesuai kebutuhan insight
- Untuk upload file (audio/gambar/video), gunakan middleware seperti `multer`

---

**Dokumentasi ini siap digunakan untuk integrasi AI generatif/analisis di Node.js, mendukung text, audio, image, dan video!**
