/**
 * Analisis insiden event secara mendalam dan komprehensif (NLP, geospasial, media) menggunakan Gemini 2.5 Flash
 * Output: JSON siap simpan ke ReportAIResult
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API as string,
});

export async function getGeminiIncidentAnalysis(
  eventName: string,
  eventDescription: string,
  eventLocationName: string,
  virtualAreaName: string,
  reporterName: string,
  reporterRole: string,
  category: string,
  description: string,
  latitude: number,
  longitude: number,
  mediaUrl: string
): Promise<string> {
  try {
    const prompt = [
      '# EVENTFLOW INCIDENT ANALYSIS REQUEST',
      '',
      'Lakukan analisis mendalam terhadap insiden berikut untuk menghasilkan data JSON yang akan disimpan ke dalam sistem ReportAIResult.',
      '',
      '## CONTEXT (Event Data)',
      `Event Name: ${eventName}`,
      `Event Type/Desc: ${eventDescription}`,
      `Base Location: ${eventLocationName}`,
      `Geofence/Zone Status: ${virtualAreaName}`,
      '',
      '## INCIDENT REPORT (Input Data)',
      `Reporter Name: ${reporterName} (Role: ${reporterRole})`,
      `Category: ${category}`,
      `Description: ${description}`,
      `Coordinate: ${latitude}, ${longitude}`,
      `Media URL: ${mediaUrl}`,
      '',
      '## ANALYSIS TASKS',
      '1. Contextual Severity Assessment:',
      '- Analisis tingkat bahaya berdasarkan Jenis Event.',
      '- Tentukan urgensi: CRITICAL / HIGH / MEDIUM / LOW.',
      '',
      '2. Geospatial & Environmental Analysis:',
      '- Analisis koordinat Lat/Long terhadap lokasi event.',
      '- Jika event alam: analisis cuaca, medan, isolasi sinyal.',
      '- Jika event urban: analisis bottleneck, rute evakuasi, pos medis.',
      '',
      '3. Visual/Media Verification:',
      '- PENTING: Analisis gambar/media yang disertakan.',
      '- Deteksi objek, kondisi visual, suasana dalam gambar.',
      '- Validasi apakah gambar sesuai dengan deskripsi laporan.',
      '- Deteksi anomali (senjata, api, cuaca buruk, kerumunan panik, kerusakan).',
      '- Cocokkan kondisi visual dengan lokasi koordinat.',
      '',
      '4. Strategic Response (Actionable):',
      '- Participant: Instruksi singkat, padat, menenangkan (maks 2 kalimat, imperative).',
      '- Organizer: Rekomendasi teknis berdasarkan analisis visual dan lokasi.',
      '',
      '## OUTPUT FORMAT (Strict JSON)',
      'Hanya berikan output JSON mentah tanpa markdown formatting agar bisa diparsing langsung oleh backend JSON.parse().',
      '',
      '{',
      '  "summary": "Ringkasan insiden satu kalimat padat",',
      '  "severity": "CRITICAL|HIGH|MEDIUM|LOW",',
      '  "riskAnalysis": "Analisis detail risiko berdasarkan teks dan gambar",',
      '  "locationAnalysis": "Analisis lokasi koordinat",',
      '  "mediaValidation": "Hasil analisis VISUAL dari gambar yang disertakan",',
      '  "actions": {',
      '    "participant": "Instruksi langsung untuk user",',
      '    "organizer": "Rekomendasi taktis untuk panitia"',
      '  },',
      '  "tags": ["Tag1", "Tag2", "Tag3"]',
      '}',
      '',
      'PENTING: Analisis gambar yang disertakan secara detail dan cocokkan dengan deskripsi!'
    ].join('\n');

    // Multimodal: Text + Image (inlineData)
    // Fetch image from URL and convert to base64
    let base64ImageData = '';
    if (mediaUrl) {
      try {
        const res = await fetch(mediaUrl);
        const imageArrayBuffer = await res.arrayBuffer();
        base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');
      } catch (imgErr) {
        console.error('Gagal fetch/convert gambar:', imgErr);
      }
    }

    const contents = [];
    if (base64ImageData) {
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64ImageData,
        },
      });
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    return response.text ?? '';
    
  } catch (err: unknown) {
    console.error('Gemini API error:', err);
    throw new Error('Gagal mendapatkan insight dari Gemini API');
  }
}