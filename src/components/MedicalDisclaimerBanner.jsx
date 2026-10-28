import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { findLanguageByCode } from '../data/languagesConfig';

/**
 * 5. TIBBIY MATN SIFATI OGOHLANTIRISHI
 * Avto-tarjima bo'lgan (tekshirilmagan) tillar tanlanganda kichik va nafis ogohlantirish nishoni/banneri.
 */
export const MedicalDisclaimerBanner = ({ currentLanguage = 'uz-Latn', onSwitchToVerified }) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);

  const langObj = findLanguageByCode(currentLanguage);

  // Agar til tekshirilgan bo'lsa yoki ogohlantirish yopilgan bo'lsa ko'rsatilmaydi
  if (!langObj || langObj.isVerified || isDismissed) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-3 sm:px-4 py-2 text-xs text-amber-900 dark:text-amber-200 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="truncate">
            {t(
              'medical_disclaimer.auto_warning', 
              'Ushbu til avtomatik tarjima qilingan. Tibbiy aniqlik uchun inglizcha yoki o\'zbekcha variantga qarang.'
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onSwitchToVerified && onSwitchToVerified('en')}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-md font-semibold text-[11px] transition"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>English (Verified)</span>
          </button>

          <button
            onClick={() => onSwitchToVerified && onSwitchToVerified('uz-Latn')}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-md font-semibold text-[11px] transition"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>O'zbekcha</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition"
            aria-label="Yopish"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
