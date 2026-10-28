import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import uzLatn from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

import { findLanguageByCode, WORLD_LANGUAGES } from './data/languagesConfig';
import { applyDirectionAndFonts } from './utils/i18nHelpers';

// Boshlang'ich keshga olingan asosiy resurslar
const initialResources = {
  'uz-Latn': { translation: uzLatn },
  'uz': { translation: uzLatn }, // alias
  'ru': { translation: ru },
  'en': { translation: en }
};


/**
 * Dinamik / Lazy tarjima yuklash helperi
 * Agar til resursi hali yuklanmagan bo'lsa, mos json faylini yuklaydi
 * yoki fallback zanjiridan foydalanadi.
 */
export const loadLanguageResources = async (langCode) => {
  const matched = findLanguageByCode(langCode);
  const code = matched ? matched.code : langCode;

  if (i18n.hasResourceBundle(code, 'translation')) {
    return true;
  }

  try {
    // Vite dinamik importi orqali mavjud lokal faylni yuklashga harakat qiladi
    let moduleData = null;
    if (code === 'uz-Cyrl') {
      moduleData = await import('./locales/uz-Cyrl.json');
    } else if (code === 'tr') {
      moduleData = await import('./locales/tr.json');
    } else if (code === 'ar') {
      moduleData = await import('./locales/ar.json');
    }

    if (moduleData && moduleData.default) {
      i18n.addResourceBundle(code, 'translation', moduleData.default, true, true);
      return true;
    }
  } catch (err) {
    // Agar lokal fayl bo'lmasa, fallback zanjiri uz va en orqali to'ldiriladi
  }

  // Fallback: Agar alohida to'liq tarjima bo'lmasa, asosiy fallback uzLatn/en ni qo'llaydi
  i18n.addResourceBundle(code, 'translation', uzLatn, true, false);
  return true;
};

/**
 * Boshlang'ich tilni aniqlash
 * 1. localStorage ('mednavbat_lang')
 * 2. URL parametri (?lang=...)
 * 3. Brauzer navigator.languages
 * 4. Fallback: 'uz-Latn'
 */
const getInitialLanguage = () => {
  const saved = localStorage.getItem('mednavbat_lang');
  if (saved) {
    if (saved === 'uz' || saved === 'uz-Latn') return 'uz-Latn';
    if (saved === 'ru') return 'ru';
    if (saved === 'en') return 'en';
  }

  // URL parametri tekshiruvi (?lang=...)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang) {
      if (urlLang.startsWith('ru')) return 'ru';
      if (urlLang.startsWith('en')) return 'en';
      if (urlLang.startsWith('uz')) return 'uz-Latn';
    }

    // Brauzer tiliga qarab (navigator.language)
    const browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('en')) return 'en';
  }

  // Boshqa barcha holatlarda O'zbekcha (lotin) asosiy til
  return 'uz-Latn';
};

const initialLang = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: initialResources,
    lng: initialLang,
    // Talab: Yetishmayotgan tarjima uchun fallback zanjiri: tanlangan til -> uz-Latn -> en
    fallbackLng: ['uz-Latn', 'uz', 'en'],
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

/**
 * Sahifa meta ma'lumotlarini (SEO hreflang, title, meta desc) yangilash
 */
const updatePageMeta = (langCode) => {
  if (typeof document === 'undefined') return;

  const currentLangObj = findLanguageByCode(langCode) || WORLD_LANGUAGES[0];

  // 1. RTL / LTR va Shriftlarni qo'llash
  applyDirectionAndFonts(currentLangObj.code);

  // 2. Title va meta description
  const metaObj = i18n.getResourceBundle(langCode, 'translation')?.meta || uzLatn.meta;
  if (metaObj) {
    document.title = metaObj.title || uzLatn.meta.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = metaObj.description || uzLatn.meta.description;
  }

  // 3. SEO Alternate hreflang teglari
  const majorLangs = ['uz-Latn', 'uz-Cyrl', 'ru', 'en', 'tr', 'ar'];
  majorLangs.forEach(code => {
    let hreflangTag = document.querySelector(`link[rel="alternate"][hreflang="${code}"]`);
    if (!hreflangTag) {
      hreflangTag = document.createElement('link');
      hreflangTag.rel = 'alternate';
      hreflangTag.hreflang = code;
      document.head.appendChild(hreflangTag);
    }
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('lang', code);
      hreflangTag.href = currentUrl.toString();
    }
  });
};

// Boshlang'ich sozlash
updatePageMeta(initialLang);

// Til o'zgarganda xotiraga saqlash va DOM ni yangilash
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('mednavbat_lang', lng);
  updatePageMeta(lng);
});

export default i18n;
