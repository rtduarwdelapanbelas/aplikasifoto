import {
  TemplateType,
  FontOption,
  FilterType,
  AccentType,
  AIAnalysisResult,
  FrameState,
} from '../types/editor';

export interface SamplePhoto {
  id: string;
  name: string;
  category: string;
  url: string;
  previewPrompt: string;
  defaultTemplate: TemplateType;
  initialAnalysis: AIAnalysisResult;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'sunset_polaroid',
    name: 'Senja di Pantai',
    category: 'Alam & Nostalgia',
    url: '/src/assets/images/sample_sunset_polaroid_1793077827913.jpg',
    previewPrompt: 'Golden hour deburan ombak pantai bernuansa hangat',
    defaultTemplate: 'polaroid_classic',
    initialAnalysis: {
      title: 'Senja di Ujung Pantai',
      captions: {
        aesthetic: 'Mentari pamit, meninggalkan riak emas dalam dada.',
        casual: 'Sore santai ditemani angin laut dan deburan ombak.',
        funny: 'Senja estetik, aslinya pasir masuk sandal semua.',
      },
      design_recommendation: {
        dominant_color_hex: '#E09F5A',
        recommended_template: 'polaroid_classic',
        recommended_bg_color_hex: '#FAF8F5',
        reason: 'Semburat jingga senja dan cahaya keemasan berpadu sempurna dengan bingkai polaroid klasik berpendar hangat.',
      },
      palette: ['#FAF8F5', '#E09F5A', '#A3532C', '#2C3E50', '#F4EDE2'],
      vibe_tags: ['Golden Hour', 'Nostalgic', 'Coastal Bliss'],
    },
  },
  {
    id: 'cafe_journal',
    name: 'Meja Kopi & Jurnal',
    category: 'Keseharian & Buku',
    url: '/src/assets/images/sample_cafe_journal_1793077829246.jpg',
    previewPrompt: 'Secangkir latte art hangat, buku catatan terbuka, dan daun eukaliptus',
    defaultTemplate: 'journal_kraft',
    initialAnalysis: {
      title: 'Secangkir Inspirasi Pagi',
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
    },
  },
  {
    id: 'street_film',
    name: 'Toko Buku Lawas',
    category: 'Vintage & Analog',
    url: '/src/assets/images/sample_street_film_1793077829977.jpg',
    previewPrompt: 'Jalanan senja dengan etalase toko buku antik bercahaya temparam',
    defaultTemplate: 'film_strip',
    initialAnalysis: {
      title: 'Lorong Cerita Lawas',
      captions: {
        aesthetic: 'Di antara lembaran tua, waktu sejenak mengheningkan langkah.',
        casual: 'Jalan sore nemu toko buku antik yang bikin betah.',
        funny: 'Masuk cuma mau numpang neduh, keluar malah borong buku.',
      },
      design_recommendation: {
        dominant_color_hex: '#C67D34',
        recommended_template: 'film_strip',
        recommended_bg_color_hex: '#141416',
        reason: 'Pendar lampu jalanan basah dan tekstur retro 35mm sangat serasi dibingkai negatif film analog bioskop.',
      },
      palette: ['#141416', '#C67D34', '#3E4A56', '#D4A373', '#0F172A'],
      vibe_tags: ['Vintage 35mm', 'Rainy Dusk', 'Old Curiosity'],
    },
  },
  {
    id: 'minimal_art',
    name: 'Arsitektur Minimalis',
    category: 'Galeri & Modern',
    url: '/src/assets/images/sample_minimal_art_1793077829794.jpg',
    previewPrompt: 'Lengkungan pilar beton putih bersih dengan bayangan geometris',
    defaultTemplate: 'minimalist_white',
    initialAnalysis: {
      title: 'Geometri Keheningan',
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
    },
  },
];

export const TEMPLATE_CONFIGS: Record<
  TemplateType,
  {
    label: string;
    sublabel: string;
    defaultBg: string;
    defaultFont: FontOption;
    defaultTextColor: string;
    description: string;
  }
> = {
  polaroid_classic: {
    label: 'Polaroid Classic',
    sublabel: 'Bingkai putih tebal dengan ruang bawah khas',
    defaultBg: '#FAF8F5',
    defaultFont: 'caveat',
    defaultTextColor: '#2B2B2B',
    description: 'Format polaroid retro instan dengan dagu bawah lebar untuk goresan tulisan tangan otentik.',
  },
  minimalist_white: {
    label: 'Minimalist White',
    sublabel: 'Gaya paspartu galeri seni yang bersih',
    defaultBg: '#FFFFFF',
    defaultFont: 'cormorant',
    defaultTextColor: '#1A1A1A',
    description: 'Proporsi matting presisi dengan garis tepi modern untuk foto arsitektur dan potret elegan.',
  },
  film_strip: {
    label: 'Film Strip 35mm',
    sublabel: 'Negatif seluloid analog dengan lubang perforasi',
    defaultBg: '#121214',
    defaultFont: 'courier',
    defaultTextColor: '#F0ECE1',
    description: 'Tampilan rol film analog bioskop lengkap dengan kode eksposur dan perforasi sprocket.',
  },
  journal_kraft: {
    label: 'Journal Kraft',
    sublabel: 'Tekstur kertas daur ulang & buku harian',
    defaultBg: '#DCC8B0',
    defaultFont: 'typewriter',
    defaultTextColor: '#3E2F20',
    description: 'Gaya lembaran scrapbook hangat yang dihiasi washi tape dan sentuhan kertas catatan berjiwa.',
  },
};

export const FONT_OPTIONS: Array<{
  id: FontOption;
  name: string;
  category: string;
  className: string;
}> = [
  { id: 'caveat', name: 'Caveat', category: 'Tulisan Tangan', className: 'font-handwriting' },
  { id: 'kalam', name: 'Kalam', category: 'Spidol Santai', className: 'font-marker' },
  { id: 'typewriter', name: 'Special Elite', category: 'Mesin Tik Retro', className: 'font-typewriter' },
  { id: 'courier', name: 'Courier Prime', category: 'Monospace Analog', className: 'font-courier' },
  { id: 'cormorant', name: 'Cormorant', category: 'Serif Editorial', className: 'font-serif-editorial' },
  { id: 'playfair', name: 'Playfair Display', category: 'Serif Mewah', className: 'font-serif-luxury' },
  { id: 'sans', name: 'Plus Jakarta', category: 'Sans Modern', className: 'font-sans-modern' },
  { id: 'pacifico', name: 'Pacifico', category: 'Kuas Ceria', className: 'font-pacifico' },
  { id: 'dancing', name: 'Dancing Script', category: 'Kaligrafi Halus', className: 'font-dancing' },
  { id: 'cinzel', name: 'Cinzel', category: 'Serif Megah / Piagam', className: 'font-cinzel' },
  { id: 'merriweather', name: 'Merriweather', category: 'Serif Buku Hangat', className: 'font-merriweather' },
  { id: 'montserrat', name: 'Montserrat', category: 'Sans Tegas Geometris', className: 'font-montserrat' },
];

export const FILTER_OPTIONS: Array<{
  id: FilterType;
  name: string;
  cssFilter: string;
}> = [
  { id: 'none', name: 'Original', cssFilter: 'none' },
  { id: 'warm_vintage', name: 'Warm Retro', cssFilter: 'sepia(0.2) contrast(1.05) brightness(1.02) saturate(1.15)' },
  { id: 'noir', name: 'B&W Noir', cssFilter: 'grayscale(1) contrast(1.2) brightness(0.95)' },
  { id: 'golden_hour', name: 'Golden Glow', cssFilter: 'sepia(0.25) saturate(1.3) hue-rotate(-10deg) brightness(1.05)' },
  { id: 'film_fade', name: 'Film Fade', cssFilter: 'contrast(0.9) brightness(1.05) saturate(0.85) sepia(0.1)' },
  { id: 'vivid', name: 'Vivid Pop', cssFilter: 'contrast(1.12) saturate(1.35)' },
];

export const ACCENT_OPTIONS: Array<{
  id: AccentType;
  name: string;
  description: string;
}> = [
  { id: 'none', name: 'Tanpa Aksen', description: 'Tampilan bersih tanpa tempelan' },
  { id: 'tape_top', name: 'Solatip Bening', description: 'Selotip scotch transparan di atas' },
  { id: 'tape_diagonal', name: 'Washi Tape Sudut', description: 'Pita washi tape di dua sudut' },
  { id: 'push_pin', name: 'Jarum Semat Emas', description: 'Pin mading warna emas vintage' },
  { id: 'stamp_postal', name: 'Stempel Pos', description: 'Stempel pos retro bulat' },
  { id: 'stamp_retro_date', name: 'Tanggal LED Oranye', description: 'Cetak tanggal kamera saku 90-an' },
];

export const INITIAL_FRAME_STATE: FrameState = {
  imageSrc: SAMPLE_PHOTOS[0].url,
  template: 'polaroid_classic',
  title: 'Senja di Ujung Pantai',
  caption: SAMPLE_PHOTOS[0].initialAnalysis.captions.aesthetic,
  subCaption: '26 Oktober 2026',
  selectedCategory: 'aesthetic',
  font: 'caveat',
  fontSize: 22,
  textColor: '#2B2B2B',
  fontStyle: 'normal',
  textAlign: 'center',
  bgColor: '#FAF8F5',
  filter: 'none',
  accent: 'tape_top',
  aspectRatio: '1:1',
  zoom: 1,
  panX: 0,
  panY: 0,
  showDate: true,
  dateText: "'26 10 26",
};
