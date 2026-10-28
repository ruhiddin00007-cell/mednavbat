/**
 * MedNavbat Global Site Configuration
 * Platforma bo'yicha yagona aloqa va sozlamalar fayli.
 */

export const SITE_CONFIG = {
  name: 'MedNavbat',
  domain: 'mednavbat.uz',
  url: 'https://mednavbat.uz/',

  // ── MOBIL ILOVA DO'KON HAVOLALARI ─────────────────────────────────────────
  // Ilova Google Play yoki App Store'ga chiqqach, quyidagi ikki qatorni to'ldiring.
  // Havola bo'sh ('') bo'lganda — PWA o'rnatish oynasi chiqadi.
  // Havola to'ldirilganda — tegishli do'kon sahifasi yangi oynada ochiladi.
  GOOGLE_PLAY_URL: '',  // Masalan: 'https://play.google.com/store/apps/details?id=uz.mednavbat'
  APP_STORE_URL:   '',  // Masalan: 'https://apps.apple.com/uz/app/mednavbat/id1234567890'

  // Call-Center va Aloqa telefon raqamlari
  contact: {
    phone: {
      raw: '+998951411007',           // Tel href: tel:+998951411007
      digits: '951411007',            // Faqat raqamlar
      display: '+998 (95) 141-10-07',  // Vizual matn ko'rinishi
      schema: '+998-95-141-10-07',    // Schema.org telephone formati
      telHref: 'tel:+998951411007',   // HTML href formati
    },
    emergency: {
      display: '103',
      telHref: 'tel:103',
    },
    address: "Toshkent sh., Yunusobod t., Amir Temur shoh ko'chasi 108-uy",
    email: 'support@mednavbat.uz',
  },
};

export default SITE_CONFIG;
