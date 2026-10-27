import React from 'react';
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Minus,
  Plus,
} from 'lucide-react';
import { FontOption, FontStyleType } from '../types/editor';
import { FONT_OPTIONS } from '../data/presets';

interface TypographyEditorProps {
  font: string;
  fontSize: number;
  textColor: string;
  fontStyle?: FontStyleType;
  textAlign: 'left' | 'center' | 'right';
  onChange: (updates: {
    font?: string;
    fontSize?: number;
    textColor?: string;
    fontStyle?: FontStyleType;
    textAlign?: 'left' | 'center' | 'right';
  }) => void;
  compact?: boolean;
}

const COLOR_SWATCHES = [
  { label: 'Hitam Pekat', hex: '#111827' },
  { label: 'Abu Klasik', hex: '#374151' },
  { label: 'Cokelat Kayu', hex: '#78350F' },
  { label: 'Emas Hangat', hex: '#D97706' },
  { label: 'Merah Marun', hex: '#991B1B' },
  { label: 'Navy Elegan', hex: '#1E3A8A' },
  { label: 'Hijau Botol', hex: '#14532D' },
  { label: 'Putih Bersih', hex: '#FAF8F5' },
];

export const TypographyEditor: React.FC<TypographyEditorProps> = ({
  font,
  fontSize,
  textColor,
  fontStyle = 'normal',
  textAlign,
  onChange,
  compact = false,
}) => {
  const isBold = fontStyle === 'bold' || fontStyle === 'bold_italic';
  const isItalic = fontStyle === 'italic' || fontStyle === 'bold_italic';

  const toggleBold = () => {
    let next: FontStyleType = 'normal';
    if (!isBold && isItalic) next = 'bold_italic';
    else if (!isBold && !isItalic) next = 'bold';
    else if (isBold && isItalic) next = 'italic';
    else if (isBold && !isItalic) next = 'normal';
    onChange({ fontStyle: next });
  };

  const toggleItalic = () => {
    let next: FontStyleType = 'normal';
    if (!isItalic && isBold) next = 'bold_italic';
    else if (!isItalic && !isBold) next = 'italic';
    else if (isItalic && isBold) next = 'bold';
    else if (isItalic && !isBold) next = 'normal';
    onChange({ fontStyle: next });
  };

  const handleFontSizeChange = (delta: number) => {
    const next = Math.max(12, Math.min(48, (fontSize || 22) + delta));
    onChange({ fontSize: next });
  };

  return (
    <div className={`space-y-4 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* 1. PILIHAN FONT */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>Jenis Font Tulisan</span>
          </span>
          <span className="text-[11px] text-amber-300 font-mono">
            {FONT_OPTIONS.find((f) => f.id === font)?.name || font}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 bg-black/20 rounded-xl border border-white/5">
          {FONT_OPTIONS.map((f) => {
            const isSelected = font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ font: f.id })}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/15 text-white shadow-xs'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className={`text-sm truncate leading-snug ${f.className}`}>
                  {f.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate opacity-70">
                  {f.category}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. WARNA FONT & STYLE (BOLD, ITALIC, ALIGN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Warna Font */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Warna Font</span>
            </span>
            <span className="text-[10px] font-mono uppercase text-slate-400">
              {textColor}
            </span>
          </label>

          <div className="flex items-center gap-1.5 flex-wrap">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => onChange({ textColor: swatch.hex })}
                style={{ backgroundColor: swatch.hex }}
                className={`w-6 h-6 rounded-md border transition-transform cursor-pointer shadow-xs ${
                  textColor.toLowerCase() === swatch.hex.toLowerCase()
                    ? 'scale-115 border-amber-400 ring-2 ring-amber-400/40'
                    : 'border-white/20 hover:scale-105'
                }`}
                title={swatch.label}
              />
            ))}

            {/* Custom Color Input */}
            <label
              className="w-6 h-6 rounded-md border border-white/20 bg-linear-to-tr from-rose-500 via-amber-400 to-sky-500 cursor-pointer overflow-hidden relative shadow-xs"
              title="Pilih Warna Kustom"
            >
              <input
                type="color"
                value={textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

        {/* Style Font (Tebal, Miring, Rata Teks) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Gaya & Posisi Teks
          </label>

          <div className="flex items-center gap-1.5">
            {/* Bold Toggle */}
            <button
              type="button"
              onClick={toggleBold}
              className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                isBold
                  ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
              title="Tebal (Bold)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic Toggle */}
            <button
              type="button"
              onClick={toggleItalic}
              className={`p-2 rounded-lg border text-xs italic transition-all cursor-pointer flex items-center justify-center ${
                isItalic
                  ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
              title="Miring (Italic)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

            {/* Text Alignments */}
            {(['left', 'center', 'right'] as const).map((align) => {
              const isActive = textAlign === align;
              const Icon =
                align === 'left'
                  ? AlignLeft
                  : align === 'center'
                  ? AlignCenter
                  : AlignRight;
              return (
                <button
                  key={align}
                  type="button"
                  onClick={() => onChange({ textAlign: align })}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'
                  }`}
                  title={`Rata ${align === 'left' ? 'Kiri' : align === 'center' ? 'Tengah' : 'Kanan'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. UKURAN FONT (SLIDER & STEP BUTTONS) */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Ukuran Font Tulisan</span>
          <span className="font-mono text-amber-300 font-bold text-xs bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            {fontSize} px
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleFontSizeChange(-2)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Perkecil Ukuran Font"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={14}
            max={44}
            step={1}
            value={fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="flex-1 accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />

          <button
            type="button"
            onClick={() => handleFontSizeChange(2)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Perbesar Ukuran Font"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
