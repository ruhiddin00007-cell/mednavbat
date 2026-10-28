// MedNavbat - Comprehensive Location Data Repository
// Covers 14 Administrative Regions of Uzbekistan + International Country Registry

import { WORLD_COUNTRIES, getCountryByIso2 } from './countriesData.js';

export { WORLD_COUNTRIES, getCountryByIso2 };

export const UZBEKISTAN_REGIONS = [
  {
    id: 'tashkent_city',
    name: 'Toshkent shahri',
    name_uz: 'Toshkent shahri',
    name_ru: 'г. Ташкент',
    name_en: 'Tashkent City',
    shortName: 'Toshkent sh.',
    lat: 41.3111,
    lon: 69.2797,
    aliases: ['tashkent', 'toshkent', 'gorod tashkent', 'город ташкент', 'ташкент'],
    centerHospital: 'Respublika Shoshilinch Tibbiy Yordam Markazi',
    doctorsCount: 48,
    clinicsCount: 19
  },
  {
    id: 'tashkent_region',
    name: 'Toshkent viloyati',
    name_uz: 'Toshkent viloyati',
    name_ru: 'Ташкентская область',
    name_en: 'Tashkent Region',
    shortName: 'Toshkent vil.',
    lat: 41.2500,
    lon: 69.8000,
    aliases: ['tashkent region', 'toshkent viloyati', 'ташкентская область', 'chirchiq', 'olmaliq', 'angren', 'bekobod', 'yangiyo‘l'],
    centerHospital: 'Toshkent Viloyat Ko\'p Tarmoqli Shifoxonasi',
    doctorsCount: 24,
    clinicsCount: 11
  },
  {
    id: 'andijan',
    name: 'Andijon viloyati',
    name_uz: 'Andijon viloyati',
    name_ru: 'Андижанская область',
    name_en: 'Andijan Region',
    shortName: 'Andijon',
    lat: 40.7821,
    lon: 72.3442,
    aliases: ['andijan', 'andijon', 'андижан', 'андижанская область', 'asaka', 'shahrixon'],
    centerHospital: 'Andijon Viloyat Ko\'p Tarmoqli Tibbiyot Markazi',
    doctorsCount: 18,
    clinicsCount: 8
  },
  {
    id: 'bukhara',
    name: 'Buxoro viloyati',
    name_uz: 'Buxoro viloyati',
    name_ru: 'Бухарская область',
    name_en: 'Bukhara Region',
    shortName: 'Buxoro',
    lat: 39.7747,
    lon: 64.4286,
    aliases: ['bukhara', 'buxoro', 'бухара', 'бухарская область', 'kogon', 'g‘ijduvon'],
    centerHospital: 'Buxoro Viloyat Kardiologiya Markazi',
    doctorsCount: 16,
    clinicsCount: 7
  },
  {
    id: 'fergana',
    name: "Farg'ona viloyati",
    name_uz: "Farg'ona viloyati",
    name_ru: 'Ферганская область',
    name_en: 'Fergana Region',
    shortName: "Farg'ona",
    lat: 40.3842,
    lon: 71.7843,
    aliases: ['fergana', "farg'ona", 'фергана', 'ферганская область', 'qo‘qon', 'marg‘ilon', 'quva'],
    centerHospital: "Farg'ona Viloyat Shoshilinch Tibbiy Yordam Markazi",
    doctorsCount: 22,
    clinicsCount: 9
  },
  {
    id: 'jizzakh',
    name: 'Jizzax viloyati',
    name_uz: 'Jizzax viloyati',
    name_ru: 'Джизакская область',
    name_en: 'Jizzakh Region',
    shortName: 'Jizzax',
    lat: 40.1158,
    lon: 67.8422,
    aliases: ['jizzakh', 'jizzax', 'джизак', 'джизакская область', 'do‘stlik', 'paxtakor'],
    centerHospital: 'Jizzax Viloyat Tibbiyot Markazi',
    doctorsCount: 12,
    clinicsCount: 5
  },
  {
    id: 'khorezm',
    name: 'Xorazm viloyati',
    name_uz: 'Xorazm viloyati',
    name_ru: 'Хорезмская область',
    name_en: 'Khorezm Region',
    shortName: 'Xorazm',
    lat: 41.5500,
    lon: 60.6333,
    aliases: ['khorezm', 'xorazm', 'хорезм', 'хорезмская область', 'urganch', 'xiva', 'xanka'],
    centerHospital: 'Xorazm Viloyat Diagnostika Markazi',
    doctorsCount: 15,
    clinicsCount: 6
  },
  {
    id: 'namangan',
    name: 'Namangan viloyati',
    name_uz: 'Namangan viloyati',
    name_ru: 'Наманганская область',
    name_en: 'Namangan Region',
    shortName: 'Namangan',
    lat: 40.9983,
    lon: 71.6726,
    aliases: ['namangan', 'наманган', 'наманганская область', 'chust', 'kosonsoy', 'pop'],
    centerHospital: 'Namangan Viloyat Kardiologiya Dispanseri',
    doctorsCount: 17,
    clinicsCount: 8
  },
  {
    id: 'navoiy',
    name: 'Navoiy viloyati',
    name_uz: 'Navoiy viloyati',
    name_ru: 'Навоийская область',
    name_en: 'Navoiy Region',
    shortName: 'Navoiy',
    lat: 40.0844,
    lon: 65.3792,
    aliases: ['navoiy', 'navoi', 'навои', 'навоийская область', 'zarafshon', 'uchquduq'],
    centerHospital: 'Navoiy Shahar 1-son Shifoxonasi',
    doctorsCount: 11,
    clinicsCount: 5
  },
  {
    id: 'kashkadarya',
    name: 'Qashqadaryo viloyati',
    name_uz: 'Qashqadaryo viloyati',
    name_ru: 'Кашкадарьинская область',
    name_en: 'Kashkadarya Region',
    shortName: 'Qashqadaryo',
    lat: 38.8606,
    lon: 65.7891,
    aliases: ['kashkadarya', 'qashqadaryo', 'кашкадарья', 'кашкадарьинская область', 'qarshi', 'shahrisabz', 'kitob'],
    centerHospital: 'Qashqadaryo Viloyat Bolalar Ko\'p Tarmoqli Shifoxonasi',
    doctorsCount: 16,
    clinicsCount: 7
  },
  {
    id: 'karakalpakstan',
    name: "Qoraqalpog'iston Respublikasi",
    name_uz: "Qoraqalpog'iston Respublikasi",
    name_ru: 'Республика Каракалпакстан',
    name_en: 'Republic of Karakalpakstan',
    shortName: "Qoraqalpog'iston",
    lat: 42.4602,
    lon: 59.6166,
    aliases: ['karakalpakstan', "qoraqalpog'iston", 'qoraqalpoq', 'каракалпакстан', 'nukus', 'нукус', 'qo‘ng‘irot'],
    centerHospital: "Qoraqalpog'iston Respublika Ko'p Tarmoqli Shifoxonasi",
    doctorsCount: 14,
    clinicsCount: 6
  },
  {
    id: 'samarkand',
    name: 'Samarqand viloyati',
    name_uz: 'Samarqand viloyati',
    name_ru: 'Самаркандская область',
    name_en: 'Samarkand Region',
    shortName: 'Samarqand',
    lat: 39.6542,
    lon: 66.9597,
    aliases: ['samarkand', 'samarqand', 'самарканд', 'самаркандская область', 'urgut', 'kattaqo‘rg‘on'],
    centerHospital: 'Samarqand Davlat Tibbiyot Universiteti Klinikasi',
    doctorsCount: 26,
    clinicsCount: 12
  },
  {
    id: 'sirdaryo',
    name: 'Sirdaryo viloyati',
    name_uz: 'Sirdaryo viloyati',
    name_ru: 'Сырдарьинская область',
    name_en: 'Sirdaryo Region',
    shortName: 'Sirdaryo',
    lat: 40.8373,
    lon: 68.6618,
    aliases: ['sirdaryo', 'syrdarya', 'сырдарья', 'сырдарьинская область', 'guliston', 'гулистан', 'yangiyer'],
    centerHospital: 'Sirdaryo Viloyat Tibbiyot Birlashmasi',
    doctorsCount: 10,
    clinicsCount: 4
  },
  {
    id: 'surkhandarya',
    name: 'Surxondaryo viloyati',
    name_uz: 'Surxondaryo viloyati',
    name_ru: 'Сурхандарьинская область',
    name_en: 'Surkhandarya Region',
    shortName: 'Surxondaryo',
    lat: 37.2286,
    lon: 67.2753,
    aliases: ['surkhandarya', 'surxondaryo', 'сурхандарья', 'сурхандарьинская область', 'termiz', 'термез', 'denov'],
    centerHospital: 'Surxondaryo Viloyat Shoshilinch Tibbiyot Markazi',
    doctorsCount: 13,
    clinicsCount: 6
  }
];

// Boshlang'ich faol davlatlar (kamida 1 ta tasdiqlangan shifokori bor davlatlar)
// DIQQAT: doctorsRepository.js dan import qilinmaydi (circular dep oldini olish)
export const COUNTRIES = [
  { id: 'UZ', code: 'UZ', iso2: 'UZ', name: "O'zbekiston", nameUz: "O'zbekiston", dialCode: '+998', flag: '🇺🇿', isSupported: true, isActive: true, doctorsCount: 4, regionsCount: 14, onlineDoctorsCount: 2, statusBadgeText: "Faol (14 viloyat)", onlineBadgeText: "Hozir online: 2 shifokor" },
  { id: 'US', code: 'US', iso2: 'US', name: "AQSH", nameUz: "AQSH", dialCode: '+1', flag: '🇺🇸', isSupported: true, isActive: true, doctorsCount: 2, regionsCount: 2, onlineDoctorsCount: 0, statusBadgeText: "Faol (2 shtat)", onlineBadgeText: "Hozir online: 0 shifokor" },
  { id: 'KZ', code: 'KZ', iso2: 'KZ', name: "Qozog'iston", nameUz: "Qozog'iston", dialCode: '+7', flag: '🇰🇿', isSupported: true, isActive: true, doctorsCount: 1, regionsCount: 1, onlineDoctorsCount: 1, statusBadgeText: "Faol (1 ta shifokor)", onlineBadgeText: "Hozir online: 1 shifokor" },
  { id: 'TR', code: 'TR', iso2: 'TR', name: "Turkiya", nameUz: "Turkiya", dialCode: '+90', flag: '🇹🇷', isSupported: true, isActive: true, doctorsCount: 1, regionsCount: 1, onlineDoctorsCount: 1, statusBadgeText: "Faol (1 ta shifokor)", onlineBadgeText: "Hozir online: 1 shifokor" },
  { id: 'DE', code: 'DE', iso2: 'DE', name: "Germaniya", nameUz: "Germaniya", dialCode: '+49', flag: '🇩🇪', isSupported: true, isActive: true, doctorsCount: 1, regionsCount: 1, onlineDoctorsCount: 1, statusBadgeText: "Faol (1 ta shifokor)", onlineBadgeText: "Hozir online: 1 shifokor" },
  { id: 'GB', code: 'GB', iso2: 'GB', name: "Buyuk Britaniya", nameUz: "Buyuk Britaniya", dialCode: '+44', flag: '🇬🇧', isSupported: true, isActive: true, doctorsCount: 1, regionsCount: 1, onlineDoctorsCount: 1, statusBadgeText: "Faol (1 ta shifokor)", onlineBadgeText: "Hozir online: 1 shifokor" }
];

// Circular dependency ni oldini olish uchun: getActiveCountriesWithDoctorStats() ni
// faqat runtime da lazy-import qilib chaqiramiz
export const getActiveCountries = () => {
  // doctorsRepository ni lazy import qilish (circular dep yo'q)
  try {
    // Dynamic import ishlatilmaydi (sync kerak), shuning uchun to'g'ridan COUNTRIES qaytaramiz.
    // Haqiqiy real-time statistika doctorsRepository.getActiveCountriesWithDoctorStats() dan keladi
    // va u LocationSelector.jsx da alohida chaqiriladi.
    return COUNTRIES;
  } catch (_e) {
    return COUNTRIES;
  }
};

// Calculate distance between two lat/lon points using Haversine formula (km)
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find closest Uzbekistan region based on GPS coordinates
export const findNearestUzbekistanRegion = (lat, lon) => {
  let nearest = UZBEKISTAN_REGIONS[0];
  let minDistance = Infinity;

  for (const region of UZBEKISTAN_REGIONS) {
    const dist = calculateDistanceKm(lat, lon, region.lat, region.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = region;
    }
  }

  return { region: nearest, distanceKm: Math.round(minDistance) };
};

// Match region by text string (e.g. from reverse geocoding or user search)
export const matchRegionByName = (str = '') => {
  if (!str) return null;
  const normalized = str.toLowerCase().trim();

  // Exact ID match
  const byId = UZBEKISTAN_REGIONS.find(r => r.id === normalized);
  if (byId) return byId;

  // Exact Name match
  const byName = UZBEKISTAN_REGIONS.find(r => 
    r.name.toLowerCase() === normalized ||
    r.name_uz.toLowerCase() === normalized ||
    r.name_ru.toLowerCase() === normalized ||
    r.name_en.toLowerCase() === normalized
  );
  if (byName) return byName;

  // Alias match or partial containment
  for (const reg of UZBEKISTAN_REGIONS) {
    if (reg.aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
      return reg;
    }
  }

  return null;
};

// Match country by code, ISO2, dial code, or name across the entire WORLD database
export const matchCountryByCodeOrName = (codeOrName = '') => {
  const activeList = COUNTRIES;
  if (!codeOrName) return activeList[0] || WORLD_COUNTRIES[0];

  const normalized = codeOrName.toUpperCase().trim();

  // 1. Faol davlatlar orasidan qidirish
  const activeByCode = activeList.find(c => c.code === normalized || c.iso2 === normalized);
  if (activeByCode) return activeByCode;

  const lower = codeOrName.toLowerCase().trim();
  const activeByName = activeList.find(c =>
    c.name.toLowerCase() === lower ||
    (c.nameUz && c.nameUz.toLowerCase() === lower) ||
    (c.name_uz && c.name_uz.toLowerCase() === lower)
  );
  if (activeByName) return activeByName;

  // 2. Butun dunyo davlatlari orasidan qidirish
  const worldCountry = WORLD_COUNTRIES.find(c =>
    c.iso2 === normalized ||
    c.dialCode === codeOrName.trim() ||
    c.nameUz.toLowerCase() === lower ||
    c.nameEn.toLowerCase() === lower ||
    c.nameRu.toLowerCase() === lower
  );

  if (worldCountry) {
    return {
      id: worldCountry.id,
      code: worldCountry.iso2,
      iso2: worldCountry.iso2,
      name: worldCountry.nameUz,
      nameUz: worldCountry.nameUz,
      nameEn: worldCountry.nameEn,
      nameRu: worldCountry.nameRu,
      flag: worldCountry.flag,
      dialCode: worldCountry.dialCode,
      isActive: false,
      isSupported: false,
      doctorsCount: 0,
      regionsCount: 0,
      onlineDoctorsCount: 0,
      statusBadgeText: '0 shifokor',
      onlineBadgeText: 'Hozir online: 0 shifokor'
    };
  }

  return activeList[0] || WORLD_COUNTRIES[0];
};

export const DEFAULT_COUNTRY = COUNTRIES[0];

export const DEFAULT_REGION = UZBEKISTAN_REGIONS[0]; // Tashkent city


