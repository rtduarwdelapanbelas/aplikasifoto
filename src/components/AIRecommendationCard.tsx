import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  RefreshCw,
  Sliders,
  Copy,
  ChevronDown,
  ChevronUp,
  Palette,
  FileCode2,
} from 'lucide-react';
import { AIAnalysisResult, CaptionCategory, TemplateType } from '../types/editor';
import { TEMPLATE_CONFIGS } from '../data/presets';

interface AIRecommendationCardProps {
  analysis: AIAnalysisResult | null;
  isLoading: boolean;
  selectedCategory: CaptionCategory;
  currentCaption: string;
  onSelectCaption: (text: string, category: CaptionCategory) => void;
  onApplyRecommendation: (rec: AIAnalysisResult['design_recommendation']) => void;
  onRegenerate: (vibeHint?: string) => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  analysis,
  isLoading,
  selectedCategory,
  currentCaption,
  onSelectCaption,
  onApplyRecommendation,
  onRegenerate,
}) => {
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [customVibe, setCustomVibe] = useState('');

  if (isLoading) {
    return (
      <div className="bg-[#15181e] border border-white/5 rounded-xl p-5 text-slate-200 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Menganalisis Visual Foto...</h3>
            <p className="text-xs text-slate-400">
              AI sedang membaca warna dominan, vibe, dan menyusun caption estetik.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-14 bg-white/5 rounded-lg" />
          <div className="h-14 bg-white/5 rounded-lg" />
          <div className="h-14 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { captions, design_recommendation, palette, vibe_tags, isFallback } = analysis;
  const templateConfig = TEMPLATE_CONFIGS[design_recommendation.recommended_template];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const captionList: Array<{
    key: CaptionCategory;
    title: string;
    description: string;
    text: string;
  }> = [
    {
      key: 'aesthetic',
      title: 'Aesthetic',
      description: 'Puitis & bermakna (maks 12 kata)',
      text: captions.aesthetic,
    },
    {
      key: 'casual',
      title: 'Casual',
      description: 'Santai & hangat untuk keseharian',
      text: captions.casual,
    },
    {
      key: 'funny',
      title: 'Fun / Humor',
      description: 'Ringan, lucu, dan relatable',
      text: captions.funny,
    },
  ];

  return (
    <div className="bg-[#15181e] border border-white/10 rounded-xl p-5 text-slate-100 shadow-lg space-y-5">
      {/* Header section with status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-amber-400/15 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Hasil Analisis AI & Rekomendasi</span>
              {isFallback && (
                <span className="text-[10px] text-amber-400 font-normal px-1.5 py-0.5 bg-amber-400/10 rounded">
                  Mode Standar
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Pilih caption otomatis & terapkan bingkai yang paling serasi.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowJsonRaw(!showJsonRaw)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-white/5 cursor-pointer shrink-0"
          title="Tampilkan JSON murni"
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">JSON</span>
          {showJsonRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Raw JSON viewer if toggled */}
      {showJsonRaw && (
        <div className="p-3 bg-black/60 rounded-lg border border-white/10 font-mono text-xs text-amber-300 overflow-x-auto max-h-48">
          <pre>{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}

      {/* Design Recommendation Banner */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full border border-white/20 shadow-xs shrink-0"
              style={{ backgroundColor: design_recommendation.dominant_color_hex }}
              title={`Warna Dominan: ${design_recommendation.dominant_color_hex}`}
            />
            <span className="text-xs font-semibold text-white">
              Rekomendasi: {templateConfig?.label || design_recommendation.recommended_template}
            </span>
          </div>

          <button
            onClick={() => onApplyRecommendation(design_recommendation)}
            className="px-3 py-1 text-xs font-medium bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sliders className="w-3 h-3" />
            <span>Terapkan Desain Ini</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed italic">
          "{design_recommendation.reason}"
        </p>

        {/* Visual Attributes */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <span>Dominan:</span>
            <span className="font-mono text-slate-200">{design_recommendation.dominant_color_hex}</span>
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <span>Frame Hex:</span>
            <span className="font-mono text-slate-200">{design_recommendation.recommended_bg_color_hex}</span>
          </div>

          {vibe_tags && vibe_tags.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <span>Vibe:</span>
                <span className="text-amber-200">{vibe_tags.join(', ')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3 Caption Options Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">Pilihan Caption Otomatis:</span>
          <span>Klik untuk pasang di bawah foto</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {captionList.map((item) => {
            const isSelected = currentCaption === item.text;
            return (
              <div
                key={item.key}
                onClick={() => onSelectCaption(item.text, item.key)}
                className={`p-3 rounded-lg border transition-all cursor-pointer text-left relative group ${
                  isSelected
                    ? 'bg-amber-400/10 border-amber-400/50 shadow-sm'
                    : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-white">{item.title}</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">
                      — {item.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Terpasang
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.text);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                      title="Salin caption"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-snug font-serif-luxury">
                  "{item.text}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Palette Swatches (if available) */}
      {palette && palette.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3 h-3" />
              <span>Harmoni Warna Foto:</span>
            </span>
            <span className="text-[11px]">Bisa dipakai untuk warna bingkai</span>
          </div>
          <div className="flex items-center gap-2">
            {palette.map((color, idx) => (
              <button
                key={idx}
                onClick={() =>
                  onApplyRecommendation({
                    ...design_recommendation,
                    recommended_bg_color_hex: color,
                  })
                }
                className="w-7 h-7 rounded-md border border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-xs"
                style={{ backgroundColor: color }}
                title={`Gunakan warna ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regenerate Caption Tools */}
      <div className="pt-2 border-t border-white/5 flex items-center gap-2">
        <input
          type="text"
          value={customVibe}
          onChange={(e) => setCustomVibe(e.target.value)}
          placeholder="Nuansa tambahan (misal: puitis kopi sore, liburan seru)..."
          className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
        />
        <button
          onClick={() => onRegenerate(customVibe)}
          className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Buat Lagi</span>
        </button>
      </div>

      {copiedCaption && (
        <p className="text-[11px] text-emerald-400 text-center font-medium animate-fade-in">
          ✓ Caption berhasil disalin ke clipboard!
        </p>
      )}
    </div>
  );
};
