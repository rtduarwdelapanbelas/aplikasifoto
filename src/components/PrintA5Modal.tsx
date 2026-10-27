import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { FrameState } from '../types/editor';
import { exportFrameToImage } from '../utils/canvasExporter';

interface PrintA5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  frameState: FrameState | null;
  photoId?: string;
}

export const PrintA5Modal: React.FC<PrintA5ModalProps> = ({
  isOpen,
  onClose,
  frameState,
  photoId,
}) => {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const safePhotoId = photoId || `photo_${Date.now()}`;

  // Check if embedded in iframe where browser blocks modal dialogs like window.print()
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  useEffect(() => {
    if (!isOpen || !frameState) {
      setPreviewDataUrl(null);
      setPrintStatus(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    // Export frame at crisp 2x resolution (ISO A5 proportion 148 x 210 mm)
    exportFrameToImage(frameState, 2)
      .then((url) => {
        if (isMounted) {
          setPreviewDataUrl(url);
          setIsGenerating(false);

          // Sync rendered canvas to server cache for instant standalone tab printing
          fetch('/api/print-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: safePhotoId, dataUrl: url }),
          }).catch((err) => console.warn('Gagal sync print preview:', err));
        }
      })
      .catch((err) => {
        console.error('Gagal render cetak:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, frameState, safePhotoId]);

  if (!isOpen || !frameState) return null;

  // 1. Download ISO A5 Standard PDF (148 x 210 mm)
  const handleDownloadPdf = () => {
    if (!previewDataUrl) return;
    setIsExportingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
        compress: true,
      });

      // Fit 100% to A5 boundaries
      pdf.addImage(previewDataUrl, 'PNG', 0, 0, 148, 210, undefined, 'FAST');
      const safeTitle = (frameState.title || 'Foto').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Cetak_A5_${safeTitle}.pdf`);

      setPrintStatus('Dokumen PDF A5 berhasil diunduh! Siap dicetak langsung ke printer.');
      setTimeout(() => setPrintStatus(null), 5000);
    } catch (err) {
      console.error('Gagal membuat file PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 2. Direct browser print (with auto-PDF fallback if in iframe sandbox)
  const handleDirectPrint = () => {
    if (!previewDataUrl) return;

    try {
      window.focus();
      window.print();
    } catch (err) {
      console.warn('window.print error:', err);
    }

    if (isInIframe) {
      // In sandboxed preview iframes, Chromium suppresses the print dialog modal.
      // Automatically download the PDF A5 file so the user gets their printable document immediately!
      handleDownloadPdf();
      setPrintStatus(
        'Karena mode pratinjau browser, file PDF A5 resmi telah otomatis diunduh untuk printer Anda!'
      );
    } else {
      setPrintStatus('Membuka dialog cetak printer browser...');
      setTimeout(() => setPrintStatus(null), 4000);
    }
  };

  // 3. Download high-res PNG
  const handleDownloadPng = () => {
    if (!previewDataUrl) return;
    const link = document.createElement('a');
    link.href = previewDataUrl;
    const safeTitle = (frameState.title || 'Foto').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `A5_Foto_${safeTitle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setPrintStatus('Gambar A5 resolusi tinggi (PNG) berhasil diunduh.');
    setTimeout(() => setPrintStatus(null), 4000);
  };

  const printStandaloneUrl = `/print/${encodeURIComponent(safePhotoId)}`;

  return (
    <>
      {/* Direct A5 Print Portal rendered straight into document.body */}
      {previewDataUrl &&
        createPortal(
          <div id="a5-print-portal">
            <img src={previewDataUrl} alt="Cetak A5 LensaKlip" />
          </div>,
          document.body
        )}

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#14161b] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
          {/* Header */}
          <div className="p-4 px-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Cetak Lembaran A5 (148 x 210 mm)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Format resmi portrait ISO 216 siap cetak
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 flex-1 overflow-y-auto flex flex-col items-center space-y-4">
            {/* Pratinjau Lembaran A5 */}
            <div className="relative w-full max-w-[230px] sm:max-w-[250px] aspect-[148/210] bg-white rounded shadow-2xl overflow-hidden border border-black/10 flex items-center justify-center">
              {isGenerating ? (
                <div className="text-center text-slate-500 text-xs p-4 animate-pulse">
                  <Printer className="w-8 h-8 mx-auto mb-2 text-amber-400 animate-spin" />
                  <span>Menyiapkan resolusi cetak A5...</span>
                </div>
              ) : previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Pratinjau A5"
                  className="w-full h-full object-contain"
                />
              ) : null}

              {/* Tag Ukuran A5 */}
              <div className="absolute bottom-1 right-1.5 text-[8px] font-mono text-black/35 pointer-events-none uppercase tracking-wider">
                148 x 210 mm
              </div>
            </div>

            {/* Status Pesan */}
            {printStatus && (
              <div className="w-full p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{printStatus}</span>
              </div>
            )}

            {/* Iframe Notice & Standalone Tab Call-to-Action */}
            {isInIframe && (
              <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-slate-200 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300 text-xs">
                      Mengapa dialog printer tidak terbuka langsung di sini?
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                      Sistem keamanan browser membatasi jendela dialog printer di dalam frame pratinjau editor.
                      Pilih salah satu solusi mudah di bawah ini:
                    </p>
                  </div>
                </div>

                {/* Tombol Utama: Buka Tab Baru untuk Cetak Langsung */}
                <a
                  href={printStandaloneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  title="Membuka halaman mandiri di tab baru yang otomatis memunculkan dialog cetak printer Anda"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Dialog Printer (Tab Baru Mandiri)</span>
                </a>
              </div>
            )}

            {/* Info Format Cetak */}
            <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] text-slate-300">
                  Ukuran Fisik Kertas: <strong>148 mm × 210 mm (A5 Portrait)</strong>
                </span>
              </div>
              <span className="font-mono text-amber-300 text-[10px] bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                100% Presisi
              </span>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="p-4 px-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row gap-2.5">
            {/* Tombol 1: Unduh PDF A5 (Format Paling Akurat Untuk Printer) */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating || isExportingPdf || !previewDataUrl}
              className="flex-1 py-2.5 px-3 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              title="Unduh dokumen PDF ukuran A5 resmi siap cetak langsung"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPdf ? 'Menyusun PDF...' : 'Unduh PDF A5 (Siap Cetak)'}</span>
            </button>

            {/* Tombol 2: Unduh Gambar PNG */}
            <button
              onClick={handleDownloadPng}
              disabled={isGenerating || !previewDataUrl}
              className="py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              title="Unduh file gambar PNG resolusi tinggi"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Unduh PNG</span>
            </button>

            {/* Tombol 3: Cetak Langsung Browser / Fallback */}
            <button
              onClick={handleDirectPrint}
              disabled={isGenerating || !previewDataUrl}
              className="py-2.5 px-3.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              title="Kirim perintah cetak langsung"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
