import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Search,
  Printer,
  Download,
  Trash2,
  RefreshCw,
  X,
  FileImage,
  ArrowLeft,
  Calendar,
  LogOut,
  Palette,
  Upload,
  Plus,
  Edit3,
  Check,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { FrameState, CustomTemplate, FontStyleType } from '../types/editor';
import { FrameCanvas } from './FrameCanvas';
import { TypographyEditor } from './TypographyEditor';
import { exportFrameToImage } from '../utils/canvasExporter';

export interface StoredPhoto {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  template: string;
  bgColor?: string;
  textColor?: string;
  font?: string;
  fontSize?: number;
  fontStyle?: FontStyleType;
  textAlign?: 'left' | 'center' | 'right';
  createdAt: string;
  author?: string;
  dimensions?: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onPrintA5: (photo: StoredPhoto) => void;
  onPrintAllA5: (photos: StoredPhoto[]) => void;
  onSelectTemplateForEditor?: (templateId: string, customTpl?: CustomTemplate) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  onLogout,
  onPrintA5,
  onPrintAllA5,
  onSelectTemplateForEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'templates'>('photos');
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteTplConfirmId, setDeleteTplConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit Photo Modal State
  const [editingPhoto, setEditingPhoto] = useState<StoredPhoto | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    template: string;
    font: string;
    fontSize: number;
    textColor: string;
    fontStyle: FontStyleType;
    textAlign: 'left' | 'center' | 'right';
    bgColor: string;
  }>({
    title: '',
    description: '',
    template: 'polaroid_classic',
    font: 'caveat',
    fontSize: 22,
    textColor: '#2B2B2B',
    fontStyle: 'normal',
    textAlign: 'center',
    bgColor: '#FAF8F5',
  });
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // New Template Upload State
  const [newTplName, setNewTplName] = useState('');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplFrameImage, setNewTplFrameImage] = useState<string>('');
  const [newTplBgColor, setNewTplBgColor] = useState('#FAF8F5');
  const [newTplFont, setNewTplFont] = useState('caveat');
  const [newTplFontSize, setNewTplFontSize] = useState(24);
  const [newTplTextColor, setNewTplTextColor] = useState('#1E293B');
  const [newTplFontStyle, setNewTplFontStyle] = useState<FontStyleType>('normal');
  const [newTplTextAlign, setNewTplTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const templateFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch photos and custom templates with localStorage redundancy
  const fetchData = async () => {
    setLoading(true);
    try {
      let photosData: StoredPhoto[] = [];
      let templatesData: CustomTemplate[] = [];

      try {
        const [resPhotos, resTemplates] = await Promise.all([
          fetch('/api/photos'),
          fetch('/api/templates'),
        ]);
        if (resPhotos.ok) {
          photosData = await resPhotos.json();
        }
        if (resTemplates.ok) {
          templatesData = await resTemplates.json();
        }
      } catch (err) {
        console.warn('Server offline / cold start:', err);
      }

      // Merge with localStorage (ensures photos & templates persist reliably on Vercel)
      try {
        const localPhotosRaw = localStorage.getItem('lensaklip_saved_photos');
        if (localPhotosRaw) {
          const localPhotos: StoredPhoto[] = JSON.parse(localPhotosRaw);
          const map = new Map<string, StoredPhoto>();
          photosData.forEach((p) => map.set(p.id, p));
          localPhotos.forEach((p) => map.set(p.id, p));
          photosData = Array.from(map.values());
        }

        const localTplRaw = localStorage.getItem('lensaklip_custom_templates');
        if (localTplRaw) {
          const localTpls: CustomTemplate[] = JSON.parse(localTplRaw);
          const map = new Map<string, CustomTemplate>();
          templatesData.forEach((t) => map.set(t.id, t));
          localTpls.forEach((t) => map.set(t.id, t));
          templatesData = Array.from(map.values());
        }
      } catch (e) {
        // ignore
      }

      setPhotos(photosData);
      setTemplates(templatesData);
    } catch (err) {
      console.error('Gagal mengambil data admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Handle delete photo
  const handleDeletePhoto = async (id: string) => {
    try {
      // 1. Remove from localStorage
      try {
        const stored = localStorage.getItem('lensaklip_saved_photos');
        if (stored) {
          const list: StoredPhoto[] = JSON.parse(stored);
          const filtered = list.filter((p) => p.id !== id);
          localStorage.setItem('lensaklip_saved_photos', JSON.stringify(filtered));
        }
      } catch (e) {}

      // 2. Call server API
      try {
        await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      } catch (e) {}

      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      showToast('Foto berhasil dihapus.');
    } catch (err) {
      console.error('Gagal menghapus foto:', err);
    }
  };

  // Handle single photo download
  const handleDownloadSingle = async (photo: StoredPhoto) => {
    setDownloadingId(photo.id);
    try {
      const matchedTpl = templates.find((t) => t.id === photo.template);
      const dummyFrameState: FrameState = {
        imageSrc: photo.imageSrc,
        template: photo.template || 'polaroid_classic',
        customTemplateData: matchedTpl,
        title: photo.title,
        caption: photo.description,
        subCaption: new Date(photo.createdAt).toLocaleDateString('id-ID'),
        selectedCategory: 'aesthetic',
        font: photo.font || 'caveat',
        fontSize: photo.fontSize || 22,
        textColor: photo.textColor || '#2B2B2B',
        fontStyle: photo.fontStyle || 'normal',
        textAlign: photo.textAlign || 'center',
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

      const dataUrl = await exportFrameToImage(dummyFrameState, 2);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `A5-${photo.title.replace(/\s+/g, '_') || 'foto'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Gambar A5 berhasil diunduh.');
    } catch (err) {
      console.error('Gagal mengunduh foto:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Open Edit Photo Modal
  const handleOpenEditPhoto = (photo: StoredPhoto) => {
    setEditingPhoto(photo);
    setEditForm({
      title: photo.title || '',
      description: photo.description || '',
      template: photo.template || 'polaroid_classic',
      font: photo.font || 'caveat',
      fontSize: photo.fontSize || 22,
      textColor: photo.textColor || '#2B2B2B',
      fontStyle: photo.fontStyle || 'normal',
      textAlign: photo.textAlign || 'center',
      bgColor: photo.bgColor || '#FAF8F5',
    });
  };

  // Save Photo Edit to server and localStorage
  const handleSavePhotoEdit = async () => {
    if (!editingPhoto) return;
    setIsSavingPhoto(true);

    // Update in localStorage
    try {
      const stored = localStorage.getItem('lensaklip_saved_photos');
      if (stored) {
        const list: StoredPhoto[] = JSON.parse(stored);
        const idx = list.findIndex((p) => p.id === editingPhoto.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...editForm };
          localStorage.setItem('lensaklip_saved_photos', JSON.stringify(list));
        }
      }
    } catch (e) {}

    try {
      await fetch(`/api/photos/${editingPhoto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      setPhotos((prev) =>
        prev.map((p) => (p.id === editingPhoto.id ? { ...p, ...editForm } : p))
      );
      setEditingPhoto(null);
      showToast('Perubahan tulisan & gaya foto berhasil disimpan!');
    } catch (err) {
      console.error('Gagal update foto:', err);
      // Still update UI and local state even if server is offline
      setPhotos((prev) =>
        prev.map((p) => (p.id === editingPhoto.id ? { ...p, ...editForm } : p))
      );
      setEditingPhoto(null);
      showToast('Perubahan disimpan di perangkat.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Handle Template Frame File Upload
  const handleTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setNewTplFrameImage(base64);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Save New Custom Template (with localStorage backup)
  const handleSaveNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) {
      showToast('Nama template tidak boleh kosong.');
      return;
    }

    setIsSavingTemplate(true);
    const templateId = `custom_tpl_${Date.now()}`;
    const newTemplatePayload: CustomTemplate = {
      id: templateId,
      name: newTplName.trim(),
      description: newTplDesc.trim(),
      frameImage: newTplFrameImage,
      layoutType: 'polaroid',
      defaultBg: newTplBgColor,
      defaultFont: newTplFont,
      defaultFontSize: newTplFontSize,
      defaultTextColor: newTplTextColor,
      defaultFontStyle: newTplFontStyle,
      defaultTextAlign: newTplTextAlign,
      createdAt: new Date().toISOString(),
      author: 'Admin',
    };

    // Save to localStorage
    try {
      const stored = localStorage.getItem('lensaklip_custom_templates');
      const list: CustomTemplate[] = stored ? JSON.parse(stored) : [];
      list.unshift(newTemplatePayload);
      localStorage.setItem('lensaklip_custom_templates', JSON.stringify(list));
    } catch (e) {}

    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplatePayload),
      });

      setTemplates((prev) => [newTemplatePayload, ...prev]);
      setNewTplName('');
      setNewTplDesc('');
      setNewTplFrameImage('');
      setNewTplBgColor('#FAF8F5');
      setNewTplFont('caveat');
      setNewTplFontSize(24);
      setNewTplTextColor('#1E293B');
      setNewTplFontStyle('normal');
      showToast('Template baru berhasil diunggah & disimpan!');
    } catch (err) {
      console.error('Gagal upload template ke server:', err);
      setTemplates((prev) => [newTemplatePayload, ...prev]);
      setNewTplName('');
      setNewTplDesc('');
      setNewTplFrameImage('');
      showToast('Template disimpan secara lokal.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Delete Custom Template (from server and localStorage)
  const handleDeleteTemplate = async (id: string) => {
    try {
      // 1. Remove from localStorage
      try {
        const stored = localStorage.getItem('lensaklip_custom_templates');
        if (stored) {
          const list: CustomTemplate[] = JSON.parse(stored);
          const filtered = list.filter((t) => t.id !== id);
          localStorage.setItem('lensaklip_custom_templates', JSON.stringify(filtered));
        }
      } catch (e) {}

      // 2. Call server
      try {
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      } catch (e) {}

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeleteTplConfirmId(null);
      showToast('Template berhasil dihapus.');
    } catch (err) {
      console.error('Gagal menghapus template:', err);
    }
  };

  if (!isOpen) return null;

  const filteredPhotos = photos.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-40 bg-[#0d0f12] text-slate-100 flex flex-col animate-fade-in overflow-hidden">
      {/* Header Panel Admin */}
      <header className="border-b border-white/10 bg-[#14161b] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Kembali ke Mode Pengguna"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h1 className="text-base font-bold text-white tracking-tight">
                Panel Admin — Manajemen Cetak & Template Desain
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Kelola foto pengguna, upload template kustom, dan atur tipografi tulisan.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors cursor-pointer"
          >
            Ke Editor
          </button>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Keluar dari sesi administrator"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-[#111317] border-b border-white/5 px-4 sm:px-6 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('photos')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'photos'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileImage className="w-4 h-4" />
          <span>Galeri & Cetak Foto Pengguna</span>
          <span className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full font-mono text-slate-300">
            {photos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Upload & Kelola Template Desain</span>
          <span className="ml-1 text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded-full font-mono text-amber-300">
            {templates.length}
          </span>
        </button>
      </div>

      {/* TAB 1: GALERI FOTO PENGGUNA */}
      {activeTab === 'photos' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar & Search */}
          <div className="bg-[#101216] border-b border-white/5 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul atau deskripsi foto..."
                className="w-full text-xs bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3">
              {filteredPhotos.length > 0 && (
                <button
                  onClick={() => onPrintAllA5(filteredPhotos)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cetak Foto A5 ({filteredPhotos.length})</span>
                </button>
              )}

              <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Format Standar: A5 (148 x 210 mm)</span>
              </div>
            </div>
          </div>

          {/* Photos Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="py-24 text-center text-slate-400 animate-pulse">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-amber-400" />
                <p className="text-xs">Memuat galeri foto...</p>
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="py-24 text-center text-slate-500">
                <FileImage className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold text-slate-400">Belum ada foto pengguna</p>
                <p className="text-xs text-slate-500 mt-1">
                  Foto yang diunggah oleh pengguna akan otomatis tersimpan dan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="bg-[#15181e] border border-white/10 rounded-xl overflow-hidden shadow-lg flex flex-col hover:border-white/20 transition-all group"
                  >
                    {/* Thumbnail Preview */}
                    <div className="relative aspect-[148/210] bg-black/60 p-3 flex items-center justify-center overflow-hidden">
                      <img
                        src={photo.imageSrc}
                        alt={photo.title}
                        className="w-full h-full object-cover rounded-sm shadow-md"
                      />
                      <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-xs text-[10px] font-mono text-amber-300 px-2 py-0.5 rounded border border-white/10">
                        A5
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="text-sm font-bold text-white truncate" title={photo.title}>
                          {photo.title || 'Foto Tanpa Judul'}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {photo.description || 'Tidak ada deskripsi.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(photo.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="uppercase text-[10px] text-amber-300 font-mono">
                          {photo.template.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Action Buttons for this photo */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        {/* Print A5 */}
                        <button
                          onClick={() => onPrintA5(photo)}
                          className="py-1.5 px-2 text-xs font-semibold bg-amber-400/15 text-amber-300 hover:bg-amber-400 hover:text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Cetak foto ini ukuran A5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print A5</span>
                        </button>

                        {/* Edit Tulisan & Gaya */}
                        <button
                          onClick={() => handleOpenEditPhoto(photo)}
                          className="py-1.5 px-2 text-xs font-semibold bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Edit mode tulisan: font, warna, gaya, ukuran"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit Gaya</span>
                        </button>

                        {/* Download A5 */}
                        <button
                          onClick={() => handleDownloadSingle(photo)}
                          disabled={downloadingId === photo.id}
                          className="py-1.5 px-2 text-xs font-medium bg-white/5 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Unduh file gambar A5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </button>

                        {/* Delete */}
                        {deleteConfirmId === photo.id ? (
                          <div className="col-span-2 flex items-center justify-between bg-red-500/15 border border-red-500/30 rounded-lg px-2 py-1.5 text-xs animate-fade-in">
                            <span className="text-red-300 font-medium">Hapus?</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Ya
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-0.5 bg-white/10 text-slate-300 rounded text-[11px] cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(photo.id)}
                            className="py-1.5 px-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                            title="Hapus foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="ml-1 text-[11px]">Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD & KELOLA TEMPLATE DESAIN */}
      {activeTab === 'templates' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* Section 1: Form Upload Template Baru */}
          <div className="bg-[#14161b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <span>Upload Template Desain Baru</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Admin dapat mengunggah bingkai/border kustom dan mengatur format tulisan default (font, warna, gaya, ukuran) untuk template ini.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveNewTemplate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Upload Border / Frame Graphic */}
                <div className="md:col-span-5 space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    1. Gambar Bingkai / Overlay Template
                  </label>

                  <input
                    ref={templateFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleTemplateFileUpload}
                    className="hidden"
                  />

                  {newTplFrameImage ? (
                    <div className="relative aspect-[148/210] bg-black/40 border border-white/20 rounded-xl overflow-hidden flex items-center justify-center p-3">
                      <img
                        src={newTplFrameImage}
                        alt="Pratinjau Bingkai"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setNewTplFrameImage('')}
                        className="absolute top-3 right-3 p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-xs cursor-pointer shadow-md"
                        title="Hapus gambar bingkai"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => templateFileInputRef.current?.click()}
                      className="aspect-[148/210] border-2 border-dashed border-white/15 hover:border-amber-400/50 hover:bg-white/[0.02] rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
                    >
                      <Upload className="w-8 h-8 text-amber-400 mb-2" />
                      <p className="text-xs font-semibold text-white">
                        Klik untuk unggah desain bingkai (A5)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PNG transparan atau gambar frame dekoratif
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Warna Background Bingkai (HEX)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTplBgColor}
                        onChange={(e) => setNewTplBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-white/20 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={newTplBgColor}
                        onChange={(e) => setNewTplBgColor(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Nama & Konfigurasi Mode Tulisan Template */}
                <div className="md:col-span-7 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                      2. Identitas Template
                    </label>
                    <input
                      type="text"
                      value={newTplName}
                      onChange={(e) => setNewTplName(e.target.value)}
                      placeholder="Contoh: Bingkai Kenangan Sekolah A5, Piagam Emas..."
                      className="w-full text-sm font-semibold bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      required
                    />
                    <input
                      type="text"
                      value={newTplDesc}
                      onChange={(e) => setNewTplDesc(e.target.value)}
                      placeholder="Deskripsi singkat (opsional)..."
                      className="w-full text-xs bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Mode Tulisan Bawaan Template */}
                  <div className="border border-white/10 bg-white/[0.02] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>3. Mode Tulisan Default Template</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Font, warna, style & ukuran
                      </span>
                    </div>

                    <TypographyEditor
                      font={newTplFont}
                      fontSize={newTplFontSize}
                      textColor={newTplTextColor}
                      fontStyle={newTplFontStyle}
                      textAlign={newTplTextAlign}
                      onChange={(updates) => {
                        if (updates.font !== undefined) setNewTplFont(updates.font);
                        if (updates.fontSize !== undefined) setNewTplFontSize(updates.fontSize);
                        if (updates.textColor !== undefined) setNewTplTextColor(updates.textColor);
                        if (updates.fontStyle !== undefined) setNewTplFontStyle(updates.fontStyle);
                        if (updates.textAlign !== undefined) setNewTplTextAlign(updates.textAlign);
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSavingTemplate || !newTplName.trim()}
                    className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSavingTemplate ? 'Menyimpan Template...' : 'Simpan & Publikasikan Template'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section 2: Daftar Template Kustom yang Tersedia */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Daftar Template Kustom Buatan Admin ({templates.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Template ini dapat dipilih oleh pengguna saat mendesain foto ukuran A5.
                </p>
              </div>
            </div>

            {templates.length === 0 ? (
              <div className="p-8 border border-white/10 rounded-2xl bg-[#14161b] text-center text-slate-400 text-xs">
                Belum ada template kustom yang diunggah. Buat template pertama Anda di atas!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-[#14161b] border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-white/20 transition-all shadow-lg"
                  >
                    <div className="space-y-3">
                      {/* Thumbnail frame */}
                      <div className="aspect-[148/210] max-h-48 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 relative">
                        {tpl.frameImage ? (
                          <img
                            src={tpl.frameImage}
                            alt={tpl.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: tpl.defaultBg, color: tpl.defaultTextColor }}
                          >
                            <span style={{ fontSize: `${tpl.defaultFontSize}px` }}>{tpl.name}</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 text-[9px] bg-black/75 px-1.5 py-0.5 rounded font-mono text-amber-300">
                          A5
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white">{tpl.name}</h4>
                        {tpl.description && (
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{tpl.description}</p>
                        )}
                      </div>

                      {/* Typography Specs */}
                      <div className="bg-white/5 rounded-lg p-2.5 text-[11px] text-slate-300 space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Font:</span>
                          <span className="text-amber-300 capitalize">{tpl.defaultFont}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Warna Teks:</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ backgroundColor: tpl.defaultTextColor }}
                            />
                            <span>{tpl.defaultTextColor}</span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Ukuran / Style:</span>
                          <span>
                            {tpl.defaultFontSize}px • {tpl.defaultFontStyle || 'normal'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      {onSelectTemplateForEditor && (
                        <button
                          onClick={() => {
                            onSelectTemplateForEditor(tpl.id, tpl);
                            onClose();
                          }}
                          className="flex-1 py-1.5 px-2 bg-amber-400/15 hover:bg-amber-400 hover:text-slate-950 text-amber-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Gunakan</span>
                        </button>
                      )}

                      {deleteTplConfirmId === tpl.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => setDeleteTplConfirmId(null)}
                            className="px-2 py-1 bg-white/10 text-slate-300 rounded text-[11px] cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteTplConfirmId(tpl.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                          title="Hapus template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT PHOTO MODAL (FONT, WARNA, STYLE, UKURAN) */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#14161b] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Edit Tulisan & Gaya Foto: {editingPhoto.title || 'Foto Pengguna'}
                </h3>
              </div>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Left Preview, Right Controls */}
            <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live A5 Preview with edits */}
              <div className="md:col-span-5 flex flex-col items-center space-y-2">
                <div className="w-full max-w-[240px] aspect-[148/210] bg-white rounded shadow-xl overflow-hidden border border-black/10">
                  <FrameCanvas
                    frameState={{
                      imageSrc: editingPhoto.imageSrc,
                      template: editForm.template,
                      customTemplateData: templates.find((t) => t.id === editForm.template),
                      title: editForm.title,
                      caption: editForm.description,
                      subCaption: '',
                      selectedCategory: 'aesthetic',
                      font: editForm.font,
                      fontSize: editForm.fontSize,
                      textColor: editForm.textColor,
                      fontStyle: editForm.fontStyle,
                      textAlign: editForm.textAlign,
                      bgColor: editForm.bgColor,
                      filter: 'none',
                      accent: 'tape_top',
                      aspectRatio: '1:1',
                      zoom: 1,
                      panX: 0,
                      panY: 0,
                      showDate: false,
                      dateText: '',
                    }}
                    isInteractive={false}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Pratinjau Langsung A5
                </span>
              </div>

              {/* Right Column: Edit Controls */}
              <div className="md:col-span-7 space-y-4">
                {/* Judul & Deskripsi */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Judul Foto
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full text-xs font-semibold bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Deskripsi Foto
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full text-xs bg-white/5 border border-white/10 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>
                </div>

                {/* Pilihan Template */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Gaya Template
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'polaroid_classic', name: 'Polaroid' },
                      { id: 'minimalist_white', name: 'Minimalis' },
                      { id: 'film_strip', name: 'Film Strip' },
                      { id: 'journal_kraft', name: 'Jurnal' },
                      ...templates.map((t) => ({ id: t.id, name: t.name })),
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, template: t.id })}
                        className={`p-1.5 rounded-lg border text-xs font-medium truncate cursor-pointer transition-colors ${
                          editForm.template === t.id
                            ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                            : 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-400'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Editor: Font, Warna, Style, Ukuran */}
                <div className="border border-white/10 bg-white/[0.02] rounded-xl p-3.5 space-y-2">
                  <span className="text-xs font-bold text-amber-300 block">
                    Kustomisasi Mode Tulisan (Font, Warna, Style, Ukuran)
                  </span>
                  <TypographyEditor
                    font={editForm.font}
                    fontSize={editForm.fontSize}
                    textColor={editForm.textColor}
                    fontStyle={editForm.fontStyle}
                    textAlign={editForm.textAlign}
                    onChange={(updates) => setEditForm({ ...editForm, ...updates })}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePhotoEdit}
                disabled={isSavingPhoto}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingPhoto ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-60 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
