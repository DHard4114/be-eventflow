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
  mediaUrl: string | null,
  importantSpots: Array<{
    id: string;
    name: string;
    type: string;
    customType: string | null;
    latitude: number;
    longitude: number;
  }>
): Promise<string> {
  try {
    // Calculate distances to nearby spots
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // Earth radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in meters
    };

    const nearbySpotsInfo = importantSpots
      .map(spot => ({
        ...spot,
        distance: calculateDistance(latitude, longitude, spot.latitude, spot.longitude)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5) // Get 5 nearest spots
      .map(spot => `${spot.name} (${spot.type}${spot.customType ? ': ' + spot.customType : ''}) - ${Math.round(spot.distance)}m`)
      .join(', ');

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
      '## NEARBY IMPORTANT SPOTS',
      `Available Spots: ${nearbySpotsInfo || 'No important spots registered yet'}`,
      'CATATAN: Gunakan informasi spot ini untuk memberikan rekomendasi yang relevan!',
      '',
      '## INCIDENT REPORT (Input Data)',
      `Reporter Name: ${reporterName} (Role: ${reporterRole})`,
      `Category: ${category}`,
      `Description: ${description}`,
      `Coordinate: ${latitude}, ${longitude}`,
      mediaUrl ? `Media URL: ${mediaUrl}` : 'Media: Not provided (text-only report)',
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
      '- PENTING: Analisis jarak dan relevansi dengan important spots terdekat.',
      '',
      mediaUrl ? '3. Visual/Media Verification:' : '3. Text-Based Analysis:',
      mediaUrl ? '- PENTING: Analisis gambar/media yang disertakan.' : '- Analisis berdasarkan deskripsi teks yang diberikan.',
      mediaUrl ? '- Deteksi objek, kondisi visual, suasana dalam gambar.' : '- Ekstrak detail penting dari deskripsi.',
      mediaUrl ? '- Validasi apakah gambar sesuai dengan deskripsi laporan.' : '- Identifikasi kata kunci terkait bahaya atau urgensi.',
      mediaUrl ? '- Deteksi anomali (senjata, api, cuaca buruk, kerumunan panik, kerusakan).' : '- Evaluasi kredibilitas berdasarkan konsistensi deskripsi.',
      mediaUrl ? '- Cocokkan kondisi visual dengan lokasi koordinat.' : '',
      '',
      '4. Strategic Response (Actionable):',
      '- Participant: Instruksi singkat, padat, menenangkan (maks 2 kalimat, imperative).',
      '- Organizer: Rekomendasi teknis berdasarkan analisis ' + (mediaUrl ? 'visual dan ' : '') + 'lokasi.',
      '- PENTING: Jika ada spot relevan (SHELTER, HOSPITAL, EXIT_GATE, INFO_CENTER, dll), SEBUTKAN NAMA SPOT TERSEBUT dalam rekomendasi!',
      '',
      '## OUTPUT FORMAT (Strict JSON)',
      'Hanya berikan output JSON mentah tanpa markdown formatting agar bisa diparsing langsung oleh backend JSON.parse().',
      '',
      '{',
      '  "summary": "Ringkasan insiden satu kalimat padat",',
      '  "severity": "CRITICAL|HIGH|MEDIUM|LOW",',
      '  "riskAnalysis": "Analisis detail risiko berdasarkan ' + (mediaUrl ? 'teks dan gambar' : 'teks') + '",',
      '  "locationAnalysis": "Analisis lokasi koordinat dan jarak ke spot penting",',
      mediaUrl ? '  "mediaValidation": "Hasil analisis VISUAL dari gambar yang disertakan",' : '  "textAnalysis": "Analisis mendalam dari deskripsi teks",',
      '  "recommendedSpots": ["Nama Spot 1", "Nama Spot 2"],',
      '  "actions": {',
      '    "participant": "Instruksi langsung untuk user (SEBUTKAN nama spot jika relevan)",',
      '    "organizer": "Rekomendasi taktis untuk panitia (SEBUTKAN nama spot jika relevan)"',
      '  },',
      '  "tags": ["Tag1", "Tag2", "Tag3"]',
      '}',
      '',
      mediaUrl ? 'PENTING: Analisis gambar yang disertakan secara detail dan cocokkan dengan deskripsi!' : 'PENTING: Fokus pada analisis teks yang mendalam dan berikan rekomendasi spot yang relevan!'
    ].join('\n');

    // Multimodal: Text + Image (inlineData) atau Text-only
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