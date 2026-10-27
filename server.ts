import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support large image payloads (e.g. up to 25MB base64)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Peringatan: Gagal menginisialisasi Gemini client:', err);
  }
}


interface AnalysisOutput {
  title: string;
  captions: {
    aesthetic: string;
    casual: string;
    funny: string;
  };
  design_recommendation: {
    dominant_color_hex: string;
    recommended_template: 'polaroid_classic' | 'minimalist_white' | 'film_strip' | 'journal_kraft';
    recommended_bg_color_hex: string;
    reason: string;
  };
  palette?: string[];
  vibe_tags?: string[];
}

// Fallback generator in case of network issue or missing key
function generateSmartFallback(hint?: string, imageBase64?: string): AnalysisOutput {
  const lowerHint = (hint || '').toLowerCase();
  
  if (lowerHint.includes('kopi') || lowerHint.includes('cafe') || lowerHint.includes('jurnal') || lowerHint.includes('buku')) {
    return {
      title: 'Kopi & Catatan Pagi',
      captions: {
        aesthetic: 'Kopi hangat menyapa bait-bait renungan pagi ini.',
        casual: 'Ngopi dulu biar pikiran rileks dan ide mengalir.',
        funny: 'Niat nulis jurnal serius, malah mikir makan siang apa.',
      },
      design_recommendation: {
        dominant_color_hex: '#8D5B38',
        recommended_template: 'journal_kraft',
        recommended_bg_color_hex: '#EADBC8',
        reason: 'Tekstur kayu, aroma kopi, dan buku harian sangat padu dengan karakter kertas kraft alami yang bersahaja.',
      },
      palette: ['#EADBC8', '#8D5B38', '#543D2B', '#7A8B74', '#F5EFE6'],
      vibe_tags: ['Morning Ritual', 'Cozy Cafe', 'Journaling'],
    };
  }

  if (lowerHint.includes('film') || lowerHint.includes('jalan') || lowerHint.includes('malam') || lowerHint.includes('vintage') || lowerHint.includes('street')) {
    return {
      title: 'Sudut Kota Lawas',
      captions: {
        aesthetic: 'Di antara langkah senyap, waktu merekam jejak cerita.',
        casual: 'Jalan-jalan santai nemu sudut kota yang sinematik.',
        funny: 'Foto ala vintage, padahal cuma bingung mau nyebrang ke mana.',
      },
      design_recommendation: {
        dominant_color_hex: '#C67D34',
        recommended_template: 'film_strip',
        recommended_bg_color_hex: '#141416',
        reason: 'Kontras pencahayaan analog dan suasana sinematik sangat serasi dibingkai negatif film analog bioskop 35mm.',
      },
      palette: ['#141416', '#C67D34', '#3E4A56', '#D4A373', '#0F172A'],
      vibe_tags: ['Vintage 35mm', 'Cinematic Street', 'Retro Vibe'],
    };
  }

  if (lowerHint.includes('minimal') || lowerHint.includes('putih') || lowerHint.includes('gedung') || lowerHint.includes('seni')) {
    return {
      title: 'Ruang Hening',
      captions: {
        aesthetic: 'Ruang lapang, keheningan yang membebaskan isi kepala.',
        casual: 'Suka banget sama sudut bersih dan pencahayaan estetik ini.',
        funny: 'Foto dulu di dinding putih sebelum ditempeli jadwal kerjaan.',
      },
      design_recommendation: {
        dominant_color_hex: '#ECECEC',
        recommended_template: 'minimalist_white',
        recommended_bg_color_hex: '#FFFFFF',
        reason: 'Garis geometris arsitektur yang bersih menuntut bingkai matting galeri yang minimalis dan elegan tanpa distraksi.',
      },
      palette: ['#FFFFFF', '#ECECEC', '#B3B3B3', '#5A5A5A', '#222222'],
      vibe_tags: ['Clean Geometry', 'Modern Gallery', 'Serene Space'],
    };
  }

  // Default: Polaroid Classic Golden
  return {
    title: 'Kilau Senja Emas',
    captions: {
      aesthetic: 'Menyimpan sepenggal cerita yang tak lekang oleh waktu.',
      casual: 'Keseruan hari ini jangan sampai terlewat.',
      funny: 'Foto dulu, urusan nanti dipikir sambil ngopi santai.',
    },
    design_recommendation: {
      dominant_color_hex: '#E09F5A',
      recommended_template: 'polaroid_classic',
      recommended_bg_color_hex: '#FAF8F5',
      reason: 'Warna hangat dan pencahayaan alami sangat selaras dengan bingkai polaroid klasik berpendar lembut.',
    },
    palette: ['#FAF8F5', '#E09F5A', '#A3532C', '#2C3E50', '#F4EDE2'],
    vibe_tags: ['Nostalgic', 'Golden Warmth', 'Cozy Memory'],
  };
}

// AI Photo Analysis Endpoint
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', vibeHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Data gambar (base64) diperlukan.' });
    }

    // Clean base64 prefix if provided (e.g., data:image/jpeg;base64,...)
    const cleanBase64 = imageBase64.includes(';base64,')
      ? imageBase64.split(';base64,')[1]
      : imageBase64;

    const detectedMimeType = imageBase64.includes('data:')
      ? imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';'))
      : mimeType;

    const systemInstruction = `Anda adalah asisten AI pintar untuk sebuah aplikasi editor foto berbasis template (seperti gaya polaroid, film strip, dan catatan jurnal) di mana pengguna dapat menambahkan caption di bawah foto mereka.

Tugas Anda adalah menerima input gambar dari pengguna, lalu menganalisis isi visual, warna dominan, dan suasana (vibe) foto tersebut untuk menghasilkan dua hal:
1. Pilihan Caption Otomatis yang singkat, estetik, dan cocok diletakkan di bawah foto.
2. Rekomendasi Template & Warna Bingkai yang paling serasi secara estetika.

Kategori Caption yang harus dibuat:
- Aesthetic (Puitis, minimalis, bermakna, maksimal 12 kata)
- Casual (Santai, hangat, relatable untuk keseharian)
- Fun/Humor (Ringan, lucu, atau jenaka)

Pilihan Template yang tersedia di aplikasi Anda (pilih salah satu yang paling cocok):
- "polaroid_classic" (Bingkai putih tebal khas polaroid)
- "minimalist_white" (Bingkai tipis modern yang bersih)
- "film_strip" (Gaya negatif film bioskop/kamera analog)
- "journal_kraft" (Gaya kertas catatan atau buku harian)

Aturan Output:
- Berikan hasil dalam format JSON murni tanpa teks tambahan di luar JSON agar mudah di-parse oleh sistem aplikasi.
- Berikan kode warna HEX untuk rekomendasi warna background/bingkai (misal #F7F5F0, #1E1E24, #E9E1D4, #FFFFFF) dan warna dominan foto.
- Buat caption berbahasa Indonesia yang естеtik, hidup, dan memikat.`;

    const userPromptText = vibeHint
      ? `Analisis foto ini dengan preferensi nuansa tambahan: "${vibeHint}". Tentukan template terbaik ("polaroid_classic", "minimalist_white", "film_strip", atau "journal_kraft"), warna bingkai hex, dan 3 variasi caption (aesthetic, casual, funny).`
      : `Analisis foto ini. Tentukan template terbaik ("polaroid_classic", "minimalist_white", "film_strip", atau "journal_kraft"), warna dominan, warna bingkai hex rekomendasi, dan 3 variasi caption (aesthetic, casual, funny).`;

    if (!ai) {
      const fallback = generateSmartFallback(req.body?.vibeHint);
      return res.json({
        ...fallback,
        isFallback: true,
        errorDetail: 'Gemini API Key belum disetel atau mode offline aktif, menggunakan rekomendasi visual cerdas otomatis.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: detectedMimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: userPromptText,
          },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Judul foto singkat yang estetik dan memikat (2-5 kata)',
            },
            captions: {
              type: Type.OBJECT,
              properties: {
                aesthetic: {
                  type: Type.STRING,
                  description: 'Puitis, minimalis, bermakna, maksimal 12 kata.',
                },
                casual: {
                  type: Type.STRING,
                  description: 'Santai, hangat, relatable untuk keseharian.',
                },
                funny: {
                  type: Type.STRING,
                  description: 'Ringan, lucu, atau jenaka.',
                },
              },
              required: ['aesthetic', 'casual', 'funny'],
            },
            design_recommendation: {
              type: Type.OBJECT,
              properties: {
                dominant_color_hex: {
                  type: Type.STRING,
                  description: 'Warna dominan dari foto dalam format hex #RRGGBB',
                },
                recommended_template: {
                  type: Type.STRING,
                  enum: ['polaroid_classic', 'minimalist_white', 'film_strip', 'journal_kraft'],
                  description: 'Template yang paling serasi secara visual',
                },
                recommended_bg_color_hex: {
                  type: Type.STRING,
                  description: 'Rekomendasi warna background/bingkai format hex #RRGGBB',
                },
                reason: {
                  type: Type.STRING,
                  description: 'Alasan pemilihan template dan warna secara estetika',
                },
              },
              required: [
                'dominant_color_hex',
                'recommended_template',
                'recommended_bg_color_hex',
                'reason',
              ],
            },
            palette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4-5 kode warna hex harmoni dari foto',
            },
            vibe_tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 kata kunci suasana/mood foto',
            },
          },
          required: ['title', 'captions', 'design_recommendation'],
        },
      },
    });

    const textOutput = response.text?.trim() || '';
    if (!textOutput) {
      throw new Error('Respons model kosong');
    }

    const parsedData: AnalysisOutput = JSON.parse(textOutput);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error saat analisis gambar:', error?.message || error);
    // Return graceful fallback with notification
    const fallback = generateSmartFallback(req.body?.vibeHint);
    return res.json({
      ...fallback,
      isFallback: true,
      errorDetail: error?.message || 'Gagal memproses AI secara online, menggunakan rekomendasi visual cerdas bawaan.',
    });
  }
});

// Regenerate Captions Endpoint (focused on new caption alternatives)
app.post('/api/regenerate-captions', async (req: Request, res: Response) => {
  try {
    const { imageBase64, style = 'mixed', currentCaptions } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Gambar diperlukan untuk membuat caption baru.' });
    }

    const cleanBase64 = imageBase64.includes(';base64,')
      ? imageBase64.split(';base64,')[1]
      : imageBase64;

    if (!ai) {
      return res.json({
        aesthetic: 'Detik yang diam, kenangan yang terus berbicara.',
        casual: 'Hari yang simpel tapi berkesan banget.',
        funny: 'Muka boleh kalem, tapi aslinya udah pengen rebahan.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `Buat 3 opsi caption alternatif baru berbahasa Indonesia untuk foto ini dengan gaya: ${style}. 
            Variasi harus berbeda dari caption sebelumnya: "${JSON.stringify(currentCaptions || {})}".
            Kategori:
            - aesthetic: puitis, peneduh rasa, maksimal 12 kata
            - casual: gaya obrolan santai, hangat
            - funny: humor segar, celetukan receh atau relatable`,
          },
        ],
      },
      config: {
        temperature: 0.9,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aesthetic: { type: Type.STRING },
            casual: { type: Type.STRING },
            funny: { type: Type.STRING },
          },
          required: ['aesthetic', 'casual', 'funny'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error saat regenerate captions:', err?.message || err);
    return res.json({
      aesthetic: 'Detik yang diam, kenangan yang terus berbicara.',
      casual: 'Hari yang simpel tapi berkesan banget.',
      funny: 'Muka boleh kalem, tapi aslinya udah pengen rebahan.',
    });
  }
});

const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'lensaklip_data') : path.join(__dirname, 'data');
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

// Ensure data folder exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Peringatan: Gagal membuat folder data:', e);
}

interface StoredPhoto {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  template: string;
  bgColor?: string;
  textColor?: string;
  font?: string;
  fontSize?: number;
  fontStyle?: string;
  textAlign?: string;
  createdAt: string;
  author?: string;
  dimensions?: string;
}

interface StoredTemplate {
  id: string;
  name: string;
  description?: string;
  frameImage?: string; // Data URL or Image URL for custom frame border/overlay
  layoutType?: 'polaroid' | 'classic_frame' | 'overlay' | 'card';
  defaultBg: string;
  defaultFont: string;
  defaultTextColor: string;
  defaultFontSize: number;
  defaultFontStyle?: string;
  defaultTextAlign?: string;
  createdAt: string;
  author?: string;
}

function loadPhotos(): StoredPhoto[] {
  try {
    if (fs.existsSync(PHOTOS_FILE)) {
      const data = fs.readFileSync(PHOTOS_FILE, 'utf-8');
      return JSON.parse(data);
    }
    // Fallback to project root data/photos.json if available
    const seedFile = path.join(__dirname, 'data', 'photos.json');
    if (fs.existsSync(seedFile)) {
      const data = fs.readFileSync(seedFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Gagal membaca photos.json:', err);
  }
  return [];
}

function savePhotos(photos: StoredPhoto[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Gagal menyimpan photos.json:', err);
  }
}

function loadTemplates(): StoredTemplate[] {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const data = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
      return JSON.parse(data);
    }
    const seedFile = path.join(__dirname, 'data', 'templates.json');
    if (fs.existsSync(seedFile)) {
      const data = fs.readFileSync(seedFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Gagal membaca templates.json:', err);
  }
  return [];
}

function saveTemplates(templates: StoredTemplate[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  } catch (err) {
    console.error('Gagal menyimpan templates.json:', err);
  }
}

// 1. GET all uploaded photos (for Admin & User Gallery)
app.get('/api/photos', (_req: Request, res: Response) => {
  const photos = loadPhotos();
  res.json(photos);
});

// 2. POST save uploaded photo
app.post('/api/photos', (req: Request, res: Response) => {
  const {
    id,
    title,
    description,
    imageSrc,
    template,
    bgColor,
    textColor,
    font,
    fontSize,
    fontStyle,
    textAlign,
    author,
  } = req.body;
  if (!imageSrc) {
    return res.status(400).json({ error: 'Data gambar diperlukan.' });
  }

  const photos = loadPhotos();
  const newPhoto: StoredPhoto = {
    id: id || `photo_${Date.now()}`,
    title: title || 'Foto Tanpa Judul',
    description: description || '',
    imageSrc,
    template: template || 'polaroid_classic',
    bgColor: bgColor || '#FAF8F5',
    textColor: textColor || '#2B2B2B',
    font: font || 'caveat',
    fontSize: Number(fontSize) || 22,
    fontStyle: fontStyle || 'normal',
    textAlign: textAlign || 'center',
    createdAt: new Date().toISOString(),
    author: author || 'Pengguna',
    dimensions: 'A5 (148 x 210 mm)',
  };

  // Replace if exists, or prepend
  const existingIndex = photos.findIndex((p) => p.id === newPhoto.id);
  if (existingIndex >= 0) {
    photos[existingIndex] = {
      ...photos[existingIndex],
      ...newPhoto,
    };
  } else {
    photos.unshift(newPhoto);
  }

  savePhotos(photos);
  res.json({ success: true, photo: newPhoto });
});

// 2b. PUT update photo (e.g. from Admin edit)
app.put('/api/photos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const photos = loadPhotos();
  const idx = photos.findIndex((p) => p.id === id);

  if (idx < 0) {
    return res.status(404).json({ error: 'Foto tidak ditemukan.' });
  }

  photos[idx] = {
    ...photos[idx],
    ...updates,
    id,
  };

  savePhotos(photos);
  res.json({ success: true, photo: photos[idx] });
});

// 3. DELETE photo (Admin)
app.delete('/api/photos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let photos = loadPhotos();
  const initialLength = photos.length;
  photos = photos.filter((p) => p.id !== id);

  if (photos.length === initialLength) {
    return res.status(404).json({ error: 'Foto tidak ditemukan.' });
  }

  savePhotos(photos);
  res.json({ success: true, message: 'Foto berhasil dihapus.' });
});

// 3b. TEMPLATES CRUD ENDPOINTS (For Admin Custom Templates)
app.get('/api/templates', (_req: Request, res: Response) => {
  const templates = loadTemplates();
  res.json(templates);
});

app.post('/api/templates', (req: Request, res: Response) => {
  const {
    id,
    name,
    description,
    frameImage,
    layoutType = 'polaroid',
    defaultBg = '#FAF8F5',
    defaultFont = 'caveat',
    defaultTextColor = '#2B2B2B',
    defaultFontSize = 22,
    defaultFontStyle = 'normal',
    defaultTextAlign = 'center',
    author = 'Admin',
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama template wajib diisi.' });
  }

  const templates = loadTemplates();
  const templateId = id || `custom_tpl_${Date.now()}`;
  const newTemplate: StoredTemplate = {
    id: templateId,
    name: name.trim(),
    description: description || '',
    frameImage: frameImage || '',
    layoutType,
    defaultBg,
    defaultFont,
    defaultTextColor,
    defaultFontSize: Number(defaultFontSize) || 22,
    defaultFontStyle,
    defaultTextAlign,
    createdAt: new Date().toISOString(),
    author,
  };

  const existingIdx = templates.findIndex((t) => t.id === templateId);
  if (existingIdx >= 0) {
    templates[existingIdx] = newTemplate;
  } else {
    templates.push(newTemplate);
  }

  saveTemplates(templates);
  res.json({ success: true, template: newTemplate });
});

app.delete('/api/templates/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let templates = loadTemplates();
  const initialLen = templates.length;
  templates = templates.filter((t) => t.id !== id);

  if (templates.length === initialLen) {
    return res.status(404).json({ error: 'Template tidak ditemukan.' });
  }

  saveTemplates(templates);
  res.json({ success: true, message: 'Template berhasil dihapus.' });
});

// 4. POST Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'Smpia9kpbks!') {
    const token = 'admin_session_' + Buffer.from('admin:' + Date.now()).toString('base64');
    return res.json({ success: true, token, user: 'admin' });
  }
  return res.status(401).json({ success: false, error: 'Username atau password salah.' });
});

// 5. In-memory cache for rendered A5 print sheets
const printCache = new Map<string, string>();

app.post('/api/print-preview', (req: Request, res: Response) => {
  const { id, dataUrl } = req.body;
  if (!id || !dataUrl) {
    return res.status(400).json({ error: 'id dan dataUrl diperlukan.' });
  }
  printCache.set(id, dataUrl);
  res.json({ success: true, url: `/print/${encodeURIComponent(id)}` });
});

// 6. Standalone Print Route: Opens in top-level window without iframe restrictions
app.get('/print/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const dataUrl = printCache.get(id);
  const photos = loadPhotos();
  const photo = photos.find((p) => p.id === id);
  const imageToPrint = dataUrl || photo?.imageSrc || '';

  if (!imageToPrint) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="id">
        <body style="font-family: sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <div style="text-align: center;">
            <h2>Foto tidak ditemukan untuk dicetak</h2>
            <p>Silakan kembali ke aplikasi dan pilih cetak kembali.</p>
            <a href="/" style="color: #fbbf24; text-decoration: underline; margin-top: 10px; display: inline-block;">Kembali ke Editor</a>
          </div>
        </body>
      </html>
    `);
  }

  const title = photo?.title || 'Foto A5 LensaKlip';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cetak Lembaran A5 - ${title.replace(/"/g, '&quot;')}</title>
  <style>
    @page {
      size: 148mm 210mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .top-toolbar {
      width: 100%;
      background: #111827;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
    }
    .btn-print {
      background: #fbbf24;
      color: #030712;
      border: none;
      padding: 10px 22px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
    }
    .btn-print:hover {
      background: #f59e0b;
      transform: translateY(-1px);
    }
    .btn-close {
      background: rgba(255,255,255,0.1);
      color: #e5e7eb;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 9px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-close:hover {
      background: rgba(255,255,255,0.15);
      color: #ffffff;
    }
    .page-wrapper {
      padding: 30px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
    .sheet-a5 {
      width: 148mm;
      height: 210mm;
      max-width: 95vw;
      background: white;
      box-shadow: 0 12px 35px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 2px;
    }
    .sheet-a5 img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    @media print {
      html, body {
        background: transparent !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .top-toolbar {
        display: none !important;
      }
      .page-wrapper {
        padding: 0 !important;
        margin: 0 !important;
        width: 148mm !important;
        height: 210mm !important;
      }
      .sheet-a5 {
        width: 148mm !important;
        height: 210mm !important;
        max-width: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="top-toolbar">
    <div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #fbbf24;"></span>
        <h1 style="margin: 0; font-size: 15px; font-weight: 700;">Halaman Cetak A5 — ${title.replace(/"/g, '&quot;')}</h1>
      </div>
      <p style="margin: 4px 0 0; font-size: 12px; color: #9ca3af;">Format Standar ISO A5 (148 x 210 mm) • Dialog printer otomatis dibuka di bawah</p>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <button class="btn-print" onclick="window.print()">
        🖨️ Buka Dialog Printer (Ctrl+P)
      </button>
      <a href="/" class="btn-close">Kembali</a>
    </div>
  </div>
  <div class="page-wrapper">
    <div class="sheet-a5">
      <img src="${imageToPrint}" alt="Cetak A5" />
    </div>
  </div>
  <script>
    // Standalone top-level window allows window.print() without iframe sandbox blocking
    window.addEventListener('load', () => {
      setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.error(e);
        }
      }, 400);
    });
  </script>
</body>
</html>`;

  res.send(html);
});



// Health check endpoints for Vercel and monitoring
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'LensaKlip', time: new Date().toISOString() });
});
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'LensaKlip', time: new Date().toISOString() });
});

// Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LensaKlip Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

// Only start the standalone HTTP listener when NOT running in Vercel Serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export default app;
