import React from 'react';
import { X, Trash2, ArrowUpRight, FolderHeart } from 'lucide-react';
import { SavedCreation } from '../types/editor';

interface GalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedList: SavedCreation[];
  onLoadCreation: (item: SavedCreation) => void;
  onDeleteCreation: (id: string) => void;
}

export const GalleryDrawer: React.FC<GalleryDrawerProps> = ({
  isOpen,
  onClose,
  savedList,
  onLoadCreation,
  onDeleteCreation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-[#14161b] border-l border-white/10 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Koleksi Desain Tersimpan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedList.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <FolderHeart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Belum ada karya yang disimpan.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Klik tombol "Simpan ke Galeri" pada editor untuk menyimpan karya favoritmu.
              </p>
            </div>
          ) : (
            savedList.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3.5 hover:border-white/20 transition-all group"
              >
                <img
                  src={item.previewUrl || item.frameState.imageSrc}
                  alt="Thumbnail"
                  className="w-16 h-16 object-cover rounded-md border border-white/10 shrink-0 bg-black"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {item.frameState.caption || 'Tanpa Caption'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Template: <span className="text-amber-300 uppercase">{item.frameState.template.replace('_', ' ')}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(item.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onLoadCreation(item);
                      onClose();
                    }}
                    className="p-2 text-xs font-medium bg-amber-400/20 text-amber-300 hover:bg-amber-400 hover:text-slate-950 rounded-lg transition-colors flex items-center gap-1"
                    title="Buka & Edit"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteCreation(item.id)}
                    className="p-2 text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
