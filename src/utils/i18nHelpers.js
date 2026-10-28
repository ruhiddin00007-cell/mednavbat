/**
 * MedNavbat i18n & Intl yordamchi funksiyalari
 * 
 * - ICU / CLDR plural formatlash (Intl.PluralRules)
 * - Sana, vaqt va valyuta formatlash (Intl.DateTimeFormat, Intl.NumberFormat)
 * - RTL yo'nalishi va shriftlarni boshqarish
 * - Fallback zanjiri helperlari
 */

import { findLanguageByCode, WORLD_LANGUAGES } from '../data/languagesConfig.js';


/**
 * Til va hududga mos sana formatlash
 */
export const formatDateByLocale = (date, langCode = 'uz-Latn', options = {}) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const locale = langCode === 'uz-Latn' ? 'uz-UZ' : (langCode === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : langCode);
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (err) {
    return d.toLocaleDateString();
  }
};

/**
 * Til va hududga mos vaqt formatlash
 */
export const formatTimeByLocale = (date, langCode = 'uz-Latn', options = {}) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const locale = langCode === 'uz-Latn' ? 'uz-UZ' : (langCode === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : langCode);
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (err) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

/**
 * Tilga mos narx va valyutani formatlash
 */
export const formatCurrencyByLocale = (amount, currency = 'UZS', langCode = 'uz-Latn') => {
  if (amount === null || amount === undefined) return '';
  const num = Number(amount);
  if (isNaN(num)) return '';

  const locale = langCode === 'uz-Latn' ? 'uz-UZ' : (langCode === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : langCode);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(num);
  } catch (err) {
    // Agar UZS brauzerda maxsus belgi bermasa, chiroyli matnli fallback
    return `${num.toLocaleString()} ${currency === 'UZS' ? "so'm" : currency}`;
  }
};

/**
 * ICU/CLDR Plural Rules bo'yicha ko'plik shaklini aniqlash
 * @param {number} count - Miqdor
 * @param {string} langCode - Til kodi
 * @returns {'zero'|'one'|'two'|'few'|'many'|'other'}
 */
export const getPluralCategory = (count, langCode = 'uz-Latn') => {
  const locale = langCode === 'uz-Latn' ? 'uz' : (langCode === 'uz-Cyrl' ? 'ru' : langCode);
  try {
    const pr = new Intl.PluralRules(locale);
    return pr.select(count);
  } catch (err) {
    return count === 1 ? 'one' : 'other';
  }
};

/**
 * RTL va LTR yo'nalishini hamda shriftlarni HTML elementiga tatbiq etish
 */
export const applyDirectionAndFonts = (langCode) => {
  if (typeof document === 'undefined') return;

  const langObj = findLanguageByCode(langCode) || WORLD_LANGUAGES[0];
  const direction = langObj.direction || 'ltr';
  const script = langObj.script || 'latin';

  // 1. dir va lang atributlari
  document.documentElement.dir = direction;
  document.documentElement.lang = langObj.code;

  // 2. Body sinflari (RTL va Script klasslari)
  const classList = document.documentElement.classList;
  if (direction === 'rtl') {
    classList.add('rtl-mode');
    document.body.classList.add('rtl-mode');
  } else {
    classList.remove('rtl-mode');
    document.body.classList.remove('rtl-mode');
  }

  // 3. Maxsus script klassi
  document.documentElement.setAttribute('data-script', script);
  document.documentElement.setAttribute('data-lang', langObj.code);

  // 4. Fallback shriftni style orqali dinamik sozlash
  if (langObj.fontFamily) {
    document.documentElement.style.setProperty('--app-font-family', langObj.fontFamily);
  }
};
