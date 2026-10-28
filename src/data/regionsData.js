/**
 * MedNavbat — Xalqaro Hududlar & Shtatlar Registri (Regions Database)
 * ──────────────────────────────────────────────────────────────────
 * Har bir hudud:
 *  - id: Unikal identifikator
 *  - countryId: Davlatning ISO2 kodi ('UZ', 'US', 'KZ', 'TR', 'DE', 'GB', 'RU', ...)
 *  - nameUz: O'zbek tilidagi rasmiy nomi
 *  - nameOriginal: Mahalliy tildagi nomi
 *  - timeZone: Ushbu hududning aniq IANA vaqt zonasi
 */

import { UZBEKISTAN_REGIONS } from './locationData.js';

// O'zbekiston hududlarini yangi modelga moslashtiramiz
export const UZ_REGIONS = UZBEKISTAN_REGIONS.map(reg => ({
  id: reg.id,
  countryId: 'UZ',
  nameUz: reg.name_uz || reg.name,
  nameEn: reg.name_en,
  nameRu: reg.name_ru,
  shortName: reg.shortName,
  timeZone: 'Asia/Tashkent',
  lat: reg.lat,
  lon: reg.lon,
  centerHospital: reg.centerHospital
}));

// Xalqaro asosiy davlatlar hududlari / shtatlari
export const INTERNATIONAL_REGIONS = [
  // AQSH (United States)
  { id: 'us_ny', countryId: 'US', nameUz: 'Nyu-York shtati', nameEn: 'New York', timeZone: 'America/New_York' },
  { id: 'us_ca', countryId: 'US', nameUz: 'Kaliforniya', nameEn: 'California', timeZone: 'America/Los_Angeles' },
  { id: 'us_tx', countryId: 'US', nameUz: 'Texas', nameEn: 'Texas', timeZone: 'America/Chicago' },
  { id: 'us_fl', countryId: 'US', nameUz: 'Florida', nameEn: 'Florida', timeZone: 'America/New_York' },
  { id: 'us_il', countryId: 'US', nameUz: 'Illinoys (Chikago)', nameEn: 'Illinois', timeZone: 'America/Chicago' },
  { id: 'us_ma', countryId: 'US', nameUz: 'Massachusets (Boston)', nameEn: 'Massachusetts', timeZone: 'America/New_York' },
  { id: 'us_wa', countryId: 'US', nameUz: 'Vashington shtati', nameEn: 'Washington', timeZone: 'America/Los_Angeles' },

  // Qozog'iston (Kazakhstan)
  { id: 'kz_ala', countryId: 'KZ', nameUz: 'Olmaota shahri', nameEn: 'Almaty', timeZone: 'Asia/Almaty' },
  { id: 'kz_ast', countryId: 'KZ', nameUz: 'Ostona shahri', nameEn: 'Astana', timeZone: 'Asia/Almaty' },
  { id: 'kz_shym', countryId: 'KZ', nameUz: 'Chimkent shahri', nameEn: 'Shymkent', timeZone: 'Asia/Almaty' },
  { id: 'kz_kar', countryId: 'KZ', nameUz: "Qarag'andi viloyati", nameEn: 'Karaganda', timeZone: 'Asia/Almaty' },

  // Turkiya (Turkey)
  { id: 'tr_ist', countryId: 'TR', nameUz: 'Istanbul', nameEn: 'Istanbul', timeZone: 'Europe/Istanbul' },
  { id: 'tr_ank', countryId: 'TR', nameUz: 'Anqara', nameEn: 'Ankara', timeZone: 'Europe/Istanbul' },
  { id: 'tr_izm', countryId: 'TR', nameUz: 'Izmir', nameEn: 'Izmir', timeZone: 'Europe/Istanbul' },
  { id: 'tr_ant', countryId: 'TR', nameUz: 'Antaliya', nameEn: 'Antalya', timeZone: 'Europe/Istanbul' },

  // Germaniya (Germany)
  { id: 'de_ber', countryId: 'DE', nameUz: 'Berlin', nameEn: 'Berlin', timeZone: 'Europe/Berlin' },
  { id: 'de_bay', countryId: 'DE', nameUz: 'Bavariya (Myunxen)', nameEn: 'Bavaria', timeZone: 'Europe/Berlin' },
  { id: 'de_nrw', countryId: 'DE', nameUz: 'Shimoliy Reyn-Vestfaliya (Kyoln/Dyusseldorf)', nameEn: 'North Rhine-Westphalia', timeZone: 'Europe/Berlin' },
  { id: 'de_ham', countryId: 'DE', nameUz: 'Gamburg', nameEn: 'Hamburg', timeZone: 'Europe/Berlin' },
  { id: 'de_hes', countryId: 'DE', nameUz: 'Gessen (Frankfurt)', nameEn: 'Hesse', timeZone: 'Europe/Berlin' },

  // Buyuk Britaniya (United Kingdom)
  { id: 'gb_lon', countryId: 'GB', nameUz: 'London (Buyuk London)', nameEn: 'Greater London', timeZone: 'Europe/London' },
  { id: 'gb_man', countryId: 'GB', nameUz: 'Manchester', nameEn: 'Greater Manchester', timeZone: 'Europe/London' },
  { id: 'gb_bir', countryId: 'GB', nameUz: 'Birmingem', nameEn: 'West Midlands', timeZone: 'Europe/London' },
  { id: 'gb_edi', countryId: 'GB', nameUz: 'Edinburg (Shotlandiya)', nameEn: 'Edinburgh', timeZone: 'Europe/London' },

  // Rossiya (Russia)
  { id: 'ru_mow', countryId: 'RU', nameUz: 'Moskva shahri', nameEn: 'Moscow', timeZone: 'Europe/Moscow' },
  { id: 'ru_spb', countryId: 'RU', nameUz: 'Sankt-Peterburg', nameEn: 'Saint Petersburg', timeZone: 'Europe/Moscow' },
  { id: 'ru_nso', countryId: 'RU', nameUz: 'Novosibirsk viloyati', nameEn: 'Novosibirsk', timeZone: 'Asia/Novosibirsk' },
  { id: 'ru_tat', countryId: 'RU', nameUz: 'Tatariston (Qozon)', nameEn: 'Tatarstan', timeZone: 'Europe/Moscow' },

  // BAA (United Arab Emirates)
  { id: 'ae_dxb', countryId: 'AE', nameUz: 'Dubay amirligi', nameEn: 'Dubai', timeZone: 'Asia/Dubai' },
  { id: 'ae_auh', countryId: 'AE', nameUz: 'Abu-Dabi amirligi', nameEn: 'Abu Dhabi', timeZone: 'Asia/Dubai' },

  // Janubiy Koreya (South Korea)
  { id: 'kr_seo', countryId: 'KR', nameUz: 'Seul maxsus shahri', nameEn: 'Seoul', timeZone: 'Asia/Seoul' },
  { id: 'kr_pus', countryId: 'KR', nameUz: 'Pusan', nameEn: 'Busan', timeZone: 'Asia/Seoul' },
  { id: 'kr_inc', countryId: 'KR', nameUz: 'Incheon', nameEn: 'Incheon', timeZone: 'Asia/Seoul' }
];

export const ALL_REGIONS = [...UZ_REGIONS, ...INTERNATIONAL_REGIONS];

export const getRegionsByCountry = (countryIso2) => {
  if (!countryIso2) return [];
  const upper = countryIso2.toUpperCase();
  return ALL_REGIONS.filter(r => r.countryId === upper);
};

export const getRegionById = (regionId) => {
  if (!regionId) return null;
  return ALL_REGIONS.find(r => r.id === regionId) || null;
};
