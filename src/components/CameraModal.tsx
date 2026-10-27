import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'user' | 'environment') => {
    setErrorMsg(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Kamera gagal diakses:', err);
      setErrorMsg('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera for natural selfie
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#181a20] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Ambil Foto Langsung</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video stream container */}
        <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-xs text-red-300 max-w-xs">{errorMsg}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Guidelines framing grid */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-white" />
            <div className="border-r border-white" />
            <div />
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 flex items-center justify-around bg-[#121418]">
          <button
            onClick={toggleFacingMode}
            className="p-3 text-slate-300 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title="Putar Kamera Depan/Belakang"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Shutter Button */}
          <button
            onClick={takePhoto}
            disabled={!!errorMsg}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all shadow-lg cursor-pointer disabled:opacity-40"
            title="Ambil Foto"
          >
            <div className="w-12 h-12 rounded-full bg-white/90" />
          </button>

          <div className="w-11" />
        </div>
      </div>
    </div>
  );
};
