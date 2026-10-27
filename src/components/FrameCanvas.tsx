import React, { useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { FrameState } from '../types/editor';
import { FONT_OPTIONS, FILTER_OPTIONS } from '../data/presets';

interface FrameCanvasProps {
  frameState: FrameState;
  onUpdateState?: (updates: Partial<FrameState>) => void;
  onPhotoClick?: () => void;
  isInteractive?: boolean;
  isPrintMode?: boolean;
}

export const FrameCanvas: React.FC<FrameCanvasProps> = ({
  frameState,
  onUpdateState,
  onPhotoClick,
  isInteractive = true,
  isPrintMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedFont = FONT_OPTIONS.find((f) => f.id === frameState.font) || FONT_OPTIONS[0];
  const selectedFilter = FILTER_OPTIONS.find((f) => f.id === frameState.filter) || FILTER_OPTIONS[0];

  const imgStyle: React.CSSProperties = {
    filter: selectedFilter.cssFilter,
    transform: `scale(${frameState.zoom}) translate(${frameState.panX}px, ${frameState.panY}px)`,
    transformOrigin: 'center center',
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none w-full ${
        isPrintMode ? 'p-0 w-[148mm] h-[210mm]' : 'p-2 sm:p-4'
      }`}
    >
      <div
        ref={containerRef}
        className={`relative transition-all duration-300 ease-out shadow-2xl rounded-sm w-full aspect-[148/210] flex flex-col justify-between overflow-hidden ${
          isPrintMode ? 'w-[148mm] h-[210mm] max-w-none shadow-none border-0' : 'max-w-[400px]'
        }`}
        style={{
          backgroundColor: frameState.bgColor,
        }}
      >
        {frameState.template === 'polaroid_classic' && (
          <PolaroidFrame
            frameState={frameState}
            selectedFont={selectedFont}
            imgStyle={imgStyle}
            onUpdateState={onUpdateState}
            onPhotoClick={onPhotoClick}
            isInteractive={isInteractive}
            isPrintMode={isPrintMode}
          />
        )}

        {frameState.template === 'minimalist_white' && (
          <MinimalistFrame
            frameState={frameState}
            selectedFont={selectedFont}
            imgStyle={imgStyle}
            onPhotoClick={onPhotoClick}
            isPrintMode={isPrintMode}
          />
        )}

        {frameState.template === 'film_strip' && (
          <FilmStripFrame
            frameState={frameState}
            selectedFont={selectedFont}
            imgStyle={imgStyle}
            onPhotoClick={onPhotoClick}
            isPrintMode={isPrintMode}
          />
        )}

        {frameState.template === 'journal_kraft' && (
          <JournalKraftFrame
            frameState={frameState}
            selectedFont={selectedFont}
            imgStyle={imgStyle}
            onPhotoClick={onPhotoClick}
            isPrintMode={isPrintMode}
          />
        )}

        {!['polaroid_classic', 'minimalist_white', 'film_strip', 'journal_kraft'].includes(frameState.template) && (
          <CustomUploadedFrame
            frameState={frameState}
            selectedFont={selectedFont}
            imgStyle={imgStyle}
            onPhotoClick={onPhotoClick}
            isPrintMode={isPrintMode}
          />
        )}

        {/* Small subtle A5 watermark tag for preview */}
        {!isPrintMode && (
          <div className="absolute bottom-1 right-2 pointer-events-none text-[9px] font-mono text-black/25">
            Ukuran Cetak A5
          </div>
        )}
      </div>
    </div>
  );
};

// 1. Polaroid Classic Frame (A5 Formatted)
const PolaroidFrame: React.FC<{
  frameState: FrameState;
  selectedFont: any;
  imgStyle: React.CSSProperties;
  onUpdateState?: (u: Partial<FrameState>) => void;
  onPhotoClick?: () => void;
  isInteractive: boolean;
  isPrintMode?: boolean;
}> = ({ frameState, selectedFont, imgStyle, onPhotoClick, isPrintMode }) => {
  return (
    <div
      className={`h-full w-full flex flex-col justify-between text-slate-800 relative paper-texture ${
        isPrintMode ? 'p-8 pb-10' : 'p-5 sm:p-6 pb-7 sm:pb-8'
      }`}
    >
      {/* Tape Accent */}
      {frameState.accent === 'tape_top' && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-white/60 backdrop-blur-xs border border-white/40 shadow-xs rotate-[-1deg] z-20 pointer-events-none" />
      )}

      {/* Photo Area */}
      <div
        onClick={!frameState.imageSrc ? onPhotoClick : undefined}
        className={`relative overflow-hidden w-full aspect-square bg-slate-900 shadow-inner rounded-[2px] border border-black/5 shrink-0 ${
          !frameState.imageSrc && onPhotoClick ? 'cursor-pointer hover:bg-slate-800 transition-colors' : ''
        }`}
      >
        {frameState.imageSrc ? (
          <>
            <img
              src={frameState.imageSrc}
              alt={frameState.title || 'Foto Polaroid'}
              className="w-full h-full object-cover transition-transform duration-150"
              style={imgStyle}
              draggable={false}
            />
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.15)]" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <ImageIcon className="w-8 h-8 text-amber-400/80 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">Belum ada foto</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Klik di sini atau upload di panel kanan</span>
          </div>
        )}
      </div>

      {/* Judul & Deskripsi Foto (A5 Lower Section) */}
      <div className="flex-1 mt-3 sm:mt-4 text-center flex flex-col justify-center space-y-1 px-1">
        {frameState.title ? (
          <h3
            className={`font-bold tracking-tight leading-snug ${selectedFont.className}`}
            style={{
              fontSize: `${Math.round(frameState.fontSize * 1.15)}px`,
              color: frameState.textColor,
              textAlign: frameState.textAlign,
            }}
          >
            {frameState.title}
          </h3>
        ) : (
          <div className="text-xs italic text-slate-400 opacity-60">
            [Judul Foto]
          </div>
        )}

        {frameState.caption ? (
          <p
            className={`leading-snug opacity-90 ${selectedFont.className}`}
            style={{
              fontSize: `${frameState.fontSize}px`,
              color: frameState.textColor,
              textAlign: frameState.textAlign,
            }}
          >
            {frameState.caption}
          </p>
        ) : (
          <div className="text-[11px] italic text-slate-400 opacity-40">
            [Deskripsi foto A5]
          </div>
        )}

        {frameState.showDate && (
          <div className="text-right text-[11px] font-mono opacity-40 pr-1 tracking-wider pt-1">
            {frameState.dateText || "'26 10 26"}
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Minimalist White Frame (A5 Formatted)
const MinimalistFrame: React.FC<{
  frameState: FrameState;
  selectedFont: any;
  imgStyle: React.CSSProperties;
  onPhotoClick?: () => void;
  isPrintMode?: boolean;
}> = ({ frameState, selectedFont, imgStyle, onPhotoClick, isPrintMode }) => {
  return (
    <div
      className={`h-full w-full flex flex-col justify-between border border-black/5 bg-white shadow-xl relative ${
        isPrintMode ? 'p-10 pb-12' : 'p-6 sm:p-7 pb-7 sm:pb-8'
      }`}
    >
      <div
        onClick={!frameState.imageSrc ? onPhotoClick : undefined}
        className={`relative overflow-hidden w-full aspect-[4/5] bg-slate-100 border border-black/10 shrink-0 ${
          !frameState.imageSrc && onPhotoClick ? 'cursor-pointer hover:bg-slate-200 transition-colors' : ''
        }`}
      >
        {frameState.imageSrc ? (
          <img
            src={frameState.imageSrc}
            alt={frameState.title || 'Foto Minimalis'}
            className="w-full h-full object-cover transition-transform duration-150"
            style={imgStyle}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-500">
            <ImageIcon className="w-8 h-8 text-slate-400 mb-1.5" />
            <span className="text-xs font-semibold text-slate-700">Belum ada foto</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Klik di sini atau upload di panel kanan</span>
          </div>
        )}
      </div>

      <div className="flex-1 mt-4 text-center flex flex-col justify-center space-y-1 px-2">
        {frameState.title ? (
          <h3
            className={`font-semibold tracking-wide ${selectedFont.className}`}
            style={{
              fontSize: `${Math.round(frameState.fontSize * 1.15)}px`,
              color: frameState.textColor,
              textAlign: frameState.textAlign,
            }}
          >
            {frameState.title}
          </h3>
        ) : (
          <div className="text-xs italic text-slate-400 opacity-60">
            [Judul Foto]
          </div>
        )}

        {frameState.caption ? (
          <p
            className={`text-slate-600 ${selectedFont.className}`}
            style={{
              fontSize: `${frameState.fontSize}px`,
              textAlign: frameState.textAlign,
            }}
          >
            {frameState.caption}
          </p>
        ) : (
          <div className="text-[11px] italic text-slate-400 opacity-40">
            [Deskripsi foto A5]
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Film Strip 35mm Frame (A5 Formatted)
const FilmStripFrame: React.FC<{
  frameState: FrameState;
  selectedFont: any;
  imgStyle: React.CSSProperties;
  onPhotoClick?: () => void;
  isPrintMode?: boolean;
}> = ({ frameState, selectedFont, imgStyle, onPhotoClick }) => {
  return (
    <div className="h-full w-full flex flex-col justify-between p-3.5 sm:p-4 bg-[#111215] text-slate-200 border border-white/5 relative overflow-hidden">
      {/* Top Sprocket Perforations */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={`sprocket-top-${i}`} className="sprocket-hole" />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-[10px] font-mono tracking-widest text-amber-500/90 py-1 uppercase shrink-0">
        <span>FUJIFILM 400</span>
        <span>▶ 24A • ISO 400</span>
      </div>

      {/* Photo */}
      <div
        onClick={!frameState.imageSrc ? onPhotoClick : undefined}
        className={`relative overflow-hidden w-full aspect-[4/3] bg-black border border-white/15 shrink-0 ${
          !frameState.imageSrc && onPhotoClick ? 'cursor-pointer hover:bg-slate-900 transition-colors' : ''
        }`}
      >
        {frameState.imageSrc ? (
          <>
            <img
              src={frameState.imageSrc}
              alt={frameState.title || 'Foto Film'}
              className="w-full h-full object-cover transition-transform duration-150"
              style={imgStyle}
              draggable={false}
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <ImageIcon className="w-8 h-8 text-amber-500/70 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">Belum ada foto</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Klik di sini atau upload di panel kanan</span>
          </div>
        )}
      </div>

      {/* Judul & Caption */}
      <div className="flex-1 mt-2.5 px-2 flex flex-col justify-center space-y-1">
        {frameState.title ? (
          <h3
            className={`font-bold text-amber-400 leading-snug ${selectedFont.className}`}
            style={{
              fontSize: `${Math.round(frameState.fontSize * 1.15)}px`,
              textAlign: frameState.textAlign,
            }}
          >
            {frameState.title}
          </h3>
        ) : (
          <div className="text-xs italic text-slate-400 opacity-60">
            [Judul Foto]
          </div>
        )}

        {frameState.caption ? (
          <p
            className={`leading-snug text-[#F5ECE3] ${selectedFont.className}`}
            style={{
              fontSize: `${frameState.fontSize}px`,
              textAlign: frameState.textAlign,
            }}
          >
            {frameState.caption}
          </p>
        ) : (
          <div className="text-[11px] italic text-slate-400 opacity-40">
            [Deskripsi foto A5]
          </div>
        )}
      </div>

      {/* Bottom Sprocket */}
      <div className="flex items-center justify-between px-2 py-1.5 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={`sprocket-bottom-${i}`} className="sprocket-hole" />
          ))}
        </div>
      </div>
    </div>
  );
};

// 4. Journal Kraft Frame (A5 Formatted)
const JournalKraftFrame: React.FC<{
  frameState: FrameState;
  selectedFont: any;
  imgStyle: React.CSSProperties;
  onPhotoClick?: () => void;
  isPrintMode?: boolean;
}> = ({ frameState, selectedFont, imgStyle, onPhotoClick, isPrintMode }) => {
  return (
    <div
      className={`h-full w-full flex flex-col justify-between kraft-texture text-[#372A1C] shadow-xl border border-amber-900/10 relative overflow-hidden ${
        isPrintMode ? 'p-8' : 'p-5 sm:p-6 pb-6'
      }`}
    >
      <div className="absolute -top-2 left-6 w-20 h-6 bg-[#d6b588]/80 washi-tape rotate-[-4deg] shadow-sm z-10" />

      <div className="p-2.5 bg-white shadow-md rounded-[2px] transform rotate-[-0.5deg] shrink-0">
        <div
          onClick={!frameState.imageSrc ? onPhotoClick : undefined}
          className={`relative overflow-hidden w-full aspect-[4/3] bg-amber-50 ${
            !frameState.imageSrc && onPhotoClick ? 'cursor-pointer hover:bg-amber-100 transition-colors' : ''
          }`}
        >
          {frameState.imageSrc ? (
            <img
              src={frameState.imageSrc}
              alt={frameState.title || 'Foto Jurnal'}
              className="w-full h-full object-cover transition-transform duration-150"
              style={imgStyle}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-amber-900/60">
              <ImageIcon className="w-8 h-8 text-amber-700/60 mb-1.5" />
              <span className="text-xs font-semibold text-amber-900">Belum ada foto</span>
              <span className="text-[10px] text-amber-800/60 mt-0.5">Klik di sini atau upload di panel kanan</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 mt-3 px-1 flex flex-col justify-center space-y-1">
        {frameState.title ? (
          <h3
            className={`font-bold leading-tight ${selectedFont.className}`}
            style={{
              fontSize: `${Math.round(frameState.fontSize * 1.2)}px`,
              color: frameState.textColor,
              textAlign: frameState.textAlign,
            }}
          >
            {frameState.title}
          </h3>
        ) : (
          <div className="text-xs italic text-slate-500 opacity-60">
            [Judul Foto]
          </div>
        )}

        {frameState.caption ? (
          <p
            className={`leading-snug opacity-90 ${selectedFont.className}`}
            style={{
              fontSize: `${frameState.fontSize}px`,
              color: frameState.textColor,
              textAlign: frameState.textAlign,
            }}
          >
            {frameState.caption}
          </p>
        ) : (
          <div className="text-[11px] italic text-slate-500 opacity-40">
            [Deskripsi foto A5]
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to compute responsive typography styling (font style, weight, color, alignment, size)
const getTextStyles = (frameState: FrameState, isTitle: boolean = false): React.CSSProperties => {
  const isBold = frameState.fontStyle === 'bold' || frameState.fontStyle === 'bold_italic';
  const isItalic = frameState.fontStyle === 'italic' || frameState.fontStyle === 'bold_italic';
  const baseSize = isTitle ? Math.round(frameState.fontSize * 1.2) : frameState.fontSize;

  return {
    fontSize: `${baseSize}px`,
    color: frameState.textColor || (isTitle ? '#1e293b' : '#334155'),
    textAlign: frameState.textAlign || 'center',
    fontWeight: isTitle ? (isBold ? 800 : 700) : (isBold ? 700 : 400),
    fontStyle: isItalic ? 'italic' : 'normal',
  };
};

// 5. Custom Uploaded Template Frame (Designed by Admin)
const CustomUploadedFrame: React.FC<{
  frameState: FrameState;
  selectedFont: any;
  imgStyle: React.CSSProperties;
  onPhotoClick?: () => void;
  isPrintMode?: boolean;
}> = ({ frameState, selectedFont, imgStyle, onPhotoClick, isPrintMode }) => {
  const titleStyle = getTextStyles(frameState, true);
  const captionStyle = getTextStyles(frameState, false);
  const overlay = frameState.customTemplateData?.frameImage;

  return (
    <div
      className={`h-full w-full flex flex-col justify-between text-slate-800 relative paper-texture overflow-hidden ${
        isPrintMode ? 'p-8 pb-10' : 'p-5 sm:p-6 pb-7 sm:pb-8'
      }`}
    >
      {/* Custom Frame Border / Overlay uploaded by Admin */}
      {overlay && (
        <img
          src={overlay}
          alt="Bingkai Template"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
        />
      )}

      {/* Photo Area */}
      <div
        onClick={!frameState.imageSrc ? onPhotoClick : undefined}
        className={`relative overflow-hidden w-full aspect-[4/5] sm:aspect-square bg-slate-900 shadow-md rounded-[2px] border border-black/10 shrink-0 ${
          !frameState.imageSrc && onPhotoClick ? 'cursor-pointer hover:bg-slate-800 transition-colors' : ''
        }`}
      >
        {frameState.imageSrc ? (
          <img
            src={frameState.imageSrc}
            alt={frameState.title || 'Foto Frame'}
            className="w-full h-full object-cover transition-transform duration-150"
            style={imgStyle}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <ImageIcon className="w-8 h-8 text-amber-400/80 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">Belum ada foto</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Klik di sini untuk upload</span>
          </div>
        )}
      </div>

      {/* Title & Caption */}
      <div className="flex-1 mt-3 sm:mt-4 flex flex-col justify-center space-y-1 px-2 z-20">
        {frameState.title ? (
          <h3 className={`leading-snug tracking-tight ${selectedFont.className}`} style={titleStyle}>
            {frameState.title}
          </h3>
        ) : (
          <div className="text-xs italic text-slate-400 opacity-60 text-center">[Judul Foto]</div>
        )}

        {frameState.caption ? (
          <p className={`leading-snug opacity-90 ${selectedFont.className}`} style={captionStyle}>
            {frameState.caption}
          </p>
        ) : (
          <div className="text-[11px] italic text-slate-400 opacity-40 text-center">[Deskripsi Foto]</div>
        )}
      </div>
    </div>
  );
};
