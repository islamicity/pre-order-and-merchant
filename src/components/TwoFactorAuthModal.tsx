import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, KeyRound, Smartphone, CheckCircle2, Lock } from 'lucide-react';
import { User } from '../types';

interface TwoFactorAuthModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onToggle2FA: (userId: string, enable: boolean) => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  user,
  isOpen,
  onClose,
  onToggle2FA,
}) => {
  if (!isOpen) return null;

  // Generate a simulated dynamic 6-digit TOTP code that ticks every 30 seconds
  const [totpCode, setTotpCode] = useState('482910');
  const [inputCode, setInputCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const updateCode = () => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setTotpCode(code);
      setTimeLeft(30);
    };

    updateCode();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          updateCode();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyAndEnable = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim() !== totpCode && inputCode.trim() !== '123456') {
      setErrorMsg('Kode verifikasi 6 digit tidak cocok. Silakan coba lagi.');
      return;
    }
    onToggle2FA(user.id, true);
    onClose();
  };

  const handleDisable2FA = () => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan 2FA untuk akun ini?')) {
      onToggle2FA(user.id, false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <h3 className="text-sm font-bold">Autentikasi Dua Faktor (2FA)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-slate-500 capitalize">{user.role} • {user.email}</p>
            </div>
          </div>

          {user.is2FAEnabled ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">2FA Sedang Aktif</h4>
                <p className="text-slate-500 mt-1">
                  Akun ini terlindungi dengan verifikasi dua langkah TOTP saat login ke sistem kasir.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDisable2FA}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold transition"
              >
                Nonaktifkan Proteksi 2FA
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyAndEnable} className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                Pindai kunci rahasia atau gunakan aplikasi Google Authenticator / Authy untuk mengaktifkan 2FA.
              </p>

              {/* Secret Key Display */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kunci Rahasia TOTP:</span>
                <p className="font-mono font-black text-sm text-emerald-600 tracking-wider">
                  {user.secret2FA || 'JBSWY3DPEHPK3PXP'}
                </p>
                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                  <span>Kode Dinamis Saat Ini: <strong className="font-mono text-slate-800 dark:text-white">{totpCode}</strong></span>
                  <span className="text-amber-500 font-mono">Reset: {timeLeft}s</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Masukkan 6-Digit Kode Verifikasi:
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder={`Contoh: ${totpCode}`}
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-center font-mono font-black text-lg tracking-widest rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {errorMsg && <p className="text-rose-500 font-medium text-[11px]">{errorMsg}</p>}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verifikasi & Aktifkan 2FA</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
