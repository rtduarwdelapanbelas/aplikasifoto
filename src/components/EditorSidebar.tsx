import React, { useState } from 'react';
import {
  Type as TypeIcon,
  Layout,
  Sliders,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  Move,
  Calendar,
  Layers,
} from 'lucide-react';
import { FrameState, TemplateType, FontOption, FilterType, AccentType } from '../types/editor';
import { TEMPLATE_CONFIGS, FONT_OPTIONS, FILTER_OPTIONS, ACCENT_OPTIONS } from '../data/presets';

interface EditorSidebarProps {
  frameState: FrameState;
  onUpdateState: (updates: Partial<FrameState>) => void;
  paletteColors?: string[];
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  frameState,
  onUpdateState,
  paletteColors = [],
}) => {
  const [activeTab, setActiveTab] = useState<'template' | 'text' | 'image' | 'accents'>('template');

  const templates: TemplateType[] = [
    'polaroid_classic',
    'minimalist_white',
    'film_strip',
    'journal_kraft',
  ];

  const handleTemplateChange = (tmpl: TemplateType) => {
    const config = TEMPLATE_CONFIGS[tmpl];
    onUpdateState({
      template: tmpl,
      bgColor: config.defaultBg,
      font: config.defaultFont,
      textColor: config.defaultTextColor,
    });
  };

  return (
    <div className="bg-[#15181e] border border-white/10 rounded-xl overflow-hidden text-slate-100 shadow-xl">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 bg-white/[0.02]">
        <button
          onClick={() => setActiveTab('template')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'template'
              ? 'border-amber-400 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Template</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'text'
              ? 'border-amber-400 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TypeIcon className="w-3.5 h-3.5" />
          <span>Caption</span>
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'image'
              ? 'border-amber-400 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Foto</span>
        </button>

        <button
          onClick={() => setActiveTab('accents')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'accents'
              ? 'border-amber-400 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Aksen</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5 space-y-5">
        {/* TAB 1: TEMPLATE */}
        {activeTab === 'template' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Pilih Format Bingkai:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {templates.map((t) => {
                  const cfg = TEMPLATE_CONFIGS[t];
                  const isSelected = frameState.template === t;
                  return (
                    <button
                      key={t}
                      onClick={() => handleTemplateChange(t)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-white shadow-sm'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight mb-1">{cfg.label}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {cfg.sublabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Warna Bingkai / Background */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Warna Bingkai / Kertas:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['#FAF8F5', '#FFFFFF', '#141416', '#DCC8B0', '#F2ECE4', '#E8DFD5'].map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateState({ bgColor: color })}
                    className={`w-7 h-7 rounded-md border shadow-xs transition-transform cursor-pointer ${
                      frameState.bgColor === color ? 'ring-2 ring-amber-400 scale-105' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}

                {/* AI Palette colors if available */}
                {paletteColors.map((color) => (
                  <button
                    key={`palette-${color}`}
                    onClick={() => onUpdateState({ bgColor: color })}
                    className={`w-7 h-7 rounded-md border shadow-xs transition-transform cursor-pointer ${
                      frameState.bgColor === color ? 'ring-2 ring-amber-400 scale-105' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Dari Foto: ${color}`}
                  />
                ))}

                {/* Custom Color Input */}
                <input
                  type="color"
                  value={frameState.bgColor}
                  onChange={(e) => onUpdateState({ bgColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent p-0"
                  title="Pilih warna kustom"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEXT & CAPTION */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Teks Caption Utama:
              </label>
              <textarea
                value={frameState.caption}
                onChange={(e) => onUpdateState({ caption: e.target.value })}
                rows={2}
                className="w-full text-xs bg-white/5 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
                placeholder="Tulis kalimat estetik..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Sub-teks / Tanggal / Lokasi:
              </label>
              <input
                type="text"
                value={frameState.subCaption}
                onChange={(e) => onUpdateState({ subCaption: e.target.value })}
                className="w-full text-xs bg-white/5 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
                placeholder="Contoh: Ubud, Bali · 26 Okt 2026"
              />
            </div>

            {/* Font Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Gaya Huruf (Font):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = frameState.font === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onUpdateState({ font: f.id })}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className={`text-sm ${f.className}`}>{f.name}</div>
                      <div className="text-[10px] text-slate-400">{f.category}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size & Alignment */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ukuran Teks: {frameState.fontSize}px
                </label>
                <input
                  type="range"
                  min={14}
                  max={34}
                  value={frameState.fontSize}
                  onChange={(e) => onUpdateState({ fontSize: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Rata Teks:
                </label>
                <div className="flex border border-white/10 rounded-lg overflow-hidden bg-white/5">
                  <button
                    onClick={() => onUpdateState({ textAlign: 'left' })}
                    className={`flex-1 py-1.5 flex items-center justify-center cursor-pointer ${
                      frameState.textAlign === 'left' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateState({ textAlign: 'center' })}
                    className={`flex-1 py-1.5 flex items-center justify-center cursor-pointer ${
                      frameState.textAlign === 'center' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateState({ textAlign: 'right' })}
                    className={`flex-1 py-1.5 flex items-center justify-center cursor-pointer ${
                      frameState.textAlign === 'right' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Text Color */}
            <div className="pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Warna Tinta:
              </label>
              <div className="flex items-center gap-2">
                {['#2B2B2B', '#111215', '#4A3B32', '#78350F', '#F5ECE3', '#E09F5A'].map((col) => (
                  <button
                    key={col}
                    onClick={() => onUpdateState({ textColor: col })}
                    className={`w-6 h-6 rounded-full border shadow-xs transition-transform cursor-pointer ${
                      frameState.textColor === col ? 'ring-2 ring-amber-400 scale-110' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: col }}
                    title={col}
                  />
                ))}
                <input
                  type="color"
                  value={frameState.textColor}
                  onChange={(e) => onUpdateState({ textColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent p-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: IMAGE ADJUSTMENTS */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            {/* Filter selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Filter Suasana Foto:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FILTER_OPTIONS.map((flt) => {
                  const isSelected = frameState.filter === flt.id;
                  return (
                    <button
                      key={flt.id}
                      onClick={() => onUpdateState({ filter: flt.id })}
                      className={`py-2 px-2.5 rounded-lg border text-center transition-colors text-xs font-medium cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {flt.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom / Skala:</span>
                </span>
                <span className="font-mono text-slate-400">{Math.round(frameState.zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={2}
                step={0.05}
                value={frameState.zoom}
                onChange={(e) => onUpdateState({ zoom: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Pan X and Pan Y */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  <span>Geser Posisi Foto:</span>
                </span>
                <button
                  onClick={() => onUpdateState({ panX: 0, panY: 0, zoom: 1 })}
                  className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                >
                  Reset Posisi
                </button>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Horizontal (X)</span>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={frameState.panX}
                  onChange={(e) => onUpdateState({ panX: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Vertikal (Y)</span>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={frameState.panY}
                  onChange={(e) => onUpdateState({ panY: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACCENTS & STICKERS */}
        {activeTab === 'accents' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Aksen Dekoratif:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACCENT_OPTIONS.map((acc) => {
                  const isSelected = frameState.accent === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => onUpdateState({ accent: acc.id })}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-semibold">{acc.name}</div>
                      <div className="text-[10px] text-slate-400">{acc.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tanggal LED Stamp */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Stempel Tanggal Retro:</span>
                </span>
                <input
                  type="checkbox"
                  checked={frameState.showDate}
                  onChange={(e) => onUpdateState({ showDate: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>

              {frameState.showDate && (
                <input
                  type="text"
                  value={frameState.dateText}
                  onChange={(e) => onUpdateState({ dateText: e.target.value })}
                  placeholder="Contoh: '26 10 26"
                  className="w-full text-xs font-mono bg-white/5 border border-white/10 rounded-lg p-2 text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
