/**
 * MedNavbat Til Qidiruvi va Fuzzy Matching moduli
 * 
 * - Diakritik belgilar (ö, ç, ı, ü, ğ, ä, ë, ñ, é va boshqalar)
 * - Apostrof turlari (' ʻ ’ ‘ ʼ)
 * - Katta-kichik harf farqsizligi
 * - BCP-47 kod, endonym, inglizcha va o'zbekcha nomlar bo'yicha qidiruv
 * - Xato yozuvga (typo) chidamli fuzzy search algoritmi
 */

import { WORLD_LANGUAGES } from '../data/languagesConfig.js';


const RECENT_LANGUAGES_KEY = 'mednavbat_recent_languages';

/**
 * Matnni qidiruv uchun to'liq tozalash va normallashtirish
 */
export const normalizeLanguageSearchText = (text = '') => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    // Har xil apostrof va tirnoq belgilarini bitta standartlashtirish
    .replace(/['ʻ’‘ʼ`]/g, '')
    // Turkcha va boshqa tillardagi maxsus harflar
    .replace(/ı/g, 'i')
    .replace(/ə/g, 'e')
    // Diakritik belgilarni olib tashlash (ö -> o, ü -> u, ç -> c, é -> e va h.k.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Kirill va boshqa harflarda qulaylik
    .replace(/ё/g, 'е');
};

/**
 * Levenshtein masofasi (Fuzzy matching uchun)
 */
export const calculateLevenshteinDistance = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // almashtirish
          Math.min(
            matrix[i][j - 1] + 1,     // qo'shish
            matrix[i - 1][j] + 1      // o'chirish
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Qidiruv so'rovi bo'yicha tillarni saralab topish
 * @param {string} query - Foydalanuvchi qidiruv so'zi
 * @param {Array} list - Tillar ro'yxati (standart WORLD_LANGUAGES)
 * @returns {Array} - Mos kelgan tillar (score bo'yicha tartiblangan)
 */
export const searchLanguages = (query = '', list = WORLD_LANGUAGES) => {
  if (!query || !query.trim()) {
    return list;
  }

  const rawQuery = query.trim().toLowerCase();
  const normalizedQuery = normalizeLanguageSearchText(rawQuery);

  const scoredResults = [];

  for (const lang of list) {
    let score = 0;
    let matched = false;

    const rawCode = lang.code.toLowerCase();
    const rawNative = lang.nameNative.toLowerCase();
    const rawEn = lang.nameEn.toLowerCase();
    const rawUz = lang.nameUz.toLowerCase();

    const normCode = normalizeLanguageSearchText(lang.code);
    const normNative = normalizeLanguageSearchText(lang.nameNative);
    const normEn = normalizeLanguageSearchText(lang.nameEn);
    const normUz = normalizeLanguageSearchText(lang.nameUz);

    // 1. EXACT MATCHES (Eng yuqori ball)
    if (rawCode === rawQuery || normCode === normalizedQuery) {
      score += 150;
      matched = true;
    } else if (rawCode.split('-')[0] === rawQuery) {
      score += 130;
      matched = true;
    }

    if (normNative === normalizedQuery || rawNative === rawQuery) {
      score += 140;
      matched = true;
    }
    if (normEn === normalizedQuery || rawEn === rawQuery) {
      score += 130;
      matched = true;
    }
    if (normUz === normalizedQuery || rawUz === rawQuery) {
      score += 130;
      matched = true;
    }

    // 2. STARTS WITH MATCHES
    if (rawCode.startsWith(rawQuery) || normCode.startsWith(normalizedQuery)) {
      score += 100;
      matched = true;
    }
    if (normNative.startsWith(normalizedQuery) || rawNative.startsWith(rawQuery)) {
      score += 90;
      matched = true;
    }
    if (normEn.startsWith(normalizedQuery) || rawEn.startsWith(rawQuery)) {
      score += 85;
      matched = true;
    }
    if (normUz.startsWith(normalizedQuery) || rawUz.startsWith(rawQuery)) {
      score += 85;
      matched = true;
    }

    // 3. INCLUDES MATCHES
    if (normCode.includes(normalizedQuery)) {
      score += 70;
      matched = true;
    }
    if (normNative.includes(normalizedQuery) || rawNative.includes(rawQuery)) {
      score += 65;
      matched = true;
    }
    if (normEn.includes(normalizedQuery) || rawEn.includes(rawQuery)) {
      score += 60;
      matched = true;
    }
    if (normUz.includes(normalizedQuery) || rawUz.includes(rawQuery)) {
      score += 60;
      matched = true;
    }

    // 4. ALIASES MATCHES (masalan "rus", "eng", "chi", "uzb", "kz")
    if (Array.isArray(lang.aliases)) {
      for (const alias of lang.aliases) {
        const normAlias = normalizeLanguageSearchText(alias);
        if (normAlias === normalizedQuery) {
          score += 120;
          matched = true;
          break;
        } else if (normAlias.startsWith(normalizedQuery)) {
          score += 75;
          matched = true;
          break;
        } else if (normAlias.includes(normalizedQuery)) {
          score += 50;
          matched = true;
          break;
        }
      }
    }

    // 5. FUZZY MATCHING (Agar query kamida 3 ta harf bo'lsa va to'g'ridan-to'g'ri topilmagan bo'lsa)
    if (!matched && normalizedQuery.length >= 3) {
      const candidates = [normNative, normEn, normUz];
      for (const cand of candidates) {
        // So'zlar bo'yicha tekshirish (masalan: "fransuz" va "fransuzcha")
        const words = cand.split(/\s+/);
        for (const w of words) {
          const maxDistance = normalizedQuery.length <= 4 ? 1 : 2;
          const dist = calculateLevenshteinDistance(normalizedQuery, w.slice(0, normalizedQuery.length + 1));
          if (dist <= maxDistance) {
            score += Math.max(10, 45 - dist * 15);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    if (matched) {
      scoredResults.push({ lang, score });
    }
  }

  // Eng yuqori moslik balli bo'yicha saralash
  return scoredResults
    .sort((a, b) => b.score - a.score)
    .map(item => item.lang);
};

/**
 * Yaqinda ishlatilgan tillarni localStorage dan olish
 */
export const getRecentLanguages = () => {
  try {
    const raw = localStorage.getItem(RECENT_LANGUAGES_KEY);
    if (!raw) return [];
    const codes = JSON.parse(raw);
    if (!Array.isArray(codes)) return [];
    
    return codes
      .map(c => WORLD_LANGUAGES.find(l => l.code === c || (l.aliases && l.aliases.includes(c))))
      .filter(Boolean)
      .slice(0, 3);
  } catch (err) {
    return [];
  }
};

/**
 * Yaqinda ishlatilgan tillar ro'yxatiga yangi til qo'shish
 */
export const addRecentLanguage = (langCode) => {
  try {
    const current = getRecentLanguages().map(l => l.code);
    const updated = [langCode, ...current.filter(c => c !== langCode)].slice(0, 3);
    localStorage.setItem(RECENT_LANGUAGES_KEY, JSON.stringify(updated));
  } catch (err) {
    // Ignore storage errors
  }
};
