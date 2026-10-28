import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  X, 
  ArrowRight, 
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export const AdminAuthGateModal = () => {
  const { 
    activeModal, 
    setActiveModal, 
    loginAdmin, 
    setCurrentRole,
    isAdminAuthenticated
  } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);

  if (activeModal !== 'admin-auth' || isAdminAuthenticated) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg("Iltimos, login va parolni kiriting.");
      return;
    }

    const success = loginAdmin(username, password);
    if (!success) {
      setAttempts(prev => prev + 1);
      setErrorMsg("Administrator logini yoki paroli noto'g'ri! Qayta urinib ko'ring.");
    }
  };

  const handleClose = () => {
    setActiveModal(null);
    setCurrentRole('patient');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="bg-teal-500/20 text-teal-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-teal-400/30 uppercase tracking-wider">
                Xavfsiz Kirish
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                Tizim Egasi (Admin) Kirishi
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-300/90 mt-3 leading-relaxed">
            Moliyaviy tushumlar, bank kartasi va pul yechib olish faqat administrator hisobi orqali ko'rinadi.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="admin-gate-username"
              className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Administrator Logini</span>
            </label>
            <input
              id="admin-gate-username"
              type="text"
              required
              autoFocus
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="login"
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:bg-white transition"
            />
          </div>

          <div>
            <label
              htmlFor="admin-gate-password"
              className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Maxfiy Parol</span>
            </label>
            <div className="relative">
              <input
                id="admin-gate-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolingizni kiriting"
                className="w-full text-xs p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Xavfsizlik eslatmasi */}
          <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-[11px] text-slate-700 flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <span>Faqat vakolatli tizim ma'murlari uchun mo'ljallangan.</span>
          </div>

          {attempts > 2 && (
            <p className="text-[11px] text-rose-600 font-semibold text-center">
              Eslatma: Bir necha bor noto'g'ri kiritildi. Xavfsizlik jurnali yozilmoqda.
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              className="w-1/2 py-2.5 bg-slate-900 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center space-x-1.5 transition transform active:scale-95"
            >
              <span>Kirish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
