import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Copy,
  Sparkles,
  Camera,
  Check,
  CheckCircle2,
  RefreshCw,
  Printer,
  Shield,
  Trash2,
} from 'lucide-react';
import { FrameCanvas } from './components/FrameCanvas';
import { CameraModal } from './components/CameraModal';
import { AdminPanel, StoredPhoto } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { PrintA5Modal } from './components/PrintA5Modal';
import {
  FrameState,
  AIAnalysisResult,
  TemplateType,
  CaptionCategory,
  CustomTemplate,
  FontStyleType,
} from './types/editor';
import {
  SAMPLE_PHOTOS,
  INITIAL_FRAME_STATE,
  TEMPLATE_CONFIGS,
  SamplePhoto,
} from './data/presets';
import { exportFrameToImage } from './utils/canvasExporter';
import { TypographyEditor } from './components/TypographyEditor';

export default function App() {
  const [frameState, setFrameState] = useState<FrameState>(INITIAL_FRAME_STATE);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(
    SAMPLE_PHOTOS[0].initialAnalysis
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalFrame, setPrintModalFrame] = useState<FrameState | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('lensaklip_admin_token') !== null;
    } catch {
      return false;
    }
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentId, setCurrentId] = useState<string>(() => `photo_${Date.now()}`);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisCounterRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load custom templates created by Admin (with localStorage persistence)
  const fetchCustomTemplates = async () => {
    try {
      let tpls: CustomTemplate[] = [];
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          tpls = await res.json();
        }
      } catch (e) {
        // server offline fallback
      }

      // Merge with localStorage
      try {
        const local = localStorage.getItem('lensaklip_custom_templates');
        if (local) {
          const localList: CustomTemplate[] = JSON.parse(local);
          const map = new Map<string, CustomTemplate>();
          tpls.forEach((t) => map.set(t.id, t));
          localList.forEach((t) => map.set(t.id, t));
          tpls = Array.from(map.values());
        }
      } catch (e) {
        // ignore
      }

      setCustomTemplates(tpls);
    } catch (err) {
      console.warn('Gagal memuat template kustom:', err);
    }
  };

  useEffect(() => {
    fetchCustomTemplates();

    // Check URL route for SPA deep links on Vercel (/admin or /print/:id)
    try {
      const pathname = window.location.pathname;
      if (pathname === '/admin') {
        if (sessionStorage.getItem('lensaklip_admin_token')) {
          setIsAdminOpen(true);
        } else {
          setIsLoginModalOpen(true);
        }
      } else if (pathname.startsWith('/print/')) {
        const photoId = decodeURIComponent(pathname.replace('/print/', ''));
        const stored = localStorage.getItem('lensaklip_saved_photos');
        if (stored) {
          const list: StoredPhoto[] = JSON.parse(stored);
          const found = list.find((p) => p.id === photoId);
          if (found) {
            handleAdminPrintSingle(found);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const updateFrameState = (updates: Partial<FrameState>) => {
    setFrameState((prev) => {
      const next = { ...prev, ...updates };
      // Debounce sync to server for Admin visibility if image exists
      if (next.imageSrc) {
        syncToServer(next);
      }
      return next;
    });
  };

  // Sync current photo state to server database and localStorage
  const syncToServer = async (state: FrameState) => {
    if (!state.imageSrc) return;

    const payload: StoredPhoto = {
      id: currentId,
      title: state.title || 'Foto Tanpa Judul',
      description: state.caption || '',
      imageSrc: state.imageSrc,
      template: state.template,
      bgColor: state.bgColor,
      textColor: state.textColor,
      font: state.font,
      fontSize: state.fontSize,
      fontStyle: state.fontStyle,
      textAlign: state.textAlign,
      createdAt: new Date().toISOString(),
      dimensions: 'A5 (148 x 210 mm)',
    };

    // 1. Instant local persistence for Vercel & offline
    try {
      const stored = localStorage.getItem('lensaklip_saved_photos');
      const list: StoredPhoto[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((p) => p.id === currentId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        list.unshift(payload);
      }
      localStorage.setItem('lensaklip_saved_photos', JSON.stringify(list));
    } catch (e) {
      // ignore quota
    }

    // 2. Server persistence
    try {
      await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Gagal menyimpan foto ke server:', err);
    }
  };

  // Initial sync on mount if image exists
  useEffect(() => {
    if (INITIAL_FRAME_STATE.imageSrc) {
      syncToServer(INITIAL_FRAME_STATE);
    }
  }, []);

  // Analyze uploaded photo with AI
  const analyzeImage = async (base64Image: string) => {
    const thisAnalysisId = ++analysisCounterRef.current;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
      });

      if (thisAnalysisId !== analysisCounterRef.current) {
        // User cancelled or uploaded another image in the meantime
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result: AIAnalysisResult = await response.json();
      if (thisAnalysisId !== analysisCounterRef.current) return;

      setAnalysis(result);

      const rec = result.design_recommendation;
      const cfg = TEMPLATE_CONFIGS[rec.recommended_template];

      const newId = `photo_${Date.now()}`;
      setCurrentId(newId);

      const updatedState: FrameState = {
        ...frameState,
        imageSrc: base64Image,
        title: result.title || 'Momen Hari Ini',
        caption: result.captions.aesthetic,
        selectedCategory: 'aesthetic',
        template: rec.recommended_template,
        bgColor: rec.recommended_bg_color_hex || cfg.defaultBg,
        font: cfg.defaultFont,
        textColor: cfg.defaultTextColor,
      };

      setFrameState(updatedState);
      syncToServer(updatedState);

      showToast('Foto berhasil dianalisis & judul otomatis dibuat!');
    } catch (err: any) {
      if (thisAnalysisId !== analysisCounterRef.current) return;
      console.error('Gagal analisis AI:', err);
      showToast('Foto berhasil dimuat.');
    } finally {
      if (thisAnalysisId === analysisCounterRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          updateFrameState({ imageSrc: base64 });
          analyzeImage(base64);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Sample photo selector
  const handleSelectSample = (sample: SamplePhoto) => {
    const cfg = TEMPLATE_CONFIGS[sample.defaultTemplate];
    const newId = `photo_${Date.now()}`;
    setCurrentId(newId);

    const newState: FrameState = {
      ...INITIAL_FRAME_STATE,
      imageSrc: sample.url,
      title: sample.initialAnalysis.title || sample.name,
      caption: sample.initialAnalysis.captions.aesthetic,
      selectedCategory: 'aesthetic',
      template: sample.defaultTemplate,
      bgColor: sample.initialAnalysis.design_recommendation.recommended_bg_color_hex,
      font: cfg.defaultFont,
      textColor: cfg.defaultTextColor,
    };
    setFrameState(newState);
    setAnalysis(sample.initialAnalysis);
    syncToServer(newState);
  };

  // Camera capture
  const handleCameraCapture = (base64Data: string) => {
    updateFrameState({ imageSrc: base64Data });
    analyzeImage(base64Data);
  };

  // Export frame to A5 PNG
  const handleDownloadA5 = async () => {
    if (!frameState.imageSrc) {
      showToast('Silakan unggah foto terlebih dahulu sebelum mengunduh.');
      return;
    }
    setIsExporting(true);
    try {
      const dataUrl = await exportFrameToImage(frameState, 1.5);
      const link = document.createElement('a');
      const filename = `A5-${(frameState.title || 'foto').replace(/\s+/g, '_')}-${Date.now()}.png`;
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Foto frame ukuran A5 berhasil diunduh!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh gambar.');
    } finally {
      setIsExporting(false);
    }
  };

  // Trigger A5 Print Modal
  const handleTriggerPrint = (stateToPrint: FrameState) => {
    if (!stateToPrint.imageSrc) {
      showToast('Silakan unggah foto terlebih dahulu sebelum mencetak.');
      return;
    }
    setPrintModalFrame(stateToPrint);
    setIsPrintModalOpen(true);
  };

  // Admin print single photo
  const handleAdminPrintSingle = (photo: StoredPhoto) => {
    const state: FrameState = {
      imageSrc: photo.imageSrc,
      template: (photo.template as any) || 'polaroid_classic',
      title: photo.title,
      caption: photo.description,
      subCaption: new Date(photo.createdAt).toLocaleDateString('id-ID'),
      selectedCategory: 'aesthetic',
      font: (photo.font as any) || 'caveat',
      fontSize: 22,
      textColor: photo.textColor || '#2B2B2B',
      textAlign: 'center',
      bgColor: photo.bgColor || '#FAF8F5',
      filter: 'none',
      accent: 'tape_top',
      aspectRatio: '1:1',
      zoom: 1,
      panX: 0,
      panY: 0,
      showDate: true,
      dateText: "'26 10 26",
    };
    handleTriggerPrint(state);
  };

  // Admin batch print all photos
  const handleAdminPrintAll = (photos: StoredPhoto[]) => {
    if (photos.length === 0) return;
    // Print the first or all
    handleAdminPrintSingle(photos[0]);
    showToast(`Membuka dialog cetak A5 untuk foto pengguna.`);
  };

  // Copy title and description
  const handleCopyText = () => {
    const textToCopy = `${frameState.title}\n\n${frameState.caption}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Judul & deskripsi disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear/Delete photo from upload panel
  const handleClearPhoto = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Cancel in-flight AI analysis immediately
    analysisCounterRef.current++;
    setIsAnalyzing(false);

    // Delete photo from server and localStorage if it was saved
    if (currentId) {
      try {
        const stored = localStorage.getItem('lensaklip_saved_photos');
        if (stored) {
          const list: StoredPhoto[] = JSON.parse(stored);
          const filtered = list.filter((p) => p.id !== currentId);
          localStorage.setItem('lensaklip_saved_photos', JSON.stringify(filtered));
        }
      } catch (err) {
        // silent catch
      }

      try {
        await fetch(`/api/photos/${currentId}`, { method: 'DELETE' });
      } catch (err) {
        // silent catch
      }
    }

    // Reset file input element so re-uploading the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Generate fresh ID
    const newId = `photo_${Date.now()}`;
    setCurrentId(newId);

    // Reset editor state
    setFrameState((prev) => ({
      ...prev,
      imageSrc: '',
      title: '',
      caption: '',
    }));
    setAnalysis(null);

    showToast('Foto berhasil dihapus.');
  };

  // Change template format (supports built-in & custom templates)
  const handleTemplateSelect = (t: string, customTpl?: CustomTemplate) => {
    const custom = customTpl || customTemplates.find((tpl) => tpl.id === t);
    if (custom) {
      updateFrameState({
        template: t,
        customTemplateData: custom,
        bgColor: custom.defaultBg || '#FAF8F5',
        font: custom.defaultFont || 'caveat',
        textColor: custom.defaultTextColor || '#2B2B2B',
        fontSize: custom.defaultFontSize || 22,
        fontStyle: custom.defaultFontStyle || 'normal',
        textAlign: custom.defaultTextAlign || 'center',
      });
      showToast(`Template "${custom.name}" diterapkan!`);
    } else if (TEMPLATE_CONFIGS[t as keyof typeof TEMPLATE_CONFIGS]) {
      const cfg = TEMPLATE_CONFIGS[t as keyof typeof TEMPLATE_CONFIGS];
      updateFrameState({
        template: t,
        customTemplateData: undefined,
        bgColor: cfg.defaultBg,
        font: cfg.defaultFont,
        textColor: cfg.defaultTextColor,
      });
    }
  };

  // Admin Auth Handlers
  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsLoginModalOpen(false);
    setIsAdminOpen(true);
    showToast('Login admin berhasil!');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('lensaklip_admin_token');
    setIsAdminLoggedIn(false);
    setIsAdminOpen(false);
    showToast('Admin berhasil logout.');
  };

  return (
    <div className="min-h-screen bg-[#0e1014] text-slate-100 flex flex-col font-sans">
      {/* Clean Top Bar */}
      <header className="border-b border-white/5 bg-[#121418]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-tight">
                LensaKlip
              </span>
              <span className="text-[10px] text-amber-300 font-mono tracking-wider">
                UKURAN CETAK A5 (148 x 210 mm)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tombol Panel Admin */}
            <button
              onClick={handleOpenAdmin}
              className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Masuk ke Panel Admin untuk melihat semua foto yang diunggah pengguna"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Panel Admin' : 'Login Admin'}</span>
            </button>

            {/* Print A5 */}
            <button
              onClick={() => handleTriggerPrint(frameState)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Cetak langsung ke kertas A5"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Print A5</span>
            </button>

            {/* Unduh A5 */}
            <button
              onClick={handleDownloadA5}
              disabled={isExporting}
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Merender...' : 'Unduh A5'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Simple Editor Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Pratinjau Frame Foto Proporsi A5 */}
          <div className="md:col-span-6 flex flex-col items-center space-y-4">
            <div className="w-full bg-[#14161b] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl flex items-center justify-center">
              <FrameCanvas
                frameState={frameState}
                onUpdateState={updateFrameState}
                onPhotoClick={() => fileInputRef.current?.click()}
              />
            </div>

            {/* Pilihan Gaya Bingkai Sederhana & Custom Admin */}
            <div className="w-full flex items-center justify-center gap-1.5 overflow-x-auto py-1 max-w-full">
              {[
                { id: 'polaroid_classic', name: 'Polaroid A5' },
                { id: 'minimalist_white', name: 'Minimalis A5' },
                { id: 'film_strip', name: 'Film Strip A5' },
                { id: 'journal_kraft', name: 'Jurnal A5' },
                ...customTemplates.map((t) => ({ id: t.id, name: t.name })),
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                    frameState.template === t.id
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {t.name}
                </button>
              ))}

              <button
                onClick={handleOpenAdmin}
                className="px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                title="Buka panel admin untuk upload desain template baru"
              >
                <span>+ Template Baru</span>
              </button>
            </div>
          </div>

          {/* Kolom Kanan: 3 Input Inti (Upload, Judul, Deskripsi) */}
          <div className="md:col-span-6 space-y-6">
            {/* 1. BAGIAN UPLOAD FOTO */}
            <div className="bg-[#14161b] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span>Upload Foto</span>
                </label>

                <div className="flex items-center gap-2">
                  {isAnalyzing && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      AI menyusun judul & deskripsi...
                    </span>
                  )}
                  {frameState.imageSrc && (
                    <button
                      type="button"
                      onClick={(e) => handleClearPhoto(e)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded hover:bg-red-500/10 active:scale-95"
                      title="Hapus foto dari editor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Drop Area / Foto Aktif */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {frameState.imageSrc ? (
                <div className="border border-white/15 bg-white/[0.03] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={frameState.imageSrc}
                      alt="Thumbnail"
                      className="w-12 h-12 object-cover rounded-lg border border-white/15 shrink-0 bg-black"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {frameState.title || 'Foto Terpasang'}
                      </p>
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" /> Foto siap dicetak
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleClearPhoto(e)}
                      className="px-2.5 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 active:scale-95 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="Hapus foto ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-amber-400/50 hover:bg-white/[0.02] transition-colors rounded-xl p-5 text-center cursor-pointer group"
                >
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
                  <p className="text-xs font-semibold text-slate-200">
                    Klik untuk unggah foto dari perangkat
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, atau WEBP</p>
                </div>
              )}

              {/* Kamera / Sampel */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gunakan Kamera</span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Coba sampel:</span>
                  <div className="flex gap-1">
                    {SAMPLE_PHOTOS.slice(0, 3).map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        className="hover:text-amber-300 underline underline-offset-2 cursor-pointer ml-1"
                      >
                        {sample.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BAGIAN JUDUL FOTO */}
            <div className="bg-[#14161b] border border-white/10 rounded-2xl p-5 space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[11px]">
                  2
                </span>
                <span>Judul Foto</span>
              </label>

              <input
                type="text"
                value={frameState.title}
                onChange={(e) => updateFrameState({ title: e.target.value })}
                placeholder="Masukkan judul foto..."
                className="w-full text-sm font-semibold bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />

              {analysis?.title && analysis.title !== frameState.title && (
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="truncate">Saran AI: "{analysis.title}"</span>
                  <button
                    onClick={() => updateFrameState({ title: analysis.title || '' })}
                    className="text-amber-400 hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    Gunakan
                  </button>
                </div>
              )}
            </div>

            {/* 3. BAGIAN DESKRIPSI FOTO */}
            <div className="bg-[#14161b] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <span>Deskripsi Foto</span>
                </label>

                <button
                  onClick={() => analyzeImage(frameState.imageSrc)}
                  disabled={isAnalyzing}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Buat ulang saran deskripsi foto dengan AI"
                >
                  <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>Saran AI Baru</span>
                </button>
              </div>

              <textarea
                value={frameState.caption}
                onChange={(e) => updateFrameState({ caption: e.target.value })}
                rows={3}
                placeholder="Tulis deskripsi atau cerita singkat tentang foto ini..."
                className="w-full text-sm bg-white/5 border border-white/10 rounded-xl p-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
              />

              {/* 3 Pilihan Cepat Kategori Caption AI */}
              {analysis?.captions && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 block">
                    Pilih cepat deskripsi dari AI:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: 'aesthetic', label: 'Aesthetic', text: analysis.captions.aesthetic },
                        { key: 'casual', label: 'Casual', text: analysis.captions.casual },
                        { key: 'funny', label: 'Humor', text: analysis.captions.funny },
                      ] as const
                    ).map((item) => {
                      const isActive = frameState.caption === item.text;
                      return (
                        <button
                          key={item.key}
                          onClick={() =>
                            updateFrameState({
                              caption: item.text,
                              selectedCategory: item.key as CaptionCategory,
                            })
                          }
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isActive
                              ? 'border-amber-400 bg-amber-400/10 text-white'
                              : 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="text-[11px] font-semibold flex items-center justify-between">
                            <span>{item.label}</span>
                            {isActive && <Check className="w-3 h-3 text-amber-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.text}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. BAGIAN MODE TULISAN (FONT, WARNA, STYLE, UKURAN) */}
            <div className="bg-[#14161b] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[11px]">
                    4
                  </span>
                  <span>Mode Tulisan & Tipografi</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsTypographyOpen(!isTypographyOpen)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <span>{isTypographyOpen ? 'Tutup Pengaturan' : 'Atur Font & Gaya'}</span>
                </button>
              </div>

              {/* Ringkasan Cepat Tipografi Aktif */}
              <div
                onClick={() => setIsTypographyOpen(!isTypographyOpen)}
                className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs transition-colors cursor-pointer"
                title="Klik untuk membuka/menutup pengaturan font, warna, style, dan ukuran"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white capitalize">{frameState.font}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-mono">{frameState.fontSize}px</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 capitalize">{frameState.fontStyle || 'Normal'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: frameState.textColor }}
                  />
                  <span className="font-mono text-[10px] text-slate-400 uppercase">{frameState.textColor}</span>
                </div>
              </div>

              {isTypographyOpen && (
                <div className="pt-2 border-t border-white/5 animate-fade-in">
                  <TypographyEditor
                    font={frameState.font}
                    fontSize={frameState.fontSize}
                    textColor={frameState.textColor}
                    fontStyle={frameState.fontStyle}
                    textAlign={frameState.textAlign}
                    onChange={(updates) => updateFrameState(updates)}
                  />
                </div>
              )}
            </div>

            {/* Action Bar Bawah */}
            <div className="flex items-center gap-3 pt-1">
              {/* Tombol Cetak A5 */}
              <button
                onClick={() => handleTriggerPrint(frameState)}
                className="py-3 px-4 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                title="Cetak langsung lembaran A5"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Cetak A5</span>
              </button>

              {/* Tombol Unduh A5 */}
              <button
                onClick={handleDownloadA5}
                disabled={isExporting}
                className="flex-1 py-3 px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Merender A5...' : 'Unduh Frame Ukuran A5'}</span>
              </button>

              {/* Salin Teks */}
              <button
                onClick={handleCopyText}
                className="py-3 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                title="Salin judul dan deskripsi"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">Salin</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Dialog Cetak A5 */}
      <PrintA5Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        frameState={printModalFrame}
        photoId={currentId}
      />

      {/* Modal Kamera */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Panel Admin: Akses Semua Foto Pengguna & Template Desain */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          fetchCustomTemplates();
        }}
        onLogout={handleAdminLogout}
        onPrintA5={handleAdminPrintSingle}
        onPrintAllA5={handleAdminPrintAll}
        onSelectTemplateForEditor={(tplId, customTpl) => {
          handleTemplateSelect(tplId, customTpl);
        }}
      />

      {/* Modal Login Admin */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181a20] border border-amber-400/40 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
