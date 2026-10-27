import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('lensaklip_admin_token', data.token);
        setUsername('');
        setPassword('');
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Username atau password salah.');
      }
    } catch {
      // Local fallback check if network problem
      if (username.trim() === 'admin' && password === 'Smpia9kpbks!') {
        sessionStorage.setItem('lensaklip_admin_token', 'local_admin_session');
        setUsername('');
        setPassword('');
        onSuccess();
      } else {
        setErrorMsg('Username atau password salah. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#15181e] border border-white/10 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Login Administrator</h3>
              <p className="text-[11px] text-slate-400">Akses seluruh arsip foto cetak A5</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className="w-full text-xs bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full text-xs bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
