/**
 * LoginView.jsx — Bemor Kirishi (Umumiy Kirish Sahifasi)
 * ──────────────────────────────────────────────────────────
 * Qoidalar (1-bosqich):
 *  1. Umumiy kirish oynasida FAQAT bemor kirishi ko'rinadi.
 *  2. Ochiq sinov hisoblari va parollar butunlay olib tashlangan.
 *  3. Shifokorlar uchun alohida /doctor sahifasi havolasi berilgan.
 *  4. Administratorlar uchun maxsus yashirin manzil (/admin-kirish) orqali 2FA bilan kiriladi.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  HeartPulse, 
  LogIn, 
  Lock, 
  Phone, 
  AlertCircle, 
  ArrowLeft,
  Stethoscope,
  Eye,
  EyeOff
} from 'lucide-react';
import { validateUzbekPhoneNumber } from '../../services/auth/otp.service';

export const LoginView = ({ onNavigate }) => {
  const { 
    t,
    setIsAuthenticated, 
    setCurrentRole, 
    setUserProfile, 
    patients,
    showToast 
  } = useApp();

  const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) val = '+998 ';
    const digitsOnly = val.replace(/\D/g, '').substring(0, 12);
    let formatted = '+998 ';
    if (digitsOnly.length > 3) {
      const rest = digitsOnly.substring(3);
      if (rest.length <= 2) formatted += rest;
      else if (rest.length <= 5) formatted += `${rest.substring(0, 2)} ${rest.substring(2)}`;
      else if (rest.length <= 7) formatted += `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
      else formatted += `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5, 7)} ${rest.substring(7, 9)}`;
    }
    setPhone(formatted);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const phoneValidation = validateUzbekPhoneNumber(phone);
    if (!phoneValidation.isValid) {
      setErrorMsg(t('authView.invalidPhone'));
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg(t('authView.invalidPassword'));
      return;
    }

    setIsLoading(true);

    try {
      const digitsOnly = phone.replace(/\D/g, '');
      const existingPatient = (patients || []).find(p => {
        const pDigits = String(p.phone || '').replace(/\D/g, '');
        return pDigits === digitsOnly;
      });

      if (existingPatient && existingPatient.password && existingPatient.password !== password) {
        setErrorMsg(t('authView.wrongCredentials'));
        setIsLoading(false);
        return;
      }

      // Bemor muvaffaqiyatli kirdi
      const patientProfile = existingPatient || {
        id: `pat-${Date.now()}`,
        phone,
        fullName: 'Bemor',
        role: 'patient',
        isProfileComplete: true
      };

      setIsAuthenticated(true);
      setCurrentRole('patient');
      setUserProfile(patientProfile);

      showToast(t('toastMessages.welcome'), "success");

      // Redirect tekshiruvi
      let target = '/';
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('mednavbat_redirect_after_login');
        if (stored && stored !== '/admin' && stored !== '/admin-kirish') {
          target = stored;
        }
        sessionStorage.removeItem('mednavbat_redirect_after_login');
      }

      if (onNavigate) {
        onNavigate(target);
      }
    } catch (_err) {
      setErrorMsg(t('authView.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Yuqori qism */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Med<span className="text-teal-600 dark:text-teal-400">Navbat</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('authView.patientPortalLogin')}
          </p>
        </div>

        {/* Xatolik xabari */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Kirish formasi (Faqat Bemor uchun) */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="patient-phone"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {t('authView.phoneLabel')}
            </label>
            <div className="relative">
              <input
                id="patient-phone"
                type="tel"
                autoComplete="username"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+998 90 123 45 67"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label
              htmlFor="patient-password"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {t('authView.passwordLabel')}
            </label>
            <div className="relative">
              <input
                id="patient-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('authView.passwordPlaceholder')}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label={showPassword ? t('authView.hidePassword') : t('authView.showPassword')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>{t('authView.verifying')}</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{t('protectedRoute.loginBtn')}</span>
              </>
            )}
          </button>
        </form>

        {/* Shifokorlar uchun ajratilgan havola */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('authView.isDoctor')}
          </p>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/doctor')}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{t('authView.goToDoctor')}</span>
          </button>
        </div>

        {/* Bosh sahifaga qaytish */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('protectedRoute.backToHome')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
