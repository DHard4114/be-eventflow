/**
 * Analisis insiden event secara mendalam dan komprehensif (NLP, geospasial, media) menggunakan Gemini 2.5 Flash
 * Output: JSON siap simpan ke ReportAIResult dengan analisis super detail dan actionable
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
    const prompt = `
# EVENTFLOW COMPREHENSIVE INCIDENT ANALYSIS SYSTEM

Anda adalah AI Expert Analyst untuk sistem manajemen insiden event. Tugas Anda adalah melakukan analisis SANGAT MENDALAM, DETAIL, dan ACTIONABLE terhadap laporan insiden berikut.

═══════════════════════════════════════════════════════════════════════════════

## KONTEKS EVENT

**Nama Event:** ${eventName}
**Deskripsi Event:** ${eventDescription}
**Lokasi Base Event:** ${eventLocationName}
**Zona/Geofence:** ${virtualAreaName}

═══════════════════════════════════════════════════════════════════════════════

## DATA INSIDEN YANG DILAPORKAN

**Pelapor:** ${reporterName}
**Role Pelapor:** ${reporterRole}
**Kategori Insiden:** ${category}
**Deskripsi Lengkap:** ${description}
**Koordinat GPS:** ${latitude}, ${longitude}
**Bukti Visual/Media:** ${mediaUrl}
**Waktu Laporan:** Real-time (saat ini)

═══════════════════════════════════════════════════════════════════════════════

## INSTRUKSI ANALISIS MENDALAM

### 1 SEVERITY ASSESSMENT (Penilaian Tingkat Bahaya)

Analisis dengan sangat detail:
- **Tingkat Urgensi:** CRITICAL / HIGH / MEDIUM / LOW
- **Justifikasi:** Jelaskan MENGAPA Anda memilih level tersebut berdasarkan:
  * Jenis event (outdoor/indoor, risiko tinggi/rendah)
  * Kategori insiden (SECURITY > CROWD > FACILITY > OTHER)
  * Kondisi visual dari gambar (ada korban? kerusakan? bahaya?)
  * Potensi eskalasi (apakah bisa memburuk?)
  * Jumlah orang terancam
  * Waktu golden period untuk penanganan
- **Risiko Sekunder:** Identifikasi bahaya lanjutan yang mungkin timbul
- **Impact Radius:** Perkirakan berapa meter/km area terdampak

### 2 VISUAL ANALYSIS (Analisis Gambar/Media Mendalam)

**WAJIB menganalisis gambar yang disertakan dengan sangat detail:**

a) **Deteksi Objek & Kondisi:**
   - Identifikasi SEMUA objek penting dalam gambar
   - Deteksi orang (berapa orang? posisi? kondisi fisik?)
   - Deteksi bahaya visual (api, asap, benda tajam, kerusakan struktural, cuaca ekstrem)
   - Kondisi lingkungan (gelap/terang, cuaca, medan)
   - Peralatan safety yang ada/tidak ada
   - Tanda-tanda panik atau ketenangan

b) **Validasi Konsistensi:**
   - Apakah gambar SESUAI dengan deskripsi text?
   - Apakah kondisi visual mendukung atau bertentangan dengan laporan?
   - Apakah ada detail dalam gambar yang tidak disebutkan dalam deskripsi?
   - Deteksi potensi false report atau exaggeration

c) **Mood & Atmosphere Analysis:**
   - Tingkat kepanikan dalam gambar (tenang/panik/chaos)
   - Body language korban/saksi
   - Kondisi psikologis yang terlihat

d) **Anomaly Detection:**
   - Senjata, api, banjir, longsor, kecelakaan
   - Kerumunan padat berbahaya
   - Infrastruktur rusak
   - Kondisi medis darurat (darah, cedera, pingsan)

### 3 GEOSPATIAL & ENVIRONMENTAL ANALYSIS (Analisis Lokasi Detail)

**Berdasarkan koordinat ${latitude}, ${longitude}:**

a) **Identifikasi Area:**
   - Nama area spesifik (kecamatan, desa, landmark terdekat)
   - Jenis medan (hutan, pantai, perkotaan, gunung, padang rumput)
   - Ketinggian (altitude) jika relevan
   - Karakteristik topografi (datar, menanjak, terjal)

b) **Aksesibilitas:**
   - Jarak dari jalan utama/akses kendaraan
   - Estimasi waktu tempuh ambulans/tim rescue
   - Jalur evakuasi terdekat
   - Hambatan geografis (sungai, jurang, hutan lebat)

c) **Fasilitas Terdekat (PENTING):**
   - Rumah sakit/klinik terdekat (nama, jarak, estimasi waktu)
   - Pos medis event (jika ada)
   - Kantor polisi/pos keamanan terdekat
   - Helipad atau area untuk evakuasi udara
   - Base camp atau safe zone terdekat
   - Area dengan sinyal komunikasi stabil
   - Sumber air bersih
   - Shelter atau tempat berlindung

d) **Kondisi Lingkungan:**
   - Cuaca saat ini dan prediksi (jika outdoor event)
   - Suhu udara dan risiko hipotermia/heatstroke
   - Visibilitas (siang/malam, kabut, hujan)
   - Risiko alam (petir, longsor, banjir bandang)

e) **Connectivity:**
   - Kualitas sinyal seluler di area tersebut
   - Coverage operator yang tersedia
   - Alternatif komunikasi (radio, satellite phone)

### 4 RISK ANALYSIS (Analisis Risiko Komprehensif)

**Primary Risks (Risiko Utama):**
- Jelaskan risiko langsung yang sedang terjadi
- Potensi korban dan tingkat keparahan
- Ancaman terhadap keselamatan jiwa

**Secondary Risks (Risiko Turunan):**
- Bahaya yang mungkin muncul sebagai efek domino
- Contoh: Cedera → Hipotermia (jika malam/dingin)
- Contoh: Kebakaran → Asap → Sesak nafas
- Contoh: Kerumunan panik → Stampede

**Environmental Risks (Risiko Lingkungan):**
- Medan berbahaya (tebing, sungai deras, hutan)
- Hewan liar (jika di alam)
- Cuaca ekstrem

**Medical Risks (Risiko Medis):**
- Potensi perdarahan, patah tulang, syok
- Risiko infeksi jika luka terbuka
- Dehidrasi, kelelahan ekstrem

**Logistical Risks (Risiko Logistik):**
- Kesulitan evakuasi
- Keterbatasan alat medis di lokasi
- Komunikasi terputus

### 5 RESOURCE & FACILITY RECOMMENDATION (Rekomendasi Sumber Daya)

**Personnel Needed (SDM yang Dibutuhkan):**
- Tim medis (dokter, paramedis, P3K)
- Tim SAR (jika outdoor/terpencil)
- Security/polisi (jika SECURITY incident)
- Psikolog (jika trauma/panic attack)
- Koordinator lapangan

**Equipment Needed (Peralatan Diperlukan):**
- Medis: Stretcher, P3K, defibrilator, oksigen
- Safety: Helm, rompi, senter, radio HT
- Evakuasi: Tandu, tali, harness (jika gunung/jurang)
- Support: Generator, lampu darurat, tenda medis

**Transportation (Transportasi):**
- Ambulans (jarak dan ETA)
- Helikopter medis (jika CRITICAL dan terpencil)
- Kendaraan off-road (jika medan sulit)
- Boat (jika area perairan)

### 6 EMERGENCY CONTACT & PROTOCOL (Kontak Darurat)

**Nomor Penting:**
- Ambulans: 118 / 119
- Polisi: 110
- Pemadam Kebakaran: 113
- SAR Nasional: 115
- Posko Event: [dari data organizer]

**Protokol Komunikasi:**
- Format laporan radio: "Mayday/PAN-PAN, lokasi, jenis insiden, jumlah korban"
- SOP komunikasi dengan tim medis
- Chain of command untuk eskalasi

### 7 ACTIONABLE STEPS (Langkah Sistematis)

**A. UNTUK PARTICIPANT/PELAPOR (Immediate Action - 0-5 menit):**

Berikan instruksi SANGAT JELAS, STEP-BY-STEP, IMPERATIVE:

1. **[First Aid - Jika ada korban]**
   - Cek kesadaran korban (panggil nama, tepuk bahu)
   - Cek pernapasan (lihat dada naik-turun)
   - Jika tidak sadar: posisikan recovery position (miring kiri)
   - Jika luka berdarah: tekan dengan kain bersih, elevasi
   - JANGAN pindahkan korban jika curiga patah tulang leher/punggung

2. **[Safety First]**
   - Jauh dari sumber bahaya (api, tebing, kerumunan panik)
   - Jika malam: nyalakan senter/HP untuk visibilitas
   - Jika dingin: beri selimut/jaket ke korban untuk cegah hipotermia

3. **[Communication]**
   - Hubungi organizer via radio/WhatsApp: [format laporan jelas]
   - Kirim koordinat GPS PERSIS lokasi Anda
   - Tetap di lokasi, jangan bergerak kecuali ada bahaya

4. **[Waiting for Help]**
   - Tenangkan korban: "Bantuan sedang datang, kamu aman"
   - Pantau kondisi: pernapasan, kesadaran, perdarahan
   - Jika memburuk: SEGERA hubungi organizer lagi

5. **[Crowd Control - jika ada orang lain]**
   - Minta bantuan crowd: "Saya butuh 2 orang untuk bantu"
   - Jangan biarkan kerumunan: "Mohon mundur, beri ruang untuk tim medis"

**B. UNTUK ORGANIZER (Strategic Response - 0-15 menit):**

Berikan rekomendasi TEKNIS dan TAKTIS:

1. **[Immediate Dispatch - 0-2 menit]**
   - Deploy tim medis ke koordinat: ${latitude}, ${longitude}
   - Siapkan stretcher + P3K + oksigen portable
   - Assign 1 koordinator lapangan untuk handle situasi
   - Informasikan ambulans standby (jika severity HIGH/CRITICAL)

2. **[Communication Setup - 2-5 menit]**
   - Buka channel radio khusus untuk insiden ini
   - Update semua tim via broadcast: "Medical emergency di [zona], all teams standby"
   - Koordinasi dengan security: pastikan jalur evakuasi clear
   - Hubungi rumah sakit terdekat: [nama RS], informasikan kondisi korban

3. **[Resource Mobilization - 5-10 menit]**
   - Siapkan kendaraan evakuasi di titik terdekat
   - Brief tim medis: jenis insiden, kondisi medan, equipment needed
   - Jika CRITICAL: request helicopter evakuasi (golden hour!)
   - Mobilisasi volunteer trained untuk bantu crowd control

4. **[Situation Assessment - 10-15 menit]**
   - Dapat update real-time dari tim lapangan
   - Evaluasi: apakah perlu evakuasi massal? shutdown area?
   - Dokumentasi: foto, video, witness statement untuk report
   - Siapkan incident report untuk stakeholder

5. **[Post-Incident - After stabilization]**
   - Debrief dengan tim: apa yang berhasil? apa yang perlu diperbaiki?
   - Follow-up kondisi korban di RS
   - Psychological support untuk saksi/korban
   - Update SOP berdasarkan lesson learned

**C. UNTUK TIM MEDIS (Medical Protocol):**

1. **[Triage - Penilaian Awal]**
   - Primary survey: Airway, Breathing, Circulation (ABC)
   - Secondary survey: head-to-toe assessment
   - Prioritas: RED (life-threatening) > YELLOW (urgent) > GREEN (minor)

2. **[Treatment]**
   - Stabilisasi: immobilisasi, hentikan perdarahan, oksigen
   - Pain management: analgesik jika tersedia
   - Monitor vital signs: pulse, BP, respiration, consciousness

3. **[Evacuation Decision]**
   - Jika stabil: evakuasi ke klinik event
   - Jika kritis: IMMEDIATE transport ke RS dengan ambulans/heli
   - Sertakan medical record: waktu insiden, treatment given, vital signs

### 8 SURVIVAL TIPS & BEST PRACTICES

**Jika Kategori SECURITY:**
- Jangan panik, cari tempat aman
- Jika ada ancaman: RUN, HIDE, FIGHT (urutan prioritas)
- Catat ciri-ciri pelaku jika aman melakukannya

**Jika Kategori CROWD (Stampede/Panic):**
- Jangan melawan arus, ikuti arah crowd
- Lindungi dada dengan tangan (boxing stance)
- Jika jatuh: posisi fetal, lindungi kepala dan vital organ

**Jika Kategori FACILITY (Kebakaran/Struktur Rusak):**
- Evakuasi segera via jalur terdekat
- Jika asap: merangkak di bawah (udara lebih bersih)
- Jangan gunakan lift saat kebakaran

**Jika Event Outdoor (Pendakian/Camping):**
- Tetap di jalur, jangan shortcut
- Minum air teratur, cegah dehidrasi
- Jika tersesat: STOP (Stay, Think, Observe, Plan)

═══════════════════════════════════════════════════════════════════════════════

## OUTPUT FORMAT (STRICT JSON)

Berikan output dalam format JSON berikut. JANGAN gunakan markdown code blocks (```json). 
Output HARUS bisa langsung di-parse oleh JSON.parse().

{
  "summary": "Ringkasan insiden dalam 1-2 kalimat yang padat dan informatif",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "severityJustification": "Penjelasan LENGKAP mengapa memilih severity level ini",
  
  "visualAnalysis": {
    "objectsDetected": ["list semua objek penting dalam gambar"],
    "peopleCount": "jumlah orang terlihat",
    "dangerSignsVisible": ["list bahaya yang terlihat: api, luka, dll"],
    "environmentalCondition": "kondisi lingkungan dalam gambar",
    "consistencyCheck": "apakah gambar sesuai dengan deskripsi text?",
    "moodAssessment": "tingkat kepanikan/ketenangan dalam gambar",
    "detailedDescription": "deskripsi SANGAT DETAIL tentang apa yang terlihat dalam gambar"
  },
  
  "locationAnalysis": {
    "areaIdentification": "nama area spesifik berdasarkan koordinat",
    "terrainType": "jenis medan (urban/forest/mountain/beach/etc)",
    "accessibility": "seberapa mudah akses ke lokasi",
    "nearestFacilities": {
      "hospital": {
        "name": "nama rumah sakit terdekat",
        "distance": "jarak dalam km",
        "estimatedTime": "waktu tempuh estimasi"
      },
      "policeStation": "pos polisi terdekat",
      "safeZone": "area aman terdekat untuk evakuasi",
      "helipad": "lokasi helipad jika ada"
    },
    "environmentalConditions": "cuaca, suhu, visibilitas",
    "communicationCoverage": "kualitas sinyal di area"
  },
  
  "riskAnalysis": {
    "primaryRisks": ["risiko utama yang sedang terjadi"],
    "secondaryRisks": ["risiko turunan yang mungkin muncul"],
    "medicalRisks": ["risiko kesehatan spesifik"],
    "environmentalRisks": ["risiko dari lingkungan"],
    "escalationPotential": "potensi insiden memburuk (rendah/sedang/tinggi)",
    "impactRadius": "perkiraan area terdampak dalam meter",
    "goldenHour": "estimasi waktu kritis untuk penanganan (menit)"
  },
  
  "resourceRecommendation": {
    "personnelNeeded": ["list SDM yang dibutuhkan"],
    "equipmentNeeded": ["list peralatan spesifik"],
    "transportationNeeded": "jenis transportasi untuk evakuasi",
    "estimatedResponseTime": "waktu yang dibutuhkan tim untuk tiba"
  },
  
  "emergencyContacts": {
    "ambulance": "118/119",
    "police": "110",
    "fire": "113",
    "sar": "115",
    "nearestHospitalPhone": "nomor RS terdekat jika ada"
  },
  
  "actionPlan": {
    "forParticipant": {
      "immediate": [
        "Step 1: [instruksi sangat spesifik]",
        "Step 2: [instruksi sangat spesifik]",
        "Step 3: [instruksi sangat spesifik]"
      ],
      "waiting": [
        "Instruksi saat menunggu bantuan tiba"
      ],
      "doNot": [
        "Hal yang TIDAK boleh dilakukan"
      ]
    },
    "forOrganizer": {
      "immediate": [
        "Step 1: Deploy tim medis ke koordinat X,Y",
        "Step 2: [action spesifik dengan timeline]"
      ],
      "shortTerm": [
        "Langkah 5-15 menit ke depan"
      ],
      "coordination": [
        "Instruksi koordinasi antar tim"
      ],
      "postIncident": [
        "Follow-up setelah insiden teratasi"
      ]
    },
    "forMedicalTeam": {
      "triage": ["protokol penilaian awal"],
      "treatment": ["protokol treatment"],
      "evacuation": ["protokol evakuasi"]
    }
  },
  
  "survivalTips": [
    "Tips survival spesifik untuk kategori insiden ini",
    "Best practices untuk mencegah insiden serupa"
  ],
  
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

═══════════════════════════════════════════════════════════════════════════════

**CRITICAL REMINDERS:**
1. Analisis GAMBAR yang disertakan dengan SANGAT DETAIL
2. Berikan langkah ACTION yang SPESIFIK, JELAS, dan IMPLEMENTABLE
3. Prioritaskan keselamatan jiwa di atas segalanya
4. Gunakan medical terminology yang tepat tapi tetap mudah dipahami
5. Berikan timeline yang realistis untuk setiap action
6. Output HARUS JSON valid tanpa markdown formatting

Lakukan analisis sekarang!
`;

    // Multimodal: Text + Image (inlineData)
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