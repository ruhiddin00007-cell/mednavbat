/**
 * O'zbekiston telefon raqamini formatlash va tekshirish
 * Format: +998 XX XXX XX XX
 */
export const formatUzbekPhone = (input) => {
  if (!input) return '+998 ';
  
  // Faqat raqamlarni ajratib olish
  const numbersOnly = input.toString().replace(/\D/g, '');
  
  // Agar boshida 998 bo'lmasa, 998 ni qo'shamiz
  let digits = numbersOnly;
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  
  // Maksimal 9 ta raqam (masalan, 901234567)
  digits = digits.slice(0, 9);
  
  // Formatlash: +998 XX XXX XX XX
  let formatted = '+998';
  if (digits.length > 0) {
    formatted += ' ' + digits.slice(0, 2);
  }
  if (digits.length > 2) {
    formatted += ' ' + digits.slice(2, 5);
  }
  if (digits.length > 5) {
    formatted += ' ' + digits.slice(5, 7);
  }
  if (digits.length > 7) {
    formatted += ' ' + digits.slice(7, 9);
  }
  
  return formatted;
};

export const isValidUzbekPhone = (phone) => {
  if (!phone) return false;
  const numbersOnly = phone.toString().replace(/\D/g, '');
  // 998 va 9 ta raqam = jami 12 ta raqam
  return numbersOnly.length === 12 && numbersOnly.startsWith('998');
};

export const cleanPhoneForStorage = (phone) => {
  if (!phone) return '';
  return phone.toString().trim();
};

/**
 * Ko'rinadigan telefon raqamidan tel: havolasini avtomatik yasaydigan funksiya.
 * Probel, qavs, chiziqcha va boshqa belgilarni olib tashlaydi.
 * 
 * @param {string} display - Ko'rinadigan raqam, masalan "+998 (95) 141-10-07"
 * @returns {string} tel: havola, masalan "tel:+998951411007"
 * 
 * @example
 * phoneToTelHref('+998 (95) 141-10-07') // => 'tel:+998951411007'
 * phoneToTelHref('+998 71 277 95 65')   // => 'tel:+99871277956'  (xato: 5 emas 65)
 * phoneToTelHref('103')                  // => 'tel:103'
 */
export const phoneToTelHref = (display) => {
  if (!display) return 'tel:';
  const str = display.toString().trim();
  // Qisqa raqamlar (103, 101, 102, 112) — alohida qaytariladi
  if (/^\d{2,4}$/.test(str)) {
    return `tel:${str}`;
  }
  // Barcha bo'sh joy, qavs, chiziqcha, nuqta va boshqalarni olib tashlaymiz
  const clean = str.replace(/[\s()\-\.]/g, '');
  // Agar + bilan boshlansa — to'g'ridan to'g'ri ishlatamiz
  if (clean.startsWith('+')) {
    return `tel:${clean}`;
  }
  // Agar 998 bilan boshlansa — + qo'shamiz
  if (clean.startsWith('998')) {
    return `tel:+${clean}`;
  }
  return `tel:${clean}`;
};

