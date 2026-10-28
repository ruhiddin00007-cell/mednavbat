/**
 * MedNavbat Server — OTP Service
 * ────────────────────────────────
 * Xavfsizlik:
 *  • 6 xonali tasodifiy kod
 *  • 5 daqiqalik TTL
 *  • Single-use (bir marta)
 *  • Brute-force: 5 noto'g'ri → 15 daqiqa blok
 *  • Rate limit: 1 soatda max 5 ta SMS
 *  • HMAC-like hash (OTP_SECRET bilan)
 */

import { sendOtpSms } from './sms.service.js';

// ── In-memory store (Production: Redis ishlatish tavsiya etiladi) ─────────────
const otpStore       = new Map(); // phone → { hash, salt, expiresAt, attempts, fullName }
const rateLimitStore = new Map(); // phone → { timestamps[], blockedUntil }

const CFG = {
  CODE_LEN:       6,
  TTL_MS:         5 * 60 * 1000,    // 5 daqiqa
  MAX_HOURLY:     5,
  MAX_ATTEMPTS:   5,
  BLOCK_MS:       15 * 60 * 1000,   // 15 daqiqa
};

const OTP_SECRET = process.env.OTP_SECRET || 'mednavbat_dev_otp_secret_change_me';

// ── Yordamchi funksiyalar ────────────────────────────────────────────────────

/** Deterministik hash (HMAC-like, no crypto dependency) */
function hashCode(str) {
  let h = 5381;
  const key = OTP_SECRET + str;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h, 33) ^ key.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/** O'zbekiston telefon raqamini normallashtirish */
export function validatePhone(raw) {
  if (!raw || typeof raw !== 'string') {
    return { ok: false, error: 'Telefon raqami kiritilishi shart' };
  }
  const d = raw.replace(/\D/g, '');
  const full = d.length === 9 ? '998' + d : d;

  if (full.length !== 12 || !full.startsWith('998')) {
    return { ok: false, error: "+998 formatida 9 ta raqam kiriting (masalan: +998 90 123 45 67)" };
  }

  const op = full.slice(3, 5);
  const validOps = ['90','91','93','94','95','97','98','99','88','33','77','55','71','78'];
  if (!validOps.includes(op)) {
    return { ok: false, error: `Noto'g'ri operator kodi: (${op})` };
  }

  return {
    ok: true,
    clean:     '+' + full,
    digits:    full,
    formatted: `+998 (${op}) ${full.slice(5,8)}-${full.slice(8,10)}-${full.slice(10,12)}`
  };
}

/** Tasodifiy 6 xonali kod */
function genCode() {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

/** Rate limit tekshiruvi */
function checkRate(phone) {
  const now = Date.now();
  let r = rateLimitStore.get(phone) || { timestamps: [], blockedUntil: 0 };
  rateLimitStore.set(phone, r);

  if (r.blockedUntil > now) {
    const min = Math.ceil((r.blockedUntil - now) / 60_000);
    return { ok: false, error: `Raqam ${min} daqiqaga bloklangan. Keyinroq urinib ko'ring.` };
  }

  const hour = now - 3_600_000;
  r.timestamps = r.timestamps.filter(t => t > hour);

  if (r.timestamps.length >= CFG.MAX_HOURLY) {
    return { ok: false, error: "1 soatda maksimal 5 ta SMS so'rash mumkin." };
  }

  return { ok: true, record: r };
}

// ── Asosiy funksiyalar ───────────────────────────────────────────────────────

/**
 * OTP yuborish
 */
export async function sendOtp(rawPhone, fullName = '') {
  const phone = validatePhone(rawPhone);
  if (!phone.ok) return { success: false, status: 400, error: phone.error };

  const rate = checkRate(phone.clean);
  if (!rate.ok) return { success: false, status: 429, error: rate.error };

  const code      = genCode();
  const salt      = Math.random().toString(36).slice(2, 9);
  const hash      = hashCode(`${phone.clean}:${code}:${salt}`);
  const expiresAt = Date.now() + CFG.TTL_MS;

  otpStore.set(phone.clean, {
    hash, salt, expiresAt,
    attempts: 0,
    verified: false,
    fullName: (fullName || '').trim() || 'Foydalanuvchi',
    createdAt: Date.now()
  });

  rate.record.timestamps.push(Date.now());

  const smsResult = await sendOtpSms(phone.digits, code);

  return {
    success:        true,
    status:         200,
    phone:          phone.clean,
    formattedPhone: phone.formatted,
    expiresInSeconds: CFG.TTL_MS / 1000,
    devCode:        smsResult.devCode || null,
    message:        `${phone.formatted} ga tasdiqlash kodi yuborildi.`
  };
}

/**
 * OTP tekshirish
 */
export function verifyOtp(rawPhone, userCode) {
  const phone = validatePhone(rawPhone);
  if (!phone.ok) return { success: false, status: 400, error: phone.error };

  const code = String(userCode || '').trim();
  if (code.length !== CFG.CODE_LEN) {
    return { success: false, status: 400, error: '6 xonali kod kiriting.' };
  }

  const session = otpStore.get(phone.clean);
  if (!session) {
    return { success: false, status: 404, error: 'Kod topilmadi yoki eskirgan. Qaytadan so'rang.' };
  }

  if (Date.now() > session.expiresAt) {
    otpStore.delete(phone.clean);
    return { success: false, status: 410, error: 'Kod muddati tugagan (5 daqiqa). Qaytadan so'rang.' };
  }

  session.attempts++;

  if (session.attempts >= CFG.MAX_ATTEMPTS) {
    otpStore.delete(phone.clean);
    const r = rateLimitStore.get(phone.clean);
    if (r) r.blockedUntil = Date.now() + CFG.BLOCK_MS;
    return { success: false, status: 403, error: '5 noto'g'ri urinish. Raqam 15 daqiqaga bloklandi.' };
  }

  const expected = hashCode(`${phone.clean}:${code}:${session.salt}`);
  if (expected !== session.hash) {
    const left = CFG.MAX_ATTEMPTS - session.attempts;
    return {
      success: false, status: 401,
      error: `Noto'g'ri kod. Qolgan urinish: ${left} ta.`,
      remainingAttempts: left
    };
  }

  const fullName = session.fullName;
  otpStore.delete(phone.clean);

  return {
    success:        true,
    status:         200,
    phone:          phone.clean,
    formattedPhone: phone.formatted,
    fullName,
    verifiedAt: new Date().toISOString()
  };
}
