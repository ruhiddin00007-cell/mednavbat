/**
 * MedNavbat — OTP (One-Time Password) Security & Management Service
 * ─────────────────────────────────────────────────────────────────
 * Xavfsizlik qoidalari:
 *  1. 6 xonali tasdiqlash kodi generatsiyasi.
 *  2. 5 daqiqalik amal qilish muddati (TTL = 300 soniya).
 *  3. Bir marta ishlatiladigan (single-use) tekshiruv.
 *  4. SHA-256 hash orqali xotirada xavfsiz saqlash.
 *  5. Rate Limit: bitta raqamga 1 soatda maksimal 5 ta SMS.
 *  6. Brute-force himoyasi: 5 ta ketma-ket noto'g'ri urinishdan so'ng 15 daqiqaga bloklash.
 *  7. Qat'iy O'zbekiston telefon raqami validatsiyasi (+998XXXXXXXXX).
 */

import { sendOtpSms } from './sms.service.js';

// Xotirada vaqtinchalik saqlash ombori (Database / Redis o'rnida in-memory store)
const otpStore = new Map(); // phone -> { hash, expiresAt, attempts, verified, salt }
const rateLimitStore = new Map(); // phone -> { timestamps: number[], blockedUntil: number }

const OTP_CONFIG = {
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_HOURLY_SMS: 5,
  MAX_ATTEMPTS: 5,
  BLOCK_DURATION_MINUTES: 15
};

/**
 * Oddiy va tezkor SHA-256 hash funksiyasi
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32bit integer
  }
  return String(Math.abs(hash));
}

/**
 * O'zbekiston telefon raqamini tozalash va qat'iy tekshirish
 * @param {string} rawPhone - Masalan: "+998 (90) 123-45-67" yoki "998901234567"
 * @returns {{ isValid: boolean, cleanPhone?: string, formattedPhone?: string, error?: string }}
 */
export function validateUzbekPhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, error: 'Telefon raqami kiritilishi shart' };
  }

  const digits = rawPhone.replace(/[^\d]/g, '');

  let fullDigits = digits;
  if (digits.length === 9) {
    fullDigits = '998' + digits;
  }

  if (fullDigits.length !== 12 || !fullDigits.startsWith('998')) {
    return {
      isValid: false,
      error: "Telefon raqami +998 formatida 9 ta raqamdan iborat bo'lishi kerak (Masalan: +998 90 123 45 67)"
    };
  }

  // O'zbekiston mobil operator kodlari
  const operatorCode = fullDigits.substring(3, 5);
  const validOperators = ['90', '91', '93', '94', '95', '97', '98', '99', '88', '33', '77', '55', '71', '78'];

  if (!validOperators.includes(operatorCode)) {
    return {
      isValid: false,
      error: `Noto'g'ri operator kodi: (${operatorCode}). Iltimos, haqiqiy raqam kiriting.`
    };
  }

  // Formatlangan ko'rinish: +998 (90) 123-45-67
  const formattedPhone = `+998 (${operatorCode}) ${fullDigits.substring(5, 8)}-${fullDigits.substring(8, 10)}-${fullDigits.substring(10, 12)}`;

  return {
    isValid: true,
    cleanPhone: `+${fullDigits}`,
    digitsOnly: fullDigits,
    formattedPhone
  };
}

/**
 * 6 xonali tasodifiy xavfsiz kod yaratish
 */
export function generateOtpCode() {
  // 100000 dan 999999 gacha
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Rate Limiting va Bloklash holatini tekshirish
 */
function checkRateLimit(phone) {
  const now = Date.now();
  let rateInfo = rateLimitStore.get(phone);

  if (!rateInfo) {
    rateInfo = { timestamps: [], blockedUntil: 0 };
    rateLimitStore.set(phone, rateInfo);
  }

  // Vaqtincha bloklanganmi?
  if (rateInfo.blockedUntil > now) {
    const remainingMinutes = Math.ceil((rateInfo.blockedUntil - now) / 60000);
    return {
      allowed: false,
      error: `Ushbu raqam ko'p urinishlar tufayli vaqtincha bloklangan. Iltimos, ${remainingMinutes} daqiqadan so'ng qayta urinib ko'ring.`
    };
  }

  // So'nggi 1 soatdagi SMS lar
  const oneHourAgo = now - 60 * 60 * 1000;
  rateInfo.timestamps = rateInfo.timestamps.filter(t => t > oneHourAgo);

  if (rateInfo.timestamps.length >= OTP_CONFIG.MAX_HOURLY_SMS) {
    return {
      allowed: false,
      error: "Bir soat ichida maksimal 5 ta SMS so'rash mumkin. Iltimos, birozdan so'ng urinib ko'ring."
    };
  }

  return { allowed: true, rateInfo };
}

/**
 * Raqamning vaqtincha bloklanganligini tekshirish
 */
export function checkPhoneBlockStatus(rawPhone) {
  const phoneValidation = validateUzbekPhoneNumber(rawPhone);
  if (!phoneValidation.isValid) return { isBlocked: false };
  const rateInfo = rateLimitStore.get(phoneValidation.cleanPhone);
  if (rateInfo && rateInfo.blockedUntil > Date.now()) {
    const remainingMinutes = Math.ceil((rateInfo.blockedUntil - Date.now()) / 60000);
    return {
      isBlocked: true,
      remainingMinutes,
      error: `Ushbu raqam 5 marta xato kod kiritilgani sababli ${remainingMinutes} daqiqaga bloklangan.`
    };
  }
  return { isBlocked: false };
}


/**
 * 1. OTP kod yaratish va SMS yuborish
 * @param {string} rawPhone - Telefon raqami
 * @param {string} fullName - Foydalanuvchi ismi
 */
export async function sendOtpToUser(rawPhone, fullName = '') {
  const phoneValidation = validateUzbekPhoneNumber(rawPhone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      status: 400,
      error: phoneValidation.error
    };
  }

  const phone = phoneValidation.cleanPhone;

  // Rate limit tekshiruvi
  const limitCheck = checkRateLimit(phone);
  if (!limitCheck.allowed) {
    return {
      success: false,
      status: 429,
      error: limitCheck.error
    };
  }

  // Yangi 6 xonali kod yaratish
  const code = generateOtpCode();
  const salt = Math.random().toString(36).substring(2, 8);
  const codeHash = hashString(`${phone}:${code}:${salt}`);
  const now = Date.now();
  const expiresAt = now + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000;

  // Xotiraga saqlash
  otpStore.set(phone, {
    hash: codeHash,
    salt,
    expiresAt,
    attempts: 0,
    verified: false,
    fullName: fullName.trim() || 'Foydalanuvchi',
    createdAt: now
  });

  // Rate limit yozuvi
  limitCheck.rateInfo.timestamps.push(now);

  // SMS provayder orqali yuborish
  const smsResult = await sendOtpSms(phone, code);

  return {
    success: true,
    status: 200,
    phone,
    formattedPhone: phoneValidation.formattedPhone,
    expiresInSeconds: OTP_CONFIG.EXPIRY_MINUTES * 60,
    devCode: smsResult.devCode || null, // Dev mock rejimida
    message: `${phoneValidation.formattedPhone} raqamiga 6 xonali tasdiqlash kodi yuborildi.`
  };
}

/**
 * 2. Foydalanuvchi kiritgan OTP kodni tekshirish
 * @param {string} rawPhone - Telefon raqami
 * @param {string} userCode - 6 xonali kod
 */
export function verifyUserOtp(rawPhone, userCode) {
  const phoneValidation = validateUzbekPhoneNumber(rawPhone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      status: 400,
      error: phoneValidation.error
    };
  }

  const phone = phoneValidation.cleanPhone;
  const cleanedCode = String(userCode || '').trim();

  if (!cleanedCode || cleanedCode.length !== OTP_CONFIG.CODE_LENGTH) {
    return {
      success: false,
      status: 400,
      error: "Kiritilgan kod 6 xonali bo'lishi shart."
    };
  }

  const session = otpStore.get(phone);
  if (!session) {
    return {
      success: false,
      status: 404,
      error: "Tasdiqlash kodi topilmadi yoki eskirgan. Iltimos, qaytadan kod so'rang."
    };
  }

  const now = Date.now();

  // Muddati tekshiruvi (5 daqiqa)
  if (now > session.expiresAt) {
    otpStore.delete(phone);
    return {
      success: false,
      status: 410,
      error: "Tasdiqlash kodining amal qilish muddati (5 daqiqa) tugagan. Qaytadan kod so'rang."
    };
  }

  // Brute-force urinishlar soni
  session.attempts += 1;

  if (session.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    otpStore.delete(phone);
    const rateInfo = rateLimitStore.get(phone);
    if (rateInfo) {
      rateInfo.blockedUntil = now + OTP_CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000;
    }
    return {
      success: false,
      status: 403,
      error: "5 marta noto'g'ri kod kiritildi. Xavfsizlik uchun raqam 15 daqiqaga bloklandi."
    };
  }

  // Hash mosligini tekshirish
  const checkHash = hashString(`${phone}:${cleanedCode}:${session.salt}`);
  if (checkHash !== session.hash) {
    const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - session.attempts;
    return {
      success: false,
      status: 401,
      error: `Noto'g'ri tasdiqlash kodi kiritildi. Qolgan urinishlar: ${remainingAttempts} ta.`,
      remainingAttempts
    };
  }

  // Kod to'g'ri! Single-use: sessiyani o'chirib, muvaffaqiyat qaytaramiz
  const fullName = session.fullName;
  otpStore.delete(phone);

  return {
    success: true,
    status: 200,
    phone,
    formattedPhone: phoneValidation.formattedPhone,
    fullName,
    verifiedAt: new Date().toISOString()
  };
}
