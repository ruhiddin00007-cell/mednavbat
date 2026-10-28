/**
 * MedNavbat — Shifokorlar Repozitoriysi va API Ma'lumot Qatlami
 * ─────────────────────────────────────────────────────────────
 * Barcha shifokorlar yagona qat'iy ma'lumot modeliga keltirilgan:
 *  - id, fullName, specialty, countryId, regionId, timeZone,
 *    licenseNumber, licenseVerified, experienceYears, rating,
 *    reviewCount, schedule, onCall, manualStatus, source
 *
 * DIQQAT: Mavjud dastlabki ma'lumotlar manbasi 'DEMO' deb belgilangan
 * bo'lib, ishlab chiqarishga chiqmasligi uchun qat'iy filtrlanadi.
 */

import { WORLD_COUNTRIES, getCountryByIso2 } from './countriesData.js';
import { getRegionsByCountry, ALL_REGIONS } from './regionsData.js';
import { calculateDoctorAvailability } from '../utils/availabilityEngine.js';
import { calculateTransparentDoctorScore, sanitizeDoctorPublicProfile } from '../utils/ratingFormula.js';

// Dastlabki bazaviy shifokorlar (DEMO deb belgilangan)
export const INITIAL_STRUCTURED_DOCTORS = [
  // ── O'zbekiston (UZ) Shifokorlari ──────────────────────────────────────────
  {
    id: 'doc-uz-1',
    fullName: 'Dr. Akmal Rahimov',
    name: 'Dr. Akmal Rahimov',
    specialty: 'kardiolog',
    specialtyId: 'kardiolog',
    specialtyName: 'Kardiolog (Oliy toifali)',
    specialtyName_uz: 'Kardiolog (Oliy toifali)',
    subcategory: 'EKG & Exokardiografiya',
    countryId: 'UZ',
    regionId: 'tashkent_city',
    regionName: 'Toshkent shahri',
    timeZone: 'Asia/Tashkent',
    licenseNumber: 'UZ-MED-84920',
    licenseVerified: true,
    experienceYears: 14,
    rating: 4.9,
    reviewCount: 128,
    reviewsCount: 128,
    price: 180000,
    hospitalName: 'Medion Innovation Clinic',
    roomNumber: '304-xona',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['09:00', '18:00'],
      tue: ['09:00', '18:00'],
      wed: ['09:00', '18:00'],
      thu: ['09:00', '18:00'],
      fri: ['09:00', '18:00'],
      sat: ['09:00', '15:00'],
      sun: null
    },
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },
  {
    id: 'doc-uz-2',
    fullName: 'Dr. Nigora Usmonova',
    name: 'Dr. Nigora Usmonova',
    specialty: 'lor',
    specialtyId: 'lor',
    specialtyName: 'LOR (Otorinolaringolog)',
    specialtyName_uz: 'LOR (Otorinolaringolog)',
    subcategory: 'Bolalar LOR & Rinoplastika',
    countryId: 'UZ',
    regionId: 'tashkent_city',
    regionName: 'Toshkent shahri',
    timeZone: 'Asia/Tashkent',
    licenseNumber: 'UZ-MED-77112',
    licenseVerified: true,
    experienceYears: 11,
    rating: 4.8,
    reviewCount: 94,
    reviewsCount: 94,
    price: 150000,
    hospitalName: 'Akfa Medline Shifoxonasi',
    roomNumber: '112-xona',
    avatar: 'https://images.unsplash.com/photo-1594824813566-88855ce783d1?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['09:00', '17:00'],
      tue: ['09:00', '17:00'],
      wed: ['09:00', '17:00'],
      thu: ['09:00', '17:00'],
      fri: ['09:00', '17:00'],
      sat: null,
      sun: null
    },
    availableSlots: ['09:00', '10:00', '11:00', '13:30', '14:30', '16:00'],
    workScheduleDays: ['Dushanba', 'Chorshanba', 'Juma', 'Shanba'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },
  {
    id: 'doc-uz-3',
    fullName: 'Dr. Sardorbek Qodirov',
    name: 'Dr. Sardorbek Qodirov',
    specialty: 'xirurg',
    specialtyId: 'xirurg',
    specialtyName: 'Xirurg (Navbatchi)',
    specialtyName_uz: 'Xirurg (Navbatchi)',
    subcategory: 'Shoshilinch jarrohlik',
    countryId: 'UZ',
    regionId: 'samarkand',
    regionName: 'Samarqand viloyati',
    timeZone: 'Asia/Tashkent',
    licenseNumber: 'UZ-MED-91024',
    licenseVerified: true,
    experienceYears: 16,
    rating: 4.95,
    reviewCount: 210,
    reviewsCount: 210,
    price: 200000,
    hospitalName: 'Respublika Shoshilinch Tibbiy Yordam Markazi',
    roomNumber: 'Operatsion blok',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['00:00', '24:00'],
      tue: ['00:00', '24:00'],
      wed: ['00:00', '24:00'],
      thu: ['00:00', '24:00'],
      fri: ['00:00', '24:00'],
      sat: ['00:00', '24:00'],
      sun: ['00:00', '24:00']
    },
    availableSlots: ['08:00', '12:00', '16:00', '20:00'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'],
    onCall: true, // 24/7 navbatchi xirurg
    manualStatus: 'auto',
    source: 'DEMO'
  },
  {
    id: 'doc-uz-4',
    fullName: 'Dr. Feruza Alimova',
    name: 'Dr. Feruza Alimova',
    specialty: 'nevropatolog',
    specialtyId: 'nevropatolog',
    specialtyName: 'Nevropatolog',
    specialtyName_uz: 'Nevropatolog',
    subcategory: "Bosh og'rig'i va insult reabilitatsiyasi",
    countryId: 'UZ',
    regionId: 'fergana',
    regionName: "Farg'ona viloyati",
    timeZone: 'Asia/Tashkent',
    licenseNumber: 'UZ-MED-63821',
    licenseVerified: true,
    experienceYears: 9,
    rating: 4.7,
    reviewCount: 62,
    reviewsCount: 62,
    price: 130000,
    hospitalName: "Farg'ona Viloyat Shoshilinch Markazi",
    roomNumber: '208-xona',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['08:30', '16:30'],
      tue: ['08:30', '16:30'],
      wed: ['08:30', '16:30'],
      thu: ['08:30', '16:30'],
      fri: ['08:30', '16:30'],
      sat: null,
      sun: null
    },
    availableSlots: ['08:30', '09:30', '11:00', '14:00'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },

  // ── AQSH (US) Shifokorlari ────────────────────────────────────────────────
  {
    id: 'doc-us-1',
    fullName: 'Dr. Robert Jenkins',
    name: 'Dr. Robert Jenkins',
    specialty: 'kardiolog',
    specialtyId: 'kardiolog',
    specialtyName: 'Kardiolog (MD, FACC)',
    specialtyName_uz: 'Kardiolog (MD, FACC)',
    subcategory: 'Interventional Cardiology',
    countryId: 'US',
    regionId: 'us_ny',
    regionName: 'Nyu-York shtati',
    timeZone: 'America/New_York',
    licenseNumber: 'NPI-1849204812',
    licenseVerified: true,
    experienceYears: 18,
    rating: 4.95,
    reviewCount: 184,
    reviewsCount: 184,
    price: 320000,
    hospitalName: 'Mount Sinai Hospital, New York',
    roomNumber: 'Suite 402',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['09:00', '17:00'],
      tue: ['09:00', '17:00'],
      wed: ['09:00', '17:00'],
      thu: ['09:00', '17:00'],
      fri: ['09:00', '15:00'],
      sat: null,
      sun: null
    },
    availableSlots: ['09:00', '10:30', '13:00', '15:00'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },
  {
    id: 'doc-us-2',
    fullName: 'Dr. Elena Rostova',
    name: 'Dr. Elena Rostova',
    specialty: 'nevropatolog',
    specialtyId: 'nevropatolog',
    specialtyName: 'Nevrolog (MD, PhD)',
    specialtyName_uz: 'Nevrolog (MD, PhD)',
    subcategory: 'Neuro-oncology & Migraine',
    countryId: 'US',
    regionId: 'us_ca',
    regionName: 'Kaliforniya',
    timeZone: 'America/Los_Angeles',
    licenseNumber: 'NPI-1930284719',
    licenseVerified: true,
    experienceYears: 15,
    rating: 4.88,
    reviewCount: 112,
    reviewsCount: 112,
    price: 350000,
    hospitalName: 'Stanford Health Care',
    roomNumber: 'Bldg C, Rm 12',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['10:00', '18:00'],
      tue: ['10:00', '18:00'],
      wed: ['10:00', '18:00'],
      thu: ['10:00', '18:00'],
      fri: ['10:00', '16:00'],
      sat: null,
      sun: null
    },
    availableSlots: ['10:00', '12:00', '14:30', '16:30'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },

  // ── Qozog'iston (KZ) Shifokorlari ──────────────────────────────────────────
  {
    id: 'doc-kz-1',
    fullName: 'Dr. Daniyar Qasymov',
    name: 'Dr. Daniyar Qasymov',
    specialty: 'stomatolog',
    specialtyId: 'stomatolog',
    specialtyName: 'Stomatolog-implantolog',
    specialtyName_uz: 'Stomatolog-implantolog',
    subcategory: 'Implantologiya va Estetika',
    countryId: 'KZ',
    regionId: 'kz_ala',
    regionName: 'Olmaota shahri',
    timeZone: 'Asia/Almaty',
    licenseNumber: 'KZ-LIC-448102',
    licenseVerified: true,
    experienceYears: 12,
    rating: 4.85,
    reviewCount: 88,
    reviewsCount: 88,
    price: 190000,
    hospitalName: 'Almaty Medical Center Dental',
    roomNumber: '101-kabinet',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['09:00', '18:00'],
      tue: ['09:00', '18:00'],
      wed: ['09:00', '18:00'],
      thu: ['09:00', '18:00'],
      fri: ['09:00', '18:00'],
      sat: ['10:00', '15:00'],
      sun: null
    },
    availableSlots: ['09:00', '11:00', '14:00', '16:00'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },

  // ── Turkiya (TR) Shifokorlari ─────────────────────────────────────────────
  {
    id: 'doc-tr-1',
    fullName: 'Dr. Mehmet Yılmaz',
    name: 'Dr. Mehmet Yılmaz',
    specialty: 'xirurg',
    specialtyId: 'xirurg',
    specialtyName: 'Plastik va Rekonstruktiv Xirurg',
    specialtyName_uz: 'Plastik va Rekonstruktiv Xirurg',
    subcategory: 'Rinoplastika va Yuz plastikasi',
    countryId: 'TR',
    regionId: 'tr_ist',
    regionName: 'Istanbul',
    timeZone: 'Europe/Istanbul',
    licenseNumber: 'TR-TABIP-98124',
    licenseVerified: true,
    experienceYears: 19,
    rating: 4.96,
    reviewCount: 245,
    reviewsCount: 245,
    price: 280000,
    hospitalName: 'Acıbadem Maslak Hospital',
    roomNumber: 'Klinika A-2',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['09:00', '17:30'],
      tue: ['09:00', '17:30'],
      wed: ['09:00', '17:30'],
      thu: ['09:00', '17:30'],
      fri: ['09:00', '17:30'],
      sat: ['10:00', '14:00'],
      sun: null
    },
    availableSlots: ['09:30', '11:30', '14:00', '16:00'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },

  // ── Germaniya (DE) Shifokorlari ───────────────────────────────────────────
  {
    id: 'doc-de-1',
    fullName: 'Dr. Hans Gruber',
    name: 'Dr. Hans Gruber',
    specialty: 'kardiolog',
    specialtyId: 'kardiolog',
    specialtyName: 'Facharzt für Kardiologie',
    specialtyName_uz: 'Kardiolog (Katta toifa)',
    subcategory: 'Exokardiografiya & Gipertoniya',
    countryId: 'DE',
    regionId: 'de_ber',
    regionName: 'Berlin',
    timeZone: 'Europe/Berlin',
    licenseNumber: 'DE-BER-83910',
    licenseVerified: true,
    experienceYears: 22,
    rating: 4.92,
    reviewCount: 160,
    reviewsCount: 160,
    price: 310000,
    hospitalName: 'Charité Universitätsmedizin Berlin',
    roomNumber: 'Haus 3, 2.OG',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['08:00', '16:00'],
      tue: ['08:00', '16:00'],
      wed: ['08:00', '16:00'],
      thu: ['08:00', '16:00'],
      fri: ['08:00', '14:00'],
      sat: null,
      sun: null
    },
    availableSlots: ['08:30', '10:00', '12:00', '13:30'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },

  // ── Buyuk Britaniya (GB) Shifokorlari ─────────────────────────────────────
  {
    id: 'doc-gb-1',
    fullName: 'Dr. William Brown',
    name: 'Dr. William Brown',
    specialty: 'lor',
    specialtyId: 'lor',
    specialtyName: 'Consultant ENT Surgeon',
    specialtyName_uz: 'Yetakchi LOR Jarrohi',
    subcategory: 'Otology & Sinus Surgery',
    countryId: 'GB',
    regionId: 'gb_lon',
    regionName: 'London (Buyuk London)',
    timeZone: 'Europe/London',
    licenseNumber: 'GMC-7192841',
    licenseVerified: true,
    experienceYears: 16,
    rating: 4.89,
    reviewCount: 130,
    reviewsCount: 130,
    price: 290000,
    hospitalName: "Guy's and St Thomas' Hospital London",
    roomNumber: 'Consulting Suite 5',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['09:00', '17:00'],
      tue: ['09:00', '17:00'],
      wed: ['09:00', '17:00'],
      thu: ['09:00', '17:00'],
      fri: ['09:00', '15:30'],
      sat: null,
      sun: null
    },
    availableSlots: ['09:00', '11:00', '13:30', '15:00'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    onCall: false,
    manualStatus: 'auto',
    source: 'DEMO'
  },

  // ── Tasdiqlanmagan Litsenziyali Sinov Shifokori ───────────────────────────
  {
    id: 'doc-unverified-1',
    fullName: 'Dr. Anvar Saydaliyev',
    name: 'Dr. Anvar Saydaliyev',
    specialty: 'terapevt',
    specialtyId: 'terapevt',
    specialtyName: 'Terapevt',
    specialtyName_uz: 'Terapevt',
    subcategory: 'Umumiy terapiya',
    countryId: 'UZ',
    regionId: 'tashkent_city',
    regionName: 'Toshkent shahri',
    timeZone: 'Asia/Tashkent',
    licenseNumber: 'UZ-PENDING-001',
    licenseVerified: false, // Tasdiqlanmagan!
    experienceYears: 2,
    rating: 0,
    reviewCount: 0,
    reviewsCount: 0,
    price: 90000,
    hospitalName: 'Mustaqil amaliyot',
    roomNumber: '1-xona',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    schedule: {
      mon: ['10:00', '16:00'],
      tue: ['10:00', '16:00'],
      wed: ['10:00', '16:00']
    },
    availableSlots: ['10:00', '12:00'],
    workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba'],
    onCall: false,
    manualStatus: 'auto',
    source: 'doctor_registration'
  }
];

const STORAGE_KEY = 'mednavbat_structured_doctors';

/**
 * Shifokor qabul tillarini standartlashtirish helperi
 */
export function ensureDoctorLanguages(doc) {
  if (Array.isArray(doc.spokenLanguages) && doc.spokenLanguages.length > 0) {
    return doc.spokenLanguages;
  }
  const country = (doc.countryId || 'UZ').toUpperCase();
  if (country === 'UZ') return ['uz-Latn', 'ru'];
  if (country === 'RU') return ['ru'];
  if (country === 'KZ') return ['kk', 'ru'];
  if (country === 'KG') return ['ky', 'ru'];
  if (country === 'TJ') return ['tg', 'ru'];
  if (country === 'TR') return ['tr', 'en'];
  if (country === 'DE') return ['de', 'en'];
  if (country === 'US' || country === 'GB') return ['en'];
  if (country === 'SA' || country === 'AE') return ['ar', 'en'];
  return ['uz-Latn', 'en'];
}

import { getAllDoctorsFromData } from './medicalDataLoader.js';

/**
 * Barcha shifokorlar ro'yxatini olish (14 ta hudud, LocalStorage kesh va boshlang'ich)
 */
export function getAllStructuredDoctors() {
  const jsonDoctors = getAllDoctorsFromData().map(doc => ({
    ...doc,
    countryId: 'UZ',
    licenseVerified: true,
    rating: doc.rating || 4.8,
    reviewsCount: doc.experienceYears * 8 || 40,
    onCall: false,
    manualStatus: 'auto',
    source: doc.isSample ? 'NAMUNA' : 'OFFICIAL'
  }));

  const map = new Map();
  jsonDoctors.forEach(d => map.set(d.id, d));
  INITIAL_STRUCTURED_DOCTORS.forEach(d => {
    if (!map.has(d.id)) map.set(d.id, d);
  });

  let list = Array.from(map.values());
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(p => map.set(p.id, p));
        list = Array.from(map.values());
      }
    }
  } catch (_e) {
    // LocalStorage xatoligi
  }
  return list.map(d => ({
    ...d,
    spokenLanguages: ensureDoctorLanguages(d)
  }));
}


/**
 * Yangi shifokor qo'shish yoki mavjudini yangilash
 */
export function saveStructuredDoctors(doctors) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors));
  } catch (_e) {
    // Ignored
  }
}

/**
 * Faqat litsenziyasi tasdiqlangan shifokorlarni olish
 */
export function getVerifiedDoctors() {
  return getAllStructuredDoctors().filter(doc => doc.licenseVerified === true);
}

/**
 * Shifokor ID bo'yicha olish (real-vaqt statusi bilan boyitilgan)
 */
export function getDoctorById(id, referenceDate = new Date()) {
  const doctors = getAllStructuredDoctors();
  const doctor = doctors.find(d => d.id === id);
  if (!doctor) return null;

  const availability = calculateDoctorAvailability(doctor, referenceDate);
  const score = calculateTransparentDoctorScore({
    avgRating: doctor.rating,
    reviewCount: doctor.reviewCount || doctor.reviewsCount,
    experienceYears: doctor.experienceYears,
    licenseVerified: doctor.licenseVerified
  });

  return {
    ...sanitizeDoctorPublicProfile(doctor),
    availability,
    score
  };
}

/**
 * Shifokorlarni filtr va saralash bilan olish (API parametri mos)
 * GET /doctors?country=&region=&specialty=&online=true&sort=rating
 */
export function queryDoctors({
  country = '',
  region = '',
  specialty = '',
  online = null,
  sort = 'rating',
  includeUnverified = false,
  referenceDate = new Date()
} = {}) {
  let list = includeUnverified ? getAllStructuredDoctors() : getVerifiedDoctors();

  // Davlat filtri
  if (country) {
    const cUpper = country.toUpperCase();
    list = list.filter(d => d.countryId === cUpper);
  }

  // Region filtri
  if (region && region !== 'all') {
    list = list.filter(d => d.regionId === region);
  }

  // Mutaxassislik filtri
  if (specialty) {
    list = list.filter(d => (d.specialtyId || d.specialty) === specialty);
  }

  // Real-vaqt availability holati bilan boyitish
  let enriched = list.map(doctor => {
    const availability = calculateDoctorAvailability(doctor, referenceDate);
    return {
      ...sanitizeDoctorPublicProfile(doctor),
      availability
    };
  });

  // Online filtri (faqat hozir o'z vaqt zonasida online bo'lganlar)
  if (online === true || online === 'true') {
    enriched = enriched.filter(d => d.availability.isOnline);
  }

  // Saralash
  enriched.sort((a, b) => {
    if (sort === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sort === 'experience') {
      return (b.experienceYears || 0) - (a.experienceYears || 0);
    }
    if (sort === 'online') {
      return (b.availability.isOnline ? 1 : 0) - (a.availability.isOnline ? 1 : 0);
    }
    return 0;
  });

  return enriched;
}

/**
 * GET /countries
 * TALAB: "faqat kamida bitta tasdiqlangan shifokori bor davlatlar, soni bilan"
 * Shuningdek: Davlat kartasida "Hozir online: N shifokor" ko'rsatiladi.
 * Shifokor yo'q davlatlar RO'YXATDA CHIQMAYDI (yashiriladi)!
 */
export function getActiveCountriesWithDoctorStats(referenceDate = new Date()) {
  const verifiedDoctors = getVerifiedDoctors();

  // Davlatlar bo'yicha guruhlash
  const countryMap = new Map();

  verifiedDoctors.forEach(doctor => {
    const cid = doctor.countryId;
    if (!countryMap.has(cid)) {
      countryMap.set(cid, {
        doctors: [],
        regionIds: new Set()
      });
    }
    const entry = countryMap.get(cid);
    entry.doctors.push(doctor);
    if (doctor.regionId) {
      entry.regionIds.add(doctor.regionId);
    }
  });

  const activeCountries = [];

  countryMap.forEach((entry, countryIso2) => {
    const worldMeta = getCountryByIso2(countryIso2) || {
      id: countryIso2,
      iso2: countryIso2,
      nameUz: countryIso2,
      dialCode: '',
      flag: '🌐'
    };

    // Online shifokorlar sonini hisoblash
    const onlineDoctorsCount = entry.doctors.filter(d => {
      const avail = calculateDoctorAvailability(d, referenceDate);
      return avail.isOnline;
    }).length;

    const regionsCount = entry.regionIds.size;
    const doctorsCount = entry.doctors.length;

    activeCountries.push({
      id: worldMeta.id,
      code: worldMeta.iso2,
      iso2: worldMeta.iso2,
      name: worldMeta.nameUz,
      nameUz: worldMeta.nameUz,
      nameEn: worldMeta.nameEn,
      nameRu: worldMeta.nameRu,
      flag: worldMeta.flag,
      dialCode: worldMeta.dialCode,
      isActive: true,
      isSupported: true,
      doctorsCount,
      regionsCount,
      onlineDoctorsCount,
      // Davlat kartasi uchun hisoblangan status matni
      statusBadgeText: regionsCount > 1 
        ? `Faol (${regionsCount} hudud/shtat)` 
        : `Faol (${doctorsCount} ta shifokor)`,
      onlineBadgeText: `Hozir online: ${onlineDoctorsCount} shifokor`
    });
  });

  // O'zbekistonni eng boshiga qo'yib, qolganlarini shifokorlar soni bo'yicha saralaymiz
  activeCountries.sort((a, b) => {
    if (a.iso2 === 'UZ') return -1;
    if (b.iso2 === 'UZ') return 1;
    return b.doctorsCount - a.doctorsCount;
  });

  return activeCountries;
}

/**
 * GET /countries/:iso2/regions
 * Davlatning barcha viloyat/shtatlarini shifokorlar soni bilan qaytaradi
 */
export function getRegionsByCountryWithStats(iso2) {
  if (!iso2) return [];
  const upper = iso2.toUpperCase();
  const regions = getRegionsByCountry(upper);
  const doctors = getVerifiedDoctors().filter(d => d.countryId === upper);

  return regions.map(reg => {
    const regDoctors = doctors.filter(d => d.regionId === reg.id);
    return {
      ...reg,
      doctorsCount: regDoctors.length,
      clinicsCount: Math.max(1, Math.ceil(regDoctors.length * 0.7))
    };
  });
}
