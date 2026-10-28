/**
 * ProtectedRoute.jsx — Himoyalangan Marshrutlar Komponenti
 * ─────────────────────────────────────────────────────────
 * Vazifasi:
 * 1. Kirish holatini (isAuthenticated) va yuklanishni (isLoading) tekshiradi.
 * 2. Tizimga kirmagan bo'lsa, borish mo'ljallangan manzilni (targetRoute)
 *    eslab qolib, avtomatik /login sahifasiga yo'naltiradi.
 * 3. Agar foydalanuvchi roli mos kelmasa, bosh sahifaga (/) qaytaradi.
 * 4. Shifokorlar uchun status ('pending', 'needs_review', 'approved', 'rejected') tekshiruvi:
 *    - 'pending' yoki 'needs_review' -> "Hujjatlaringiz tekshirilmoqda" sahifasini ko'rsatadi (/doctor ochilmaydi)
 *    - 'rejected' -> Rad etilganlik sahifasi va sababini ko'rsatadi
 *    - 'approved' -> Shifokor paneliga kirish ruxsat etiladi!
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  LogOut, 
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck
} from 'lucide-react';

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  targetRoute = '/', 
  onNavigate 
}) => {
  const { 
    t,
    isAuthenticated, 
    isAdminAuthenticated, 
    currentRole, 
    userProfile, 
    logoutUser, 
    showToast,
    isAuthLoading 
  } = useApp();

  // 1. Yuklanish holati (Session tekshirilayotganda)
  if (isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-teal-600 dark:text-teal-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          {t('protectedRoute.checkingSecurity')}
        </span>
      </div>
    );
  }

  // 2. Tizimga kirmagan bo'lsa -> /login ga yo'naltirish
  const isAuthorizedRole = allowedRoles.includes(currentRole);
  const isEffectivelyAuthenticated = currentRole === 'admin' 
    ? (isAuthenticated && isAdminAuthenticated) 
    : isAuthenticated;

  if (!isEffectivelyAuthenticated) {
    // Mo'ljallangan marshrutni eslab qolish
    if (typeof window !== 'undefined' && targetRoute) {
      sessionStorage.setItem('mednavbat_redirect_after_login', targetRoute);
    }

    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {t('protectedRoute.loginRequired')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
            {t('protectedRoute.loginRequiredDesc')}
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && targetRoute) {
                  sessionStorage.setItem('mednavbat_redirect_after_login', targetRoute);
                }
                if (onNavigate) onNavigate('/login');
              }}
              className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/20 active:scale-98 transition"
            >
              {t('protectedRoute.loginBtn')}
            </button>
            <button
              onClick={() => onNavigate && onNavigate('/')}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('protectedRoute.backToHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Rol mos kelmasa -> Bosh sahifaga yo'naltirish
  if (!isAuthorizedRole) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {t('protectedRoute.accessDenied')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
            {t('protectedRoute.roleNotAllowed')}
          </p>
          <button
            onClick={() => onNavigate && onNavigate('/')}
            className="mt-6 w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 shadow-md active:scale-98 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('protectedRoute.backToHome')}</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Shifokor bo'lsa -> Status tekshiruvi (pending, needs_review, approved, rejected)
  if (currentRole === 'doctor') {
    const doctorStatus = userProfile?.status || 'pending';

    // A. Pending yoki Needs Review -> "Hujjatlaringiz tekshirilmoqda"
    if (doctorStatus === 'pending' || doctorStatus === 'pending_verification' || doctorStatus === 'needs_review') {
      return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200 dark:border-amber-900/60 shadow-2xl">
            {/* Belgisi */}
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-300 dark:border-amber-800">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  {doctorStatus === 'needs_review' ? "Qo'shimcha tekshiruvda" : "Arizangiz ko'rib chiqilmoqda"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Hujjatlaringiz tekshirilmoqda
                </h2>
              </div>
            </div>

            {/* Izoh */}
            <div className="mt-5 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p>
                Hurmatli <strong className="text-slate-900 dark:text-white">{userProfile?.fullName || userProfile?.name || 'Shifokor'}</strong>, 
                MedNavbat tizimiga shifokor sifatida ro'yxatdan o'tganingiz uchun rahmat.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Litsenziya raqami:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{userProfile?.licenseNumber || 'LN-XXXXXX'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Mutaxassislik:</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400">{userProfile?.specialtyName || 'Shifokor'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Holat:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3" />
                    <span>Admin tasdig'i kutilmoqda</span>
                  </span>
                </div>
              </div>

              <div className="bg-teal-50 dark:bg-teal-950/40 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200">
                <p className="font-bold">Tekshiruv bosqichlari:</p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-teal-800 dark:text-teal-300">
                  <li>Litsenziya va shaxsni tasdiqlovchi hujjatlar haqiqiyligi tekshiriladi</li>
                  <li>Admin mutaxassislik va ish jadvalingizni tasdiqlaydi (1-2 ish kuni)</li>
                  <li>Tasdiqlangandan so'ng emailingizga xabar boradi va Shifokor paneli ochiladi</li>
                </ul>
              </div>
            </div>

            {/* Tugmalar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onNavigate && onNavigate('/')}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Bosh sahifaga qaytish</span>
              </button>
              <button
                onClick={logoutUser}
                className="py-2.5 px-4 rounded-xl font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition border border-rose-200 dark:border-rose-900 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Hisobdan chiqish</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // B. Rejected -> Rad etilganlik sahifasi
    if (doctorStatus === 'rejected') {
      return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-300 dark:border-rose-800">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                  Ariza rad etildi
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Arizangiz qabul qilinmadi
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p>
                Hurmatli <strong className="text-slate-900 dark:text-white">{userProfile?.fullName || 'Shifokor'}</strong>, 
                afsuski arizangiz ma'muriyat tomonidan tekshirilib, quyidagi sababga ko'ra rad etildi:
              </p>

              <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                <span className="font-bold block mb-1">Rad etish sababi:</span>
                <p className="italic">{userProfile?.rejectionReason || "Hujjatlar sifati yetarli emas yoki ma'lumotlar mos kelmadi."}</p>
              </div>

              <p className="text-xs text-slate-500">
                Iltimos, hujjatlaringizni to'g'rilab, qayta ro'yxatdan o'ting yoki qo'llab-quvvatlash xizmati bilan bog'laning.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={logoutUser}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Chiqish va qayta urinish
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // 5. Hammasi tasdiqlangan -> Asl sahifani ko'rsatish
  return children;
};
