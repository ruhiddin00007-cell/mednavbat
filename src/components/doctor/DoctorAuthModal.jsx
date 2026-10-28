/**
 * DoctorAuthModal.jsx
 * ──────────────────────────────────────────────────────────
 * Shifokorlar uchun maxsus avtorizatsiya va ro'yxatdan o'tish modali.
 * Faqat "Shifokorlar uchun" (/doctor) sahifasidan ochiladi.
 * Bemorlar umumiy kirish oynasidan bu yerga yorliq bo'lmaydi.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Stethoscope, 
  Lock, 
  Mail, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus, 
  LogIn,
  ShieldCheck 
} from 'lucide-react';
import { DoctorRegistrationForm } from '../auth/DoctorRegistrationForm';

export const DoctorAuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { loginDoctorAccount, showToast } = useApp();
  
  // 'login' | 'register'
  const [mode, setMode] = useState(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password) {
      setErrorMsg("Iltimos, email/telefon va maxfiy parolingizni kiriting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await loginDoctorAccount(identifier, password);
      if (ok) {
        onClose();
      } else {
        setErrorMsg("Email/telefon yoki maxfiy parol noto'g'ri. Qayta tekshiring.");
      }
    } catch (err) {
      setErrorMsg("Kirishda xatolik: " + (err.message || "Tizim xatosi"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-white/80 hover:text-white bg-black/20 hover:bg-black/30 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal sarlavhasi */}
        <div className="p-6 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                MedNavbat Shifokor Tizimi
              </span>
              <h2 className="text-xl font-black mt-1">
                {mode === 'login' ? "Shifokor Kabinetiga Kirish" : "Shifokor Bo'lib Ro'yxatdan O'tish"}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal tanasi */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                O'zingizga yozilgan bemorlar navbatini ko'rish, qabul qilish va davomatni belgilash uchun hisobingizga kiring.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email yoki Telefon raqamingiz
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="doctor@mednavbat.uz yoki +998901234567"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Maxfiy Parol
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? "Tekshirilmoqda..." : "Shifokor Sifatida Kirish"}</span>
              </button>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(''); }}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-bold inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Hisobingiz yo'qmi? Shifokor arizasini topshirish</span>
                </button>
              </div>
            </form>
          ) : (
            <DoctorRegistrationForm
              onBack={() => { setMode('login'); setErrorMsg(''); }}
              onComplete={() => {
                showToast("Arizangiz qabul qilindi! Admin tekshiruvidan so'ng hisobingiz faollashadi.", 'success', 5000);
                onClose();
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default DoctorAuthModal;
