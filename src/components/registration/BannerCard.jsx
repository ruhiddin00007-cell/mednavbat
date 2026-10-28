import React from 'react';
import { Clock, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * MedNavbat — Tezkor 1-Daqiqalik Registratsiya Banneri
 * ───────────────────────────────────────────────────
 * Skrinshot dizayni asosida:
 *  - Yashil gradient (teal → emerald) fon
 *  - Chapda yarim shaffof yumaloq kvadrat ichida Clock ikonkasi
 *  - Markazda 2 qator aniq matn
 *  - O'ngda ShieldCheck ikonkasi
 *  - Interaktiv hover/active animatsiyalari
 */
export const BannerCard = ({ onClick, className = '' }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label="Tezkor 1-daqiqalik registratsiyani boshlash"
      className={`group relative overflow-hidden bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl shadow-lg shadow-teal-900/20 hover:shadow-xl hover:shadow-teal-900/30 transition-all duration-300 transform active:scale-98 cursor-pointer border border-white/20 select-none ${className}`}
    >
      {/* Orqa fon nurlari / Shimmer effekti */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Chap Icon: Yarim shaffof kvadrat ichida Clock */}
        <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner group-hover:bg-white/25 group-hover:scale-105 transition-all">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-xs animate-pulse" />
          </div>

          {/* Markaziy 2 qator matn */}
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <p className="text-xs sm:text-[13px] font-semibold text-teal-100/95 tracking-wide line-clamp-1">
                Tezkor 1-Daqiqalik Registratsiya
              </p>
              <span className="hidden sm:inline-flex items-center text-[10px] bg-white/25 text-white px-1.5 py-0.2 rounded-full font-bold">
                1 daqiqa
              </span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-white tracking-tight mt-0.5 line-clamp-1 group-hover:text-emerald-50 transition-colors">
              SMS va QR Chipta Bilan Tasdiqlash
            </p>
          </div>
        </div>

        {/* O'ng Icon: Qalqon + Galochka */}
        <div className="flex-shrink-0 flex items-center space-x-1 pl-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-400/20 backdrop-blur-xs flex items-center justify-center border border-emerald-300/30 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};
