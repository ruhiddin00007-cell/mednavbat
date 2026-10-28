/**
 * Yandex Maps Helper Utility for MedNavbat
 * ─────────────────────────────────────────────────────────────
 * Barcha shifoxona va klinikalarni Yandex Xaritalarda ochish,
 * foydalanuvchi turgan joydan klinikagacha marshrut (yo'l) ko'rsatish
 * va mobil ilova (deep link) integratsiyasi.
 *
 * Qoidalar:
 *  1. Koordinata (lat, lon) bo'lsa:
 *     - Web: https://yandex.com/maps/?rtext=~LAT,LON&rtt=auto
 *     - App: yandexmaps://maps.yandex.ru/?rtext=~LAT,LON&rtt=auto
 *  2. Koordinata yo'q bo'lsa:
 *     - Web: https://yandex.com/maps/?text=<klinika nomi + manzil>
 *     - App: yandexmaps://maps.yandex.ru/?text=<klinika nomi + manzil>
 *  3. Foydalanuvchi joylashuvini serverga yubormaymiz (faqat Yandex Xarita o'zi aniqlaydi).
 *  4. Koordinatasi yo'q klinikalarda lat: null, lon: null bo'ladi (to'qib chiqarilmaydi).
 */

// ── Barcha klinikalar reestri va ularning rasmiy koordinatalari ───────────────
export const CLINICS_REGISTRY = {
  // ── Toshkent shahri ──
  'medion-innovation-clinic': {
    id: 'medion-innovation-clinic',
    name: 'Medion Innovation Clinic',
    aliases: ['Medion Innovation Clinic', 'Клиника Medion Innovation'],
    address: "Shayxontohur tumani, Zulfiyaxonim ko'chasi, 18-uy, Toshkent",
    phone: '+998 78 140 00 10',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },
  'hosp-tash-1': {
    id: 'hosp-tash-1',
    name: 'Respublika Shoshilinch Tibbiy Yordam Ilmiy Markazi (RSHTYoIM)',
    aliases: [
      'Respublika Shoshilinch Tibbiy Yordam Ilmiy Markazi (RSHTYoIM)',
      'RSHTYoIM (16-gorbolnitsa)',
      'Respublika Shoshilinch Tibbiy Yordam Markazi',
    ],
    address: "Chilonzor tumani, Kichik halqa yo'li, 2-uy",
    phone: '+998 71 277 95 65',
    lat: 41.2825,
    lon: 69.2155,
    hasCoordinates: true,
  },
  'hosp-tash-2': {
    id: 'hosp-tash-2',
    name: 'Respublika Ixtisoslashtirilgan Kardiologiya Ilmiy-Amaliy Tibbiyot Markazi (RIKIATM)',
    aliases: [
      'Respublika Ixtisoslashtirilgan Kardiologiya Ilmiy-Amaliy Tibbiyot Markazi (RIKIATM)',
      'RIKIATM Kardiologiya Markazi',
    ],
    address: "Mirzo Ulug'bek tumani, Osiyo ko'chasi, 4-uy",
    phone: '+998 71 237 31 42',
    lat: 41.332,
    lon: 69.289,
    hasCoordinates: true,
  },
  'hosp-tash-3': {
    id: 'hosp-tash-3',
    name: 'Akfa Medline Shifoxonasi',
    aliases: [
      'Akfa Medline Shifoxonasi',
      'Akfa Medline Hospital',
      'Больница Akfa Medline',
      'Akfa Medline Ko\'p Tarmoqli Markaz',
    ],
    address: "Olmazor tumani, Kichik halqa yo'li, 5A-uy",
    phone: '+998 71 203 30 03',
    lat: 41.348,
    lon: 69.229,
    hasCoordinates: true,
  },
  'tashkent-markaziy-jarrohlik': {
    id: 'tashkent-markaziy-jarrohlik',
    name: 'Toshkent Markaziy Jarrohlik Markazi',
    aliases: [
      'Toshkent Markaziy Jarrohlik Markazi',
      'Ташкентский Центральный Хирургический Центр',
      'Tashkent Central Surgery Center',
    ],
    address: "Yunusobod tumani, Amir Temur shoh ko'chasi, Toshkent",
    phone: '+998 71 234 56 78',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },
  'stoma-elite-clinic': {
    id: 'stoma-elite-clinic',
    name: 'StomaElite Klinikasi',
    aliases: ['StomaElite Klinikasi', 'Клиника StomaElite', 'StomaElite Clinic'],
    address: "Mirobod tumani, Nukus ko'chasi, 42-uy, Toshkent",
    phone: '+998 71 256 78 90',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },

  // ── Toshkent viloyati ──
  'hosp-tashobl-1': {
    id: 'hosp-tashobl-1',
    name: "Toshkent Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: [
      "Toshkent Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
      "Toshkent Viloyat Ko'p Tarmoqli Shifoxonasi",
      'Ташкентская Областная Больница',
      'Tashkent Regional Multi-specialty Hospital',
    ],
    address: "Chirchiq shahri, Alisher Navoiy shoh ko'chasi, 18-uy",
    phone: '+998 70 715 12 30',
    lat: 41.468,
    lon: 69.582,
    hasCoordinates: true,
  },
  'hosp-tashobl-2': {
    id: 'hosp-tashobl-2',
    name: 'Angren Shahar Markaziy Shifoxonasi',
    aliases: ['Angren Shahar Markaziy Shifoxonasi', 'Angren Shahar Shifoxonasi'],
    address: "Angren shahri, Yangi hayot ko'chasi, 1-uy",
    phone: '+998 70 665 21 00',
    lat: 41.016,
    lon: 70.143,
    hasCoordinates: true,
  },
  'chirchiq-shoshilinch': {
    id: 'chirchiq-shoshilinch',
    name: 'Chirchiq Shahar Shoshilinch Tibbiy Markazi',
    aliases: ['Chirchiq Shahar Shoshilinch Tibbiy Markazi'],
    address: "Chirchiq shahri, Toshkent viloyati",
    phone: '+998 70 712 34 56',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },

  // ── Samarqand viloyati ──
  'hosp-sam-1': {
    id: 'hosp-sam-1',
    name: 'Samarqand Davlat Tibbiyot Universiteti 1-son Klinikasi',
    aliases: [
      'Samarqand Davlat Tibbiyot Universiteti 1-son Klinikasi',
      'Samarqand Davlat Tibbiyot Universiteti Klinikasi',
      'SamDTU 1-son Klinikasi',
      'Клиника Самаркандского Гос Медуниверситета',
    ],
    address: "Samarqand shahri, Amir Temur ko'chasi, 18-uy",
    phone: '+998 66 233 08 41',
    lat: 39.654,
    lon: 66.96,
    hasCoordinates: true,
  },
  'hosp-sam-2': {
    id: 'hosp-sam-2',
    name: "Samarqand Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Samarqand Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Samarqand Viloyat Tibbiyot Markazi'],
    address: "Samarqand shahri, Ishtixon ko'chasi, 1-uy",
    phone: '+998 66 235 15 54',
    lat: 39.668,
    lon: 66.942,
    hasCoordinates: true,
  },

  // ── Buxoro viloyati ──
  'hosp-bux-1': {
    id: 'hosp-bux-1',
    name: "Buxoro Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Buxoro Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Buxoro Viloyat Markaziy Shifoxonasi'],
    address: "Buxoro shahri, Navoiy shoh ko'chasi, 1-uy",
    phone: '+998 65 223 45 12',
    lat: 39.768,
    lon: 64.421,
    hasCoordinates: true,
  },
  'hosp-bux-2': {
    id: 'hosp-bux-2',
    name: 'Buxoro Viloyat Kardiologiya Dispanseri',
    aliases: [
      'Buxoro Viloyat Kardiologiya Dispanseri',
      'Buxoro Viloyat Kardiologiya Markazi',
      'Buxoro Kardiologiya Markazi',
    ],
    address: "Buxoro shahri, Ibn Sino ko'chasi, 14-uy",
    phone: '+998 65 221 10 03',
    lat: 39.776,
    lon: 64.435,
    hasCoordinates: true,
  },

  // ── Andijon viloyati ──
  'hosp-and-1': {
    id: 'hosp-and-1',
    name: 'Andijon Davlat Tibbiyot Instituti Klinikasi',
    aliases: ['Andijon Davlat Tibbiyot Instituti Klinikasi', 'ADTI Klinikasi'],
    address: "Andijon shahri, Yu. Otabekov ko'chasi, 1-uy",
    phone: '+998 74 223 35 10',
    lat: 40.782,
    lon: 72.344,
    hasCoordinates: true,
  },
  'hosp-and-2': {
    id: 'hosp-and-2',
    name: "Andijon Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Andijon Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Andijon Viloyat Shifoxonasi'],
    address: "Andijon shahri, Milliy Tiklanish ko'chasi, 12-uy",
    phone: '+998 74 225 18 20',
    lat: 40.791,
    lon: 72.358,
    hasCoordinates: true,
  },

  // ── Farg'ona viloyati ──
  'hosp-fer-1': {
    id: 'hosp-fer-1',
    name: "Farg'ona Viloyat Shoshilinch Tibbiy Yordam Markazi",
    aliases: ["Farg'ona Viloyat Shoshilinch Tibbiy Yordam Markazi", "Farg'ona Shoshilinch Markazi"],
    address: "Farg'ona shahri, Qomus ko'chasi, 18-uy",
    phone: '+998 73 244 03 03',
    lat: 40.384,
    lon: 71.784,
    hasCoordinates: true,
  },
  'hosp-fer-2': {
    id: 'hosp-fer-2',
    name: "Farg'ona Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Farg'ona Viloyat Ko'p Tarmoqli Tibbiyot Markazi", "Farg'ona Viloyat Tibbiyot Markazi"],
    address: "Farg'ona shahri, Al-Farg'oniy ko'chasi, 42-uy",
    phone: '+998 73 241 85 50',
    lat: 40.375,
    lon: 71.795,
    hasCoordinates: true,
  },

  // ── Namangan viloyati ──
  'hosp-nam-1': {
    id: 'hosp-nam-1',
    name: "Namangan Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Namangan Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Namangan Viloyat Markaziy Shifoxonasi'],
    address: "Namangan shahri, Amir Temur ko'chasi, 25-uy",
    phone: '+998 69 227 14 02',
    lat: 40.998,
    lon: 71.672,
    hasCoordinates: true,
  },
  'hosp-nam-2': {
    id: 'hosp-nam-2',
    name: 'Namangan Viloyat Kardiologiya Dispanseri',
    aliases: ['Namangan Viloyat Kardiologiya Dispanseri', 'Namangan Kardiologiya Markazi'],
    address: "Namangan shahri, Bobur shoh ko'chasi, 8-uy",
    phone: '+998 69 226 30 11',
    lat: 41.006,
    lon: 71.658,
    hasCoordinates: true,
  },

  // ── Qashqadaryo viloyati ──
  'hosp-qash-1': {
    id: 'hosp-qash-1',
    name: "Qashqadaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Qashqadaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Qarshi Viloyat Shifoxonasi'],
    address: "Qarshi shahri, Mustaqillik shoh ko'chasi, 10-uy",
    phone: '+998 75 221 05 32',
    lat: 38.861,
    lon: 65.789,
    hasCoordinates: true,
  },
  'hosp-qash-2': {
    id: 'hosp-qash-2',
    name: 'Qashqadaryo Viloyat Kardiologiya Markazi',
    aliases: ['Qashqadaryo Viloyat Kardiologiya Markazi'],
    address: "Qarshi shahri, Nasaf ko'chasi, 45-uy",
    phone: '+998 75 223 18 40',
    lat: 38.852,
    lon: 65.801,
    hasCoordinates: true,
  },
  'qashqadaryo-bolalar': {
    id: 'qashqadaryo-bolalar',
    name: "Qashqadaryo Viloyat Bolalar Ko'p Tarmoqli Shifoxonasi",
    aliases: ["Qashqadaryo Viloyat Bolalar Ko'p Tarmoqli Shifoxonasi"],
    address: "Qarshi shahri, Qashqadaryo viloyati",
    phone: '+998 75 224 10 20',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },

  // ── Surxondaryo viloyati ──
  'hosp-sur-1': {
    id: 'hosp-sur-1',
    name: "Surxondaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Surxondaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Termiz Viloyat Markaziy Shifoxonasi'],
    address: "Termiz shahri, Al-Hakim at-Termiziy ko'chasi, 32-uy",
    phone: '+998 76 223 40 15',
    lat: 37.228,
    lon: 67.278,
    hasCoordinates: true,
  },
  'hosp-sur-2': {
    id: 'hosp-sur-2',
    name: 'Termiz Shahar Tibbiyot Birlashmasi',
    aliases: ['Termiz Shahar Tibbiyot Birlashmasi', 'Termiz Shahar Shifoxonasi'],
    address: "Termiz shahri, Barkamol Avlod ko'chasi, 5-uy",
    phone: '+998 76 225 12 30',
    lat: 37.235,
    lon: 67.289,
    hasCoordinates: true,
  },
  'surxondaryo-shoshilinch': {
    id: 'surxondaryo-shoshilinch',
    name: 'Surxondaryo Viloyat Shoshilinch Tibbiyot Markazi',
    aliases: ['Surxondaryo Viloyat Shoshilinch Tibbiyot Markazi'],
    address: "Termiz shahri, Surxondaryo viloyati",
    phone: '+998 76 227 45 12',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },

  // ── Xorazm viloyati ──
  'hosp-xor-1': {
    id: 'hosp-xor-1',
    name: "Xorazm Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Xorazm Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Urganch Viloyat Shifoxonasi'],
    address: "Urganch shahri, Al-Xorazmiy shoh ko'chasi, 28-uy",
    phone: '+998 62 225 60 11',
    lat: 41.55,
    lon: 60.633,
    hasCoordinates: true,
  },
  'hosp-xor-2': {
    id: 'hosp-xor-2',
    name: 'Xorazm Viloyat Kardiologiya Dispanseri',
    aliases: ['Xorazm Viloyat Kardiologiya Dispanseri', 'Xorazm Kardiologiya Markazi'],
    address: "Urganch shahri, P. Mahmud ko'chasi, 19-uy",
    phone: '+998 62 228 14 05',
    lat: 41.558,
    lon: 60.642,
    hasCoordinates: true,
  },
  'xorazm-diagnostika': {
    id: 'xorazm-diagnostika',
    name: 'Xorazm Viloyat Diagnostika Markazi',
    aliases: ['Xorazm Viloyat Diagnostika Markazi'],
    address: "Urganch shahri, Xorazm viloyati",
    phone: '+998 62 226 78 90',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },

  // ── Navoiy viloyati ──
  'hosp-nav-1': {
    id: 'hosp-nav-1',
    name: "Navoiy Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Navoiy Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Navoiy Viloyat Markaziy Shifoxonasi'],
    address: "Navoiy shahri, G'alaba shoh ko'chasi, 7-uy",
    phone: '+998 79 223 10 45',
    lat: 40.084,
    lon: 65.379,
    hasCoordinates: true,
  },
  'hosp-nav-2': {
    id: 'hosp-nav-2',
    name: 'Navoiy Shahar 1-son Shifoxonasi',
    aliases: ['Navoiy Shahar 1-son Shifoxonasi'],
    address: "Navoiy shahri, Ibn Sino ko'chasi, 11-uy",
    phone: '+998 79 224 80 12',
    lat: 40.092,
    lon: 65.365,
    hasCoordinates: true,
  },

  // ── Jizzax viloyati ──
  'hosp-jiz-1': {
    id: 'hosp-jiz-1',
    name: "Jizzax Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Jizzax Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Jizzax Viloyat Markaziy Shifoxonasi'],
    address: "Jizzax shahri, Sh. Rashidov shoh ko'chasi, 14-uy",
    phone: '+998 72 226 15 20',
    lat: 40.115,
    lon: 67.842,
    hasCoordinates: true,
  },
  'hosp-jiz-2': {
    id: 'hosp-jiz-2',
    name: 'Jizzax Shahar Tibbiyot Birlashmasi',
    aliases: ['Jizzax Shahar Tibbiyot Birlashmasi', 'Jizzax Shahar Shifoxonasi'],
    address: "Jizzax shahri, Sayiljoy ko'chasi, 22-uy",
    phone: '+998 72 222 30 14',
    lat: 40.123,
    lon: 67.855,
    hasCoordinates: true,
  },
  'jizzax-tibbiyot-markazi': {
    id: 'jizzax-tibbiyot-markazi',
    name: 'Jizzax Viloyat Tibbiyot Markazi',
    aliases: ['Jizzax Viloyat Tibbiyot Markazi'],
    address: "Jizzax shahri, Jizzax viloyati",
    phone: '+998 72 224 50 60',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },

  // ── Sirdaryo viloyati ──
  'hosp-sir-1': {
    id: 'hosp-sir-1',
    name: "Sirdaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: ["Sirdaryo Viloyat Ko'p Tarmoqli Tibbiyot Markazi", 'Guliston Markaziy Shifoxonasi'],
    address: "Guliston shahri, O'zbekiston shoh ko'chasi, 65-uy",
    phone: '+998 67 225 34 10',
    lat: 40.489,
    lon: 68.784,
    hasCoordinates: true,
  },
  'hosp-sir-2': {
    id: 'hosp-sir-2',
    name: 'Guliston Shahar Tibbiyot Birlashmasi',
    aliases: ['Guliston Shahar Tibbiyot Birlashmasi', 'Guliston Shahar Shifoxonasi'],
    address: "Guliston shahri, Sayxun ko'chasi, 8-uy",
    phone: '+998 67 226 12 04',
    lat: 40.498,
    lon: 68.795,
    hasCoordinates: true,
  },
  'sirdaryo-tibbiyot-birlashmasi': {
    id: 'sirdaryo-tibbiyot-birlashmasi',
    name: 'Sirdaryo Viloyat Tibbiyot Birlashmasi',
    aliases: ['Sirdaryo Viloyat Tibbiyot Birlashmasi'],
    address: "Guliston shahri, Sirdaryo viloyati",
    phone: '+998 67 227 80 90',
    lat: null,
    lon: null,
    hasCoordinates: false,
  },

  // ── Qoraqalpog'iston Respublikasi ──
  'hosp-qor-1': {
    id: 'hosp-qor-1',
    name: "Qoraqalpog'iston Respublika Ko'p Tarmoqli Tibbiyot Markazi",
    aliases: [
      "Qoraqalpog'iston Respublika Ko'p Tarmoqli Tibbiyot Markazi",
      'Nukus Respublika Tibbiyot Markazi',
    ],
    address: "Nukus shahri, Allayar Dosnazarov ko'chasi, 96-uy",
    phone: '+998 61 222 90 10',
    lat: 42.46,
    lon: 59.61,
    hasCoordinates: true,
  },
  'hosp-qor-2': {
    id: 'hosp-qor-2',
    name: 'Nukus Shahar 1-son Shifoxonasi',
    aliases: ['Nukus Shahar 1-son Shifoxonasi', 'Nukus Shahar Shifoxonasi'],
    address: "Nukus shahri, Qaraqalpaqstan ko'chasi, 15-uy",
    phone: '+998 61 224 15 20',
    lat: 42.472,
    lon: 59.623,
    hasCoordinates: true,
  },
};

/**
 * Shifoxona obyektini yoki nomini aniqlash (resolve)
 */
export function resolveClinicLocation(input) {
  if (!input) {
    return {
      name: 'Tibbiyot Markazi',
      address: "O'zbekiston",
      lat: null,
      lon: null,
      hasCoordinates: false,
    };
  }

  // 1. Agar input allaqachon to'liq obyekt bo'lsa
  let name = '';
  let address = '';
  let lat = null;
  let lon = null;

  if (typeof input === 'string') {
    name = input.trim();
  } else if (typeof input === 'object') {
    name =
      input.hospitalName ||
      input.hospitalName_uz ||
      input.name ||
      input.hospital ||
      '';
    address = input.address || input.hospitalAddress || '';
    lat = input.lat ?? input.hospitalLat ?? input.latitude ?? null;
    lon = input.lon ?? input.lng ?? input.hospitalLon ?? input.hospitalLng ?? input.longitude ?? null;
  }

  // 2. Agar koordinata berilmagan bo'lsa, CLINICS_REGISTRY orqali tekshiramiz
  if (lat == null || lon == null) {
    const cleanName = (name || '').toLowerCase().trim();
    const idKey = (typeof input === 'object' && input.id) ? input.id : null;

    let matched = null;
    if (idKey && CLINICS_REGISTRY[idKey]) {
      matched = CLINICS_REGISTRY[idKey];
    } else {
      matched = Object.values(CLINICS_REGISTRY).find((c) => {
        if (c.name.toLowerCase() === cleanName) return true;
        return c.aliases?.some((a) => {
          const aLower = a.toLowerCase();
          return aLower === cleanName || cleanName.includes(aLower) || aLower.includes(cleanName);
        });
      });
    }

    if (matched) {
      if (!name) name = matched.name;
      if (!address) address = matched.address;
      if (lat == null) lat = matched.lat;
      if (lon == null) lon = matched.lon;
    }
  }

  // Koordinatalar son ekanini tekshiramiz
  const validLat = typeof lat === 'number' && !Number.isNaN(lat) ? lat : null;
  const validLon = typeof lon === 'number' && !Number.isNaN(lon) ? lon : null;
  const hasCoordinates = validLat !== null && validLon !== null;

  return {
    name: name || 'Tibbiyot Markazi',
    address: address || "O'zbekiston",
    lat: validLat,
    lon: validLon,
    hasCoordinates,
  };
}

/**
 * Yandex Maps to'g'ridan-to'g'ri havolasini generatsiya qilish
 *  - Koordinata (lat, lon) bo'lsa: https://yandex.com/maps/?rtext=~LAT,LON&rtt=auto
 *  - Koordinata yo'q bo'lsa: https://yandex.com/maps/?text=<nom + manzil> (encodeURIComponent bilan)
 *  - Oddiy https havolasi ishlatiladi: telefonda ilova bo'lsa avtomatik ochadi,
 *    ilova bo'lmasa xatosiz veb-xaritada ochadi.
 */
export function getYandexMapUrl(input) {
  const loc = resolveClinicLocation(input);

  if (loc.hasCoordinates) {
    return `https://yandex.com/maps/?rtext=~${loc.lat},${loc.lon}&rtt=auto`;
  }

  const query = loc.address && !loc.name.includes(loc.address)
    ? `${loc.name} ${loc.address}`
    : loc.name;

  return `https://yandex.com/maps/?text=${encodeURIComponent(query)}`;
}

/**
 * Yandex Maps URL larini generatsiya qilish
 */
export function getYandexMapsUrls(input) {
  const url = getYandexMapUrl(input);
  const loc = resolveClinicLocation(input);

  return {
    webUrl: url,
    url: url,
    appUrl: url,
    hasCoordinates: loc.hasCoordinates,
    location: loc,
  };
}

/**
 * Mobil qurilma ekanini aniqlash
 */
export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
}

/**
 * Yandex Xaritani ochish yordamchisi (agar bevosita JS orqali ochish kerak bo'lsa)
 *  - window.open ishlatilmaydi (telefon brauzeri popup'ni bloklamasligi uchun)
 *  - Oddiy <a href target="_blank"> bosilishi kabi ishlaydi
 */
export function openYandexMaps(input, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  const url = getYandexMapUrl(input);

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Koordinatasi bor va yo'q klinikalarning to'liq hisoboti
 */
export function getClinicsCoordinatesStatus() {
  const list = Object.values(CLINICS_REGISTRY);
  const withCoords = list.filter((c) => c.hasCoordinates);
  const withoutCoords = list.filter((c) => !c.hasCoordinates);

  return {
    total: list.length,
    withCoordsCount: withCoords.length,
    withoutCoordsCount: withoutCoords.length,
    withCoords,
    withoutCoords,
  };
}

export default {
  CLINICS_REGISTRY,
  resolveClinicLocation,
  getYandexMapUrl,
  getYandexMapsUrls,
  openYandexMaps,
  isMobileDevice,
  getClinicsCoordinatesStatus,
};
