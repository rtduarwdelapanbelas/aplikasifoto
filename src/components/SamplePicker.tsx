import React, { useRef } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { SAMPLE_PHOTOS, SamplePhoto } from '../data/presets';

interface SamplePickerProps {
  onSelectSample: (sample: SamplePhoto) => void;
  onUploadImage: (file: File) => void;
  onOpenCamera: () => void;
  activeImageSrc: string;
}

export const SamplePicker: React.FC<SamplePickerProps> = ({
  onSelectSample,
  onUploadImage,
  onOpenCamera,
  activeImageSrc,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      // reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div className="bg-[#15181e] border border-white/10 rounded-xl p-4 text-slate-100 shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Pilih atau Unggah Foto</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Unggah foto pribadi atau coba foto sampel untuk analisis instan.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Unggah Foto</span>
          </button>

          {/* Camera Button */}
          <button
            onClick={onOpenCamera}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Buka Kamera</span>
          </button>
        </div>
      </div>

      {/* Sample Thumbnails Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SAMPLE_PHOTOS.map((sample) => {
          const isActive = activeImageSrc === sample.url;
          return (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className={`group text-left p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2.5 ${
                isActive
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <img
                src={sample.url}
                alt={sample.name}
                className="w-11 h-11 object-cover rounded-md shrink-0 shadow-xs border border-white/10"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{sample.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{sample.category}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
