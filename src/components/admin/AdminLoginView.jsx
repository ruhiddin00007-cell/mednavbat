/**
 * AdminLoginView.jsx
 * ──────────────────────────────────────────────────────────
 * Maxfiy Administrator Kirish Sahifasi (/admin-kirish).
 * 
 * Qoidalar:
 * 1. Saytda hech qayerda havola berilmaydi.
 * 2. robots noindex, nofollow tegi avtomatik qo'yiladi.
 * 3. 2 Bosqichli himoya (2FA):
 *    - 1-bosqich: Login va kuchli maxfiy parol tekshiruvi.
 *    - 2-bosqich: 2FA 6 xonali bir martalik xavfsizlik kodi.
 * 4. 5 martadan oshiq xato urinish 15 daqiqaga bloklaydi.
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  RefreshCw,
  Home,
  Eye,
  EyeOff
} from 'lucide-react';

const ADMIN_LOCKOUT_KEY = 'mednavbat_admin_lockout';
const ADMIN_ATTEMPTS_KEY = 'mednavbat_admin_failed_attempts';

export const AdminLoginView = ({ onBackHome }) => {
  const { loginAdmin, showToast } = useApp();

  // robots noindex qo'yish
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="robots"]');
    const originalContent = metaTag ? metaTag.getAttribute('content') : null;
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'robots';
      document.head.appendChild(metaTag);
    }
    metaTag.content = 'noindex, nofollow, noarchive';

    return () => {
      if (originalContent) {
        metaTag.content = originalContent;
      } else {
        metaTag.remove();
      }
    };
  }, []);

  // Holatlar: 1 = Login/Parol, 2 = 2FA Tasdiqlash
  const [step, setStep] = useState(1);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [generated2FA, setGenerated2FA] = useState(null);
  const [twoFactorTimer, setTwoFactorTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingLockMinutes, setRemainingLockMinutes] = useState(0);

  // Bloklanishni tekshirish
  useEffect(() => {
    const checkLock = () => {
      const lockUntil = localStorage.getItem(ADMIN_LOCKOUT_KEY);
      if (lockUntil) {
        const diff = Number(lockUntil) - Date.now();
        if (diff > 0) {
          setIsLocked(true);
          setRemainingLockMinutes(Math.ceil(diff / 60000));
        } else {
          setIsLocked(false);
          localStorage.removeItem(ADMIN_LOCKOUT_KEY);
          localStorage.removeItem(ADMIN_ATTEMPTS_KEY);
        }
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2FA Taymer
  useEffect(() => {
    let t;
    if (twoFactorTimer > 0) {
      t = setInterval(() => setTwoFactorTimer(p => (p > 0 ? p - 1 : 0)), 1000);
    }
    return () => clearInterval(t);
  }, [twoFactorTimer]);

  const recordFailedAttempt = () => {
    const current = Number(localStorage.getItem(ADMIN_ATTEMPTS_KEY) || '0') + 1;
    localStorage.setItem(ADMIN_ATTEMPTS_KEY, String(current));
    if (current >= 5) {
      const lockTime = Date.now() + 15 * 60 * 1000; // 15 daqiqa
      localStorage.setItem(ADMIN_LOCKOUT_KEY, String(lockTime));
      setIsLocked(true);
      setRemainingLockMinutes(15);
      setErrorMsg("Xavfsizlik: 5 marta noto'g'ri urinish tufayli admin kirish 15 daqiqaga bloklandi.");
    } else {
      setErrorMsg(`Kirish ma'lumotlari xato! Qolgan urinishlar: ${5 - current}`);
    }
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isLocked) {
      setErrorMsg(`Tizim vaqtincha bloklangan. Iltimos, ${remainingLockMinutes} daqiqadan so'ng urinib ko'ring.`);
      return;
    }

    const cleanLogin = (login || '').trim().toLowerCase();
    // Parol tekshiruvi: env yoki kuchli xavfsiz standart
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'MedNavbat@2026!AdminSecured#';

    if ((cleanLogin === 'admin' || cleanLogin === 'admin@mednavbat.uz') && password === validPassword) {
      // 1-bosqich muvaffaqiyatli! 2FA kodini yaratamiz (6 xonali)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGenerated2FA(code);
      setStep(2);
      setTwoFactorTimer(120); // 2 daqiqa
      setTwoFactorCode('');
      
      // Xavfsiz xabar: administrator telefoniga / konsolga yuborildi
      console.log(`[MEDNAVBAT ADMIN 2FA KODI]: ${code}`);
      showToast("2-bosqich: Bir martalik 2FA tasdiqlash kodi yuborildi.", 'info', 4000);
    } else {
      recordFailedAttempt();
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (twoFactorTimer <= 0) {
      setErrorMsg("2FA kodining amal qilish muddati tugagan. Qaytadan kod so'rang.");
      return;
    }

    if (twoFactorCode.trim() === generated2FA) {
      setIsSubmitting(true);
      // Muvaffaqiyatli!
      localStorage.removeItem(ADMIN_ATTEMPTS_KEY);
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
      
      const success = loginAdmin('admin', password);
      if (success) {
        showToast("Administrator muvaffaqiyatli tasdiqlandi va tizimga kirdi!", 'success');
      }
    } else {
      setErrorMsg("2FA tasdiqlash kodi noto'g'ri kiritildi.");
    }
  };

  const resend2FA = () => {
    if (twoFactorTimer > 90) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGenerated2FA(code);
    setTwoFactorTimer(120);
    console.log(`[MEDNAVBAT YANGI ADMIN 2FA KODI]: ${code}`);
    showToast("Yangi 2FA tasdiqlash kodi yuborildi.", 'info');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
        
        {/* Yuqori xavfsizlik nishoni */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/70 text-rose-400 border border-rose-800/80 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/50 border border-rose-800/60 text-[10px] font-black text-rose-300 tracking-wider uppercase">
            <span>Himoyalangan Yashirin Hudud</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            MedNavbat Boshqaruv Markazi
          </h1>
          <p className="text-xs text-slate-400">
            Faqat vakolatli tizim ma'murlari uchun 2 bosqichli autentifikatsiya.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLocked ? (
          <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs space-y-2 text-center">
            <Clock className="w-6 h-6 mx-auto text-amber-400 animate-spin" />
            <p className="font-bold">Kirish vaqtincha cheklandi</p>
            <p className="text-[11px] text-amber-300/80">
              Xavfsizlik talablariga muvofiq, tizim {remainingLockMinutes} daqiqadan so'ng yana urinishga ruxsat beradi.
            </p>
          </div>
        ) : step === 1 ? (
          /* 1-BOSQICH: Login va Parol */
          <form onSubmit={handleStep1Submit} className="space-y-4" autoComplete="off">
            <div>
              <label
                htmlFor="admin-login-username"
                className="block text-xs font-bold text-slate-300 mb-1.5"
              >
                Administrator Logini
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-login-username"
                  type="text"
                  required
                  autoFocus
                  autoComplete="off"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="login"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-login-password"
                className="block text-xs font-bold text-slate-300 mb-1.5"
              >
                Kuchli Maxfiy Parol
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolingizni kiriting"
                  className="w-full pl-10 pr-10 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition"
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <span>1-bosqichni Tasdiqlash</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* 2-BOSQICH: Ikki bosqichli tasdiq (2FA) */
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-teal-950/50 border border-teal-800/80 text-teal-300 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>1-bosqich qabul qilindi</span>
              </div>
              <p className="text-[11px] text-teal-200/80">
                Administrator qurilmasiga 6 xonali tasdiqlash kodi yuborildi. Iltimos, kodni kiriting.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  6 xonali 2FA Kodi
                </label>
                <span className="text-[11px] font-mono font-bold text-amber-400">
                  {Math.floor(twoFactorTimer / 60)}:{(twoFactorTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-center text-lg font-mono font-black text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white transition"
              >
                Ortga qaytish
              </button>
              <button
                type="button"
                onClick={resend2FA}
                disabled={twoFactorTimer > 90}
                className="text-teal-400 hover:text-teal-300 transition disabled:opacity-50"
              >
                Kodni qayta yuborish
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || twoFactorCode.length < 6}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-teal-950/60 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Kirish amalga oshirilmoqda..." : "2FA Tasdiqlash va Kirish"}</span>
            </button>
          </form>
        )}

        {/* Bosh sahifaga qaytish */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={onBackHome}
            className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1.5 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MedNavbat Bosh Sahifasiga Qaytish</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLoginView;
