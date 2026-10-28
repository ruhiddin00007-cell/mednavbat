/**
 * MedNavbat — O'zbekiston Shifoxonalari Xarita Koordinatalari
 * ─────────────────────────────────────────────────────────────
 * Butun O'zbekiston bo'yicha 14 ta hududdagi asosiy shifoxonalar,
 * ularning aniq geografik koordinatalari (lat, lng), manzillari,
 * telefon raqamlari va masofani hisoblash (Haversine formulasi).
 */

import { UZBEKISTAN_MEDICAL_DATA } from './uzbekistanMedicalData.js';

// Haversine formulasi: 2 nuqta orasidagi masofani km da hisoblash
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Yer radiusi km da
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 o'nlik kasrgacha yaxlitlash (masalan: 2.4 km)
}

// Barcha shifoxonalarni koordinatalari bilan boyitilgan ro'yxati
export const HOSPITALS_GEO = [
  // ── Toshkent shahri ──
  {
    id: 'hosp-tash-1',
    regionId: 'tashkent_city',
    regionName: 'Toshkent shahri',
    name: 'Respublika Shoshilinch Tibbiy Yordam Ilmiy Markazi (RSHTYoIM)',
    shortName: 'RSHTYoIM (16-gorbolnitsa)',
    address: "Chilonzor tumani, Kichik halqa yo'li, 2-uy",
    phone: '+998 71 277 95 65',
    lat: 41.2825,
    lng: 69.2155,
  },
  {
    id: 'hosp-tash-2',
    regionId: 'tashkent_city',
    regionName: 'Toshkent shahri',
    name: 'Respublika Ixtisoslashtirilgan Kardiologiya Ilmiy-Amaliy Tibbiyot Markazi (RIKIATM)',
    shortName: 'RIKIATM Kardiologiya Markazi',
    address: "Mirzo Ulug'bek tumani, Osiyo ko'chasi, 4-uy",
    phone: '+998 71 237 31 42',
    lat: 41.332,
    lng: 69.289,
  },
  {
    id: 'hosp-tash-3',
    regionId: 'tashkent_city',
    regionName: 'Toshkent shahri',
    name: 'Akfa Medline Shifoxonasi',
    shortName: 'Akfa Medline Ko\'p Tarmoqli Markaz',
    address: "Olmazor tumani, Kichik halqa yo'li, 5A-uy",
    phone: '+998 71 203 30 03',
    lat: 41.348,
    lng: 69.229,
  },

  // ── Toshkent viloyati ──
  {
    id: 'hosp-tashobl-1',
    regionId: 'tashkent_region',
    regionName: 'Toshkent viloyati',
    name: "Toshkent Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Toshkent Viloyat Markaziy Shifoxonasi',
    address: "Chirchiq shahri, Alisher Navoiy shoh ko'chasi, 18-uy",
    phone: '+998 70 715 12 30',
    lat: 41.468,
    lng: 69.582,
  },
  {
    id: 'hosp-tashobl-2',
    regionId: 'tashkent_region',
    regionName: 'Toshkent viloyati',
    name: 'Angren Shahar Markaziy Shifoxonasi',
    shortName: 'Angren Shahar Shifoxonasi',
    address: "Angren shahri, Yangi hayot ko'chasi, 1-uy",
    phone: '+998 70 665 21 00',
    lat: 41.016,
    lng: 70.143,
  },

  // ── Samarqand viloyati ──
  {
    id: 'hosp-sam-1',
    regionId: 'samarkand',
    regionName: 'Samarqand viloyati',
    name: 'Samarqand Davlat Tibbiyot Universiteti 1-son Klinikasi',
    shortName: 'SamDTU 1-son Klinikasi',
    address: "Samarqand shahri, Amir Temur ko'chasi, 18-uy",
    phone: '+998 66 233 08 41',
    lat: 39.654,
    lng: 66.96,
  },
  {
    id: 'hosp-sam-2',
    regionId: 'samarkand',
    regionName: 'Samarqand viloyati',
    name: "Samarqand Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Samarqand Viloyat Tibbiyot Markazi',
    address: "Samarqand shahri, Ishtixon ko'chasi, 1-uy",
    phone: '+998 66 235 15 54',
    lat: 39.668,
    lng: 66.942,
  },

  // ── Buxoro viloyati ──
  {
    id: 'hosp-bux-1',
    regionId: 'bukhara',
    regionName: 'Buxoro viloyati',
    name: "Buxoro Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Buxoro Viloyat Markaziy Shifoxonasi',
    address: "Buxoro shahri, Navoiy shoh ko'chasi, 1-uy",
    phone: '+998 65 223 45 12',
    lat: 39.768,
    lng: 64.421,
  },
  {
    id: 'hosp-bux-2',
    regionId: 'bukhara',
    regionName: 'Buxoro viloyati',
    name: 'Buxoro Viloyat Kardiologiya Dispanseri',
    shortName: 'Buxoro Kardiologiya Markazi',
    address: "Buxoro shahri, Ibn Sino ko'chasi, 14-uy",
    phone: '+998 65 221 10 03',
    lat: 39.776,
    lng: 64.435,
  },

  // ── Andijon viloyati ──
  {
    id: 'hosp-and-1',
    regionId: 'andijan',
    regionName: 'Andijon viloyati',
    name: 'Andijon Davlat Tibbiyot Instituti Klinikasi',
    shortName: 'ADTI Klinikasi',
    address: "Andijon shahri, Yu. Otabekov ko'chasi, 1-uy",
    phone: '+998 74 223 35 10',
    lat: 40.782,
    lng: 72.344,
  },
  {
    id: 'hosp-and-2',
    regionId: 'andijan',
    regionName: 'Andijon viloyati',
    name: "Andijon Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Andijon Viloyat Shifoxonasi',
    address: "Andijon shahri, Milliy Tiklanish ko'chasi, 12-uy",
    phone: '+998 74 225 18 20',
    lat: 40.791,
    lng: 72.358,
  },

  // ── Farg'ona viloyati ──
  {
    id: 'hosp-fer-1',
    regionId: 'fergana',
    regionName: "Farg'ona viloyati",
    name: "Farg'ona Viloyat Shoshilinch Tibbiy Yordam Markazi",
    shortName: "Farg'ona Shoshilinch Markazi",
    address: "Farg'ona shahri, Qomus ko'chasi, 18-uy",
    phone: '+998 73 244 03 03',
    lat: 40.384,
    lng: 71.784,
  },
  {
    id: 'hosp-fer-2',
    regionId: 'fergana',
    regionName: "Farg'ona viloyati",
    name: "Farg'ona Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: "Farg'ona Viloyat Tibbiyot Markazi",
    address: "Farg'ona shahri, Al-Farg'oniy ko'chasi, 42-uy",
    phone: '+998 73 241 85 50',
    lat: 40.375,
    lng: 71.795,
  },

  // ── Namangan viloyati ──
  {
    id: 'hosp-nam-1',
    regionId: 'namangan',
    regionName: 'Namangan viloyati',
    name: "Namangan Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Namangan Viloyat Markaziy Shifoxonasi',
    address: "Namangan shahri, Bobur shoh ko'chasi, 14-uy",
    phone: '+998 69 226 05 30',
    lat: 40.998,
    lng: 71.672,
  },
  {
    id: 'hosp-nam-2',
    regionId: 'namangan',
    regionName: 'Namangan viloyati',
    name: 'Namangan Viloyat Kardiologiya Dispanseri',
    shortName: 'Namangan Kardiologiya Markazi',
    address: "Namangan shahri, To'raqo'rg'on ko'chasi, 8-uy",
    phone: '+998 69 234 11 22',
    lat: 41.006,
    lng: 71.658,
  },

  // ── Qashqadaryo viloyati ──
  {
    id: 'hosp-qash-1',
    regionId: 'kashkadarya',
    regionName: 'Qashqadaryo viloyati',
    name: "Qashqadaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Qarshi Viloyat Shifoxonasi',
    address: "Qarshi shahri, Nasaf ko'chasi, 12-uy",
    phone: '+998 75 221 04 40',
    lat: 38.861,
    lng: 65.789,
  },
  {
    id: 'hosp-qash-2',
    regionId: 'kashkadarya',
    regionName: 'Qashqadaryo viloyati',
    name: 'Qashqadaryo Viloyat Kardiologiya Markazi',
    shortName: 'Qarshi Kardiologiya Markazi',
    address: "Qarshi shahri, Mustaqillik shoh ko'chasi, 33-uy",
    phone: '+998 75 225 10 15',
    lat: 38.852,
    lng: 65.801,
  },

  // ── Surxondaryo viloyati ──
  {
    id: 'hosp-sur-1',
    regionId: 'surkhandarya',
    regionName: 'Surxondaryo viloyati',
    name: "Surxondaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Termiz Viloyat Markaziy Shifoxonasi',
    address: "Termiz shahri, At-Termiziy ko'chasi, 45-uy",
    phone: '+998 76 223 15 60',
    lat: 37.228,
    lng: 67.278,
  },
  {
    id: 'hosp-sur-2',
    regionId: 'surkhandarya',
    regionName: 'Surxondaryo viloyati',
    name: 'Termiz Shahar Tibbiyot Birlashmasi',
    shortName: 'Termiz Shahar Shifoxonasi',
    address: "Termiz shahri, Taraqqiyot ko'chasi, 7-uy",
    phone: '+998 76 227 40 22',
    lat: 37.235,
    lng: 67.289,
  },

  // ── Xorazm viloyati ──
  {
    id: 'hosp-xor-1',
    regionId: 'khorezm',
    regionName: 'Xorazm viloyati',
    name: "Xorazm Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Urganch Viloyat Shifoxonasi',
    address: "Urganch shahri, Al-Xorazmiy ko'chasi, 28-uy",
    phone: '+998 62 225 45 00',
    lat: 41.55,
    lng: 60.633,
  },
  {
    id: 'hosp-xor-2',
    regionId: 'khorezm',
    regionName: 'Xorazm viloyati',
    name: 'Xorazm Viloyat Kardiologiya Dispanseri',
    shortName: 'Urganch Kardiologiya Markazi',
    address: "Urganch shahri, Gurlan ko'chasi, 15-uy",
    phone: '+998 62 228 12 34',
    lat: 41.558,
    lng: 60.642,
  },

  // ── Navoiy viloyati ──
  {
    id: 'hosp-nav-1',
    regionId: 'navoiy',
    regionName: 'Navoiy viloyati',
    name: "Navoiy Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Navoiy Viloyat Shifoxonasi',
    address: "Navoiy shahri, G'alaba shoh ko'chasi, 7-uy",
    phone: '+998 79 224 03 50',
    lat: 40.084,
    lng: 65.379,
  },
  {
    id: 'hosp-nav-2',
    regionId: 'navoiy',
    regionName: 'Navoiy viloyati',
    name: 'Navoiy Shahar 1-son Shifoxonasi',
    shortName: 'Navoiy Shahar Shifoxonasi',
    address: "Navoiy shahri, Zarif ko'chasi, 19-uy",
    phone: '+998 79 223 88 10',
    lat: 40.092,
    lng: 65.365,
  },

  // ── Jizzax viloyati ──
  {
    id: 'hosp-jiz-1',
    regionId: 'jizzakh',
    regionName: 'Jizzax viloyati',
    name: "Jizzax Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Jizzax Viloyat Markaziy Shifoxonasi',
    address: "Jizzax shahri, Sh. Rashidov ko'chasi, 4-uy",
    phone: '+998 72 226 30 15',
    lat: 40.115,
    lng: 67.842,
  },
  {
    id: 'hosp-jiz-2',
    regionId: 'jizzakh',
    regionName: 'Jizzax viloyati',
    name: 'Jizzax Shahar Tibbiyot Birlashmasi',
    shortName: 'Jizzax Shahar Shifoxonasi',
    address: "Jizzax shahri, Sayiljoy ko'chasi, 2-uy",
    phone: '+998 72 222 14 00',
    lat: 40.123,
    lng: 67.855,
  },

  // ── Sirdaryo viloyati ──
  {
    id: 'hosp-sir-1',
    regionId: 'sirdaryo',
    regionName: 'Sirdaryo viloyati',
    name: "Sirdaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Guliston Viloyat Markaziy Shifoxonasi',
    address: "Guliston shahri, Birlashgan ko'chasi, 22-uy",
    phone: '+998 67 225 11 20',
    lat: 40.489,
    lng: 68.784,
  },
  {
    id: 'hosp-sir-2',
    regionId: 'sirdaryo',
    regionName: 'Sirdaryo viloyati',
    name: 'Guliston Shahar Tibbiyot Birlashmasi',
    shortName: 'Guliston Shahar Shifoxonasi',
    address: "Guliston shahri, Sayxun ko'chasi, 5-uy",
    phone: '+998 67 226 44 10',
    lat: 40.498,
    lng: 68.795,
  },

  // ── Qoraqalpog'iston Respublikasi ──
  {
    id: 'hosp-qor-1',
    regionId: 'karakalpakstan',
    regionName: "Qoraqalpog'iston Respublikasi",
    name: "Qoraqalpog'iston Respublika Ko'p Tarmoqli Tibbiyot Markazi",
    shortName: 'Nukus Respublika Tibbiyot Markazi',
    address: "Nukus shahri, Allayar Dosnazarov ko'chasi, 96-uy",
    phone: '+998 61 222 90 10',
    lat: 42.46,
    lng: 59.61,
  },
  {
    id: 'hosp-qor-2',
    regionId: 'karakalpakstan',
    regionName: "Qoraqalpog'iston Respublikasi",
    name: 'Nukus Shahar 1-son Shifoxonasi',
    shortName: 'Nukus Shahar Shifoxonasi',
    address: "Nukus shahri, Qaraqalpaqstan ko'chasi, 15-uy",
    phone: '+998 61 224 15 20',
    lat: 42.472,
    lng: 59.623,
  },
];

// Shifoxonalarni shifokorlar soni bilan birlashtirish
export function getAllHospitalsWithDetails() {
  const doctorCounts = {};
  if (UZBEKISTAN_MEDICAL_DATA?.regions) {
    UZBEKISTAN_MEDICAL_DATA.regions.forEach((r) => {
      r.hospitals?.forEach((h) => {
        doctorCounts[h.id] = (h.doctors || []).length;
      });
    });
  }

  return HOSPITALS_GEO.map((h) => ({
    ...h,
    doctorsCount: doctorCounts[h.id] || 4,
  }));
}

// Foydalanuvchi joylashuviga ko'ra tartiblangan shifoxonalar
export function getHospitalsSortedByDistance(userLat, userLng) {
  const all = getAllHospitalsWithDetails();
  if (userLat == null || userLng == null) {
    return all.map((h) => ({ ...h, distanceKm: null }));
  }

  return all
    .map((h) => {
      const distanceKm = calculateDistanceKm(userLat, userLng, h.lat, h.lng);
      return { ...h, distanceKm };
    })
    .sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
}

export default {
  HOSPITALS_GEO,
  calculateDistanceKm,
  getAllHospitalsWithDetails,
  getHospitalsSortedByDistance,
};
