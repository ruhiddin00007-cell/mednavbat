/**
 * MedNavbat — ISO 3166-1 Standartiga asoslangan Dunyo Davlatlari Registri
 * ──────────────────────────────────────────────────────────────────────
 * Har bir davlat uchun:
 *  - id / iso2: ISO 3166-1 alpha-2 kodi (masalan: "UZ", "KZ", "US", "TR", ...)
 *  - nameUz: O'zbek tilidagi rasmiy nomi
 *  - nameEn, nameRu: Xalqaro va ruscha nomlari
 *  - dialCode: Xalqaro telefon prefiksi (masalan: "+998", "+1", "+7", ...)
 *  - flag: Bayroq emoji belgisi
 *  - defaultTimeZone: Birlamchi IANA vaqt zonasi
 */

export const WORLD_COUNTRIES = [
  // Markaziy Osiyo & Hamdo'stlik
  { id: 'UZ', iso2: 'UZ', nameUz: "O'zbekiston", nameRu: "Узбекистан", nameEn: "Uzbekistan", dialCode: '+998', flag: '🇺🇿', defaultTimeZone: 'Asia/Tashkent' },
  { id: 'KZ', iso2: 'KZ', nameUz: "Qozog'iston", nameRu: "Казахстан", nameEn: "Kazakhstan", dialCode: '+7', flag: '🇰🇿', defaultTimeZone: 'Asia/Almaty' },
  { id: 'KG', iso2: 'KG', nameUz: "Qirg'iziston", nameRu: "Кыргызстан", nameEn: "Kyrgyzstan", dialCode: '+996', flag: '🇰🇬', defaultTimeZone: 'Asia/Bishkek' },
  { id: 'TJ', iso2: 'TJ', nameUz: "Tojikiston", nameRu: "Таджикистан", nameEn: "Tajikistan", dialCode: '+992', flag: '🇹🇯', defaultTimeZone: 'Asia/Dushanbe' },
  { id: 'TM', iso2: 'TM', nameUz: "Turkmaniston", nameRu: "Туркменистан", nameEn: "Turkmenistan", dialCode: '+993', flag: '🇹🇲', defaultTimeZone: 'Asia/Ashgabat' },
  { id: 'AZ', iso2: 'AZ', nameUz: "Ozarbayjon", nameRu: "Азербайджан", nameEn: "Azerbaijan", dialCode: '+994', flag: '🇦🇿', defaultTimeZone: 'Asia/Baku' },
  { id: 'RU', iso2: 'RU', nameUz: "Rossiya", nameRu: "Россия", nameEn: "Russia", dialCode: '+7', flag: '🇷🇺', defaultTimeZone: 'Europe/Moscow' },
  { id: 'BY', iso2: 'BY', nameUz: "Belarus", nameRu: "Беларусь", nameEn: "Belarus", dialCode: '+375', flag: '🇧🇾', defaultTimeZone: 'Europe/Minsk' },
  { id: 'AM', iso2: 'AM', nameUz: "Armaniston", nameRu: "Армения", nameEn: "Armenia", dialCode: '+374', flag: '🇦🇲', defaultTimeZone: 'Asia/Yerevan' },
  { id: 'GE', iso2: 'GE', nameUz: "Gruziya", nameRu: "Грузия", nameEn: "Georgia", dialCode: '+995', flag: '🇬🇪', defaultTimeZone: 'Asia/Tbilisi' },

  // Yaqin Sharq & Janubiy Osiyo
  { id: 'TR', iso2: 'TR', nameUz: "Turkiya", nameRu: "Турция", nameEn: "Turkey", dialCode: '+90', flag: '🇹🇷', defaultTimeZone: 'Europe/Istanbul' },
  { id: 'AE', iso2: 'AE', nameUz: "Birlashgan Arab Amirliklari", nameRu: "ОАЭ", nameEn: "United Arab Emirates", dialCode: '+971', flag: '🇦🇪', defaultTimeZone: 'Asia/Dubai' },
  { id: 'SA', iso2: 'SA', nameUz: "Saudiya Arabistoni", nameRu: "Саудовская Аравия", nameEn: "Saudi Arabia", dialCode: '+966', flag: '🇸🇦', defaultTimeZone: 'Asia/Riyadh' },
  { id: 'QA', iso2: 'QA', nameUz: "Qatar", nameRu: "Катар", nameEn: "Qatar", dialCode: '+974', flag: '🇶🇦', defaultTimeZone: 'Asia/Qatar' },
  { id: 'IN', iso2: 'IN', nameUz: "Hindiston", nameRu: "Индия", nameEn: "India", dialCode: '+91', flag: '🇮🇳', defaultTimeZone: 'Asia/Kolkata' },
  { id: 'PK', iso2: 'PK', nameUz: "Pokiston", nameRu: "Пакистан", nameEn: "Pakistan", dialCode: '+92', flag: '🇵🇰', defaultTimeZone: 'Asia/Karachi' },
  { id: 'IL', iso2: 'IL', nameUz: "Isroil", nameRu: "Израиль", nameEn: "Israel", dialCode: '+972', flag: '🇮🇱', defaultTimeZone: 'Asia/Jerusalem' },
  { id: 'EG', iso2: 'EG', nameUz: "Misr", nameRu: "Египет", nameEn: "Egypt", dialCode: '+20', flag: '🇪🇬', defaultTimeZone: 'Africa/Cairo' },
  { id: 'IR', iso2: 'IR', nameUz: "Eron", nameRu: "Иран", nameEn: "Iran", dialCode: '+98', flag: '🇮🇷', defaultTimeZone: 'Asia/Tehran' },
  { id: 'KW', iso2: 'KW', nameUz: "Quvayt", nameRu: "Кувейт", nameEn: "Kuwait", dialCode: '+965', flag: '🇰🇼', defaultTimeZone: 'Asia/Kuwait' },

  // Yevropa
  { id: 'DE', iso2: 'DE', nameUz: "Germaniya", nameRu: "Германия", nameEn: "Germany", dialCode: '+49', flag: '🇩🇪', defaultTimeZone: 'Europe/Berlin' },
  { id: 'GB', iso2: 'GB', nameUz: "Buyuk Britaniya", nameRu: "Великобритания", nameEn: "United Kingdom", dialCode: '+44', flag: '🇬🇧', defaultTimeZone: 'Europe/London' },
  { id: 'FR', iso2: 'FR', nameUz: "Fransiya", nameRu: "Франция", nameEn: "France", dialCode: '+33', flag: '🇫🇷', defaultTimeZone: 'Europe/Paris' },
  { id: 'IT', iso2: 'IT', nameUz: "Italiya", nameRu: "Италия", nameEn: "Italy", dialCode: '+39', flag: '🇮🇹', defaultTimeZone: 'Europe/Rome' },
  { id: 'ES', iso2: 'ES', nameUz: "Ispaniya", nameRu: "Испания", nameEn: "Spain", dialCode: '+34', flag: '🇪🇸', defaultTimeZone: 'Europe/Madrid' },
  { id: 'CH', iso2: 'CH', nameUz: "Shveysariya", nameRu: "Швейцария", nameEn: "Switzerland", dialCode: '+41', flag: '🇨🇭', defaultTimeZone: 'Europe/Zurich' },
  { id: 'AT', iso2: 'AT', nameUz: "Avstriya", nameRu: "Австрия", nameEn: "Austria", dialCode: '+43', flag: '🇦🇹', defaultTimeZone: 'Europe/Vienna' },
  { id: 'NL', iso2: 'NL', nameUz: "Niderlandiya", nameRu: "Нидерланды", nameEn: "Netherlands", dialCode: '+31', flag: '🇳🇱', defaultTimeZone: 'Europe/Amsterdam' },
  { id: 'PL', iso2: 'PL', nameUz: "Polsha", nameRu: "Польша", nameEn: "Poland", dialCode: '+48', flag: '🇵🇱', defaultTimeZone: 'Europe/Warsaw' },
  { id: 'SE', iso2: 'SE', nameUz: "Shvetsiya", nameRu: "Швеция", nameEn: "Sweden", dialCode: '+46', flag: '🇸🇪', defaultTimeZone: 'Europe/Stockholm' },
  { id: 'NO', iso2: 'NO', nameUz: "Norvegiya", nameRu: "Норвегия", nameEn: "Norway", dialCode: '+47', flag: '🇳🇴', defaultTimeZone: 'Europe/Oslo' },
  { id: 'BE', iso2: 'BE', nameUz: "Belgiya", nameRu: "Бельгия", nameEn: "Belgium", dialCode: '+32', flag: '🇧🇪', defaultTimeZone: 'Europe/Brussels' },
  { id: 'CZ', iso2: 'CZ', nameUz: "Chexiya", nameRu: "Чехия", nameEn: "Czech Republic", dialCode: '+420', flag: '🇨🇿', defaultTimeZone: 'Europe/Prague' },
  { id: 'UA', iso2: 'UA', nameUz: "Ukraina", nameRu: "Украина", nameEn: "Ukraine", dialCode: '+380', flag: '🇺🇦', defaultTimeZone: 'Europe/Kyiv' },
  { id: 'FI', iso2: 'FI', nameUz: "Finlandiya", nameRu: "Финляндия", nameEn: "Finland", dialCode: '+358', flag: '🇫🇮', defaultTimeZone: 'Europe/Helsinki' },
  { id: 'DK', iso2: 'DK', nameUz: "Daniya", nameRu: "Дания", nameEn: "Denmark", dialCode: '+45', flag: '🇩🇰', defaultTimeZone: 'Europe/Copenhagen' },
  { id: 'PT', iso2: 'PT', nameUz: "Portugaliya", nameRu: "Португалия", nameEn: "Portugal", dialCode: '+351', flag: '🇵🇹', defaultTimeZone: 'Europe/Lisbon' },
  { id: 'GR', iso2: 'GR', nameUz: "Gretsiya", nameRu: "Греция", nameEn: "Greece", dialCode: '+30', flag: '🇬🇷', defaultTimeZone: 'Europe/Athens' },
  { id: 'HU', iso2: 'HU', nameUz: "Vengriya", nameRu: "Венгрия", nameEn: "Hungary", dialCode: '+36', flag: '🇭🇺', defaultTimeZone: 'Europe/Budapest' },
  { id: 'RO', iso2: 'RO', nameUz: "Ruminiya", nameRu: "Румыния", nameEn: "Romania", dialCode: '+40', flag: '🇷🇴', defaultTimeZone: 'Europe/Bucharest' },

  // Amerika & Okeaniya
  { id: 'US', iso2: 'US', nameUz: "AQSH (Amerika Qo'shma Shtatlari)", nameRu: "США", nameEn: "United States", dialCode: '+1', flag: '🇺🇸', defaultTimeZone: 'America/New_York' },
  { id: 'CA', iso2: 'CA', nameUz: "Kanada", nameRu: "Канада", nameEn: "Canada", dialCode: '+1', flag: '🇨🇦', defaultTimeZone: 'America/Toronto' },
  { id: 'BR', iso2: 'BR', nameUz: "Braziliya", nameRu: "Бразилия", nameEn: "Brazil", dialCode: '+55', flag: '🇧🇷', defaultTimeZone: 'America/Sao_Paulo' },
  { id: 'MX', iso2: 'MX', nameUz: "Meksika", nameRu: "Мексика", nameEn: "Mexico", dialCode: '+52', flag: '🇲🇽', defaultTimeZone: 'America/Mexico_City' },
  { id: 'AU', iso2: 'AU', nameUz: "Avstraliya", nameRu: "Австралия", nameEn: "Australia", dialCode: '+61', flag: '🇦🇺', defaultTimeZone: 'Australia/Sydney' },
  { id: 'NZ', iso2: 'NZ', nameUz: "Yangi Zelandiya", nameRu: "Новая Зеландия", nameEn: "New Zealand", dialCode: '+64', flag: '🇳🇿', defaultTimeZone: 'Pacific/Auckland' },
  { id: 'AR', iso2: 'AR', nameUz: "Argentina", nameRu: "Аргентина", nameEn: "Argentina", dialCode: '+54', flag: '🇦🇷', defaultTimeZone: 'America/Argentina/Buenos_Aires' },

  // Sharqiy Osiyo & Tinch Okeani
  { id: 'KR', iso2: 'KR', nameUz: "Janubiy Koreya", nameRu: "Южная Корея", nameEn: "South Korea", dialCode: '+82', flag: '🇰🇷', defaultTimeZone: 'Asia/Seoul' },
  { id: 'JP', iso2: 'JP', nameUz: "Yaponiya", nameRu: "Япония", nameEn: "Japan", dialCode: '+81', flag: '🇯🇵', defaultTimeZone: 'Asia/Tokyo' },
  { id: 'CN', iso2: 'CN', nameUz: "Xitoy", nameRu: "Китай", nameEn: "China", dialCode: '+86', flag: '🇨🇳', defaultTimeZone: 'Asia/Shanghai' },
  { id: 'SG', iso2: 'SG', nameUz: "Singapur", nameRu: "Сингапур", nameEn: "Singapore", dialCode: '+65', flag: '🇸🇬', defaultTimeZone: 'Asia/Singapore' },
  { id: 'MY', iso2: 'MY', nameUz: "Malayziya", nameRu: "Малайзия", nameEn: "Malaysia", dialCode: '+60', flag: '🇲🇾', defaultTimeZone: 'Asia/Kuala_Lumpur' },
  { id: 'TH', iso2: 'TH', nameUz: "Tailand", nameRu: "Таиланд", nameEn: "Thailand", dialCode: '+66', flag: '🇹🇭', defaultTimeZone: 'Asia/Bangkok' },
  { id: 'ID', iso2: 'ID', nameUz: "Indoneziya", nameRu: "Индонезия", nameEn: "Indonesia", dialCode: '+62', flag: '🇮🇩', defaultTimeZone: 'Asia/Jakarta' },
  { id: 'VN', iso2: 'VN', nameUz: "Vyetnam", nameRu: "Вьетнам", nameEn: "Vietnam", dialCode: '+84', flag: '🇻🇳', defaultTimeZone: 'Asia/Ho_Chi_Minh' }
];

export const getCountryByIso2 = (iso2) => {
  if (!iso2) return null;
  const upper = iso2.toUpperCase();
  return WORLD_COUNTRIES.find(c => c.iso2 === upper || c.id === upper) || null;
};
