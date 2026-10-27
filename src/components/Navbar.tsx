import React from 'react';
import { Download } from 'lucide-react';

interface NavbarProps {
  onDownload: () => void;
  onOpenGallery: () => void;
  onScrollToTemplates: () => void;
  onScrollToAI: () => void;
  isExporting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onDownload,
  onOpenGallery,
  onScrollToTemplates,
  onScrollToAI,
  isExporting,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d0f12]/90 backdrop-blur-md border-b border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title (single text element wordmark) */}
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>LensaKlip Studio</span>
        </a>

        {/* Zone 2: 4 nav links, 1-2 word labels, single-line */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Kanvas Editor
          </button>
          <button
            onClick={onScrollToTemplates}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Pilihan Template
          </button>
          <button
            onClick={onScrollToAI}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Analisis AI
          </button>
          <button
            onClick={onOpenGallery}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Galeri Disimpan
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onDownload}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-lg transition-all shadow-sm disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Merender...' : 'Unduh Frame'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
