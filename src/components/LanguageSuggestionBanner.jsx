import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { findLanguageByCode, getSuggestedLanguageForCountry } from '../data/languagesConfig';

/**
 * 3. AVTOMATIK ANIQLASH BANNERI
 * - Birinchi kirishda qurilma/brauzer tilini aniqlaydi va agar hozirgi tildan farq qilsa, taklif beradi (majburlamaydi).
 * - Davlat tanlanganda o'sha davlatning asosiy tilini taklif qiladi (foydalanuvchi qabul qilishi yoki rad etishi mumkin).
 */
export const LanguageSuggestionBanner = ({
  currentLanguage = 'uz-Latn',
  selectedCountry = null,
  onAcceptLanguage
}) => {
  const { t } = useTranslation();
  const [suggestion, setSuggestion] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // 1. Brauzer tilini birinchi kirishda tekshirish
  useEffect(() => {
    const hasPrompted = sessionStorage.getItem('mednavbat_browser_lang_prompted');
    const savedLang = localStorage.getItem('mednavbat_lang');

    // Faqat foydalanuvchi o'zi qo'lda til tanlamagan bo'lsa va hali so'ralmagan bo'lsa
    if (!savedLang && !hasPrompted && typeof window !== 'undefined') {
      const browserLangs = navigator.languages || [navigator.language || ''];
      for (const bLang of browserLangs) {
        const matched = findLanguageByCode(bLang);
        if (matched && matched.code !== currentLanguage) {
          setSuggestion({
            type: 'browser',
            lang: matched,
            text: t('suggestion.browser_detected', { 
              langName: matched.nameNative, 
              defaultValue: `Brauzeringiz tili: ${matched.nameNative}. Shu tilga o'tishni xohlaysizmi?` 
            })
          });
          sessionStorage.setItem('mednavbat_browser_lang_prompted', 'true');
          break;
        }
      }
    }
  }, [currentLanguage, t]);

  // 2. Davlat tanlanganda mos tilni taklif qilish
  useEffect(() => {
    if (!selectedCountry) return;
    const countryCode = selectedCountry.code || selectedCountry.iso2;
    if (!countryCode) return;

    const suggested = getSuggestedLanguageForCountry(countryCode);
    if (suggested && suggested.code !== currentLanguage) {
      // Bir marta taklif qilish
      const sessionKey = `mednavbat_country_lang_${countryCode}`;
      if (!sessionStorage.getItem(sessionKey)) {
        setSuggestion({
          type: 'country',
          lang: suggested,
          countryName: selectedCountry.name || countryCode,
          text: t('suggestion.country_detected', { 
            countryName: selectedCountry.name || countryCode,
            langName: suggested.nameNative,
            defaultValue: `Siz ${selectedCountry.name || countryCode}ni tanladingiz. Tizimni ${suggested.nameNative} tiliga o'zgartirasizmi?`
          })
        });
        sessionStorage.setItem(sessionKey, 'true');
        setIsDismissed(false);
      }
    }
  }, [selectedCountry, currentLanguage, t]);

  if (!suggestion || isDismissed) return null;

  const handleAccept = () => {
    if (onAcceptLanguage && suggestion.lang) {
      onAcceptLanguage(suggestion.lang.code);
    }
    setSuggestion(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setSuggestion(null);
  };

  return (
    <div className="w-full bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white shadow-md z-40 transition-all animate-fadeIn">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0">
            <span className="text-base leading-none">{suggestion.lang.flag}</span>
          </div>
          <div className="font-medium text-white truncate">
            {suggestion.text}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-teal-800 hover:bg-teal-50 rounded-lg font-bold text-xs shadow-xs transition active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('suggestion.accept', 'Ha, o\'zgartirish')}</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
