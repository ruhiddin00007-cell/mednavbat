/**
 * MedNavbat — Shifokor Autentifikatsiyasi va Email Tasdiqlash Servisi
 * ──────────────────────────────────────────────────────────────────
 * Talablar bo'yicha to'liq xavfsizlik:
 * - Parolni scrypt + salt bilan xavfsiz hash qilish (oddiy matn saqlanmaydi)
 * - Kamida 32 baytlik kriptografik token (sha256 hash holida saqlanadi)
 * - 24 soatlik amal qilish muddati
 * - Email dublikatini rad etish ("Bu email allaqachon ro'yxatdan o'tgan")
 * - Rate limiting (soatiga 5 ta ro'yxatdan o'tish, 60s cooldown qayta yuborish)
 * - Botlardan himoya (Honeypot maydoni)
 * - Shaxsiy ma'lumotlar loglarda maskalanadi
 */

import crypto from 'node:crypto';
import { sendEmailViaResend, maskEmail, maskPhone } from './emailSender.js';
import { buildDoctorRegistrationEmail } from './doctorEmailTemplate.js';

// In-Memory Doctor & Token Storage (Netlify Functions va Server uchun)
// Production'da DB (PostgreSQL / MongoDB / Supabase) ga ulanadi
const doctorAccounts = new Map(); // email.toLowerCase() -> DoctorRecord
const emailTokens = new Map();    // tokenHash -> TokenRecord
const verificationCodes = new Map(); // codeHash -> TokenRecord

// Rate Limiting Storage
const registrationAttempts = new Map(); // ip_or_email -> [timestamps]
const resendCooldowns = new Map();      // email -> lastTimestamp

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 soat
const RESEND_COOLDOWN_MS = 60 * 1000;         // 60 soniya
const MAX_REGISTRATIONS_PER_HOUR = 5;

// ── Xavfsizlik Yordamchilari ──────────────────────────────────────────────────

/**
 * Parolni scrypt bilan hash qilish
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

/**
 * Parolni tekshirish
 */
export function verifyPassword(password, salt, storedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * SHA-256 hash
 */
export function sha256(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

/**
 * Telefon raqamini standartlashtirish (+998XXXXXXXXX)
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+998')) {
    return digits;
  }
  if (digits.startsWith('998')) {
    return `+${digits}`;
  }
  return digits;
}

/**
 * Telefon formatini tekshirish (+998 va 9 ta raqam)
 */
export function isValidUzbekPhone(phone) {
  const normalized = normalizePhone(phone);
  return /^\+998\d{9}$/.test(normalized);
}

/**
 * Email formatini tekshirish
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

/**
 * Rate Limit tekshiruvi (IP va email uchun)
 */
function checkRateLimit(key, maxLimit = MAX_REGISTRATIONS_PER_HOUR, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const attempts = registrationAttempts.get(key) || [];
  const validAttempts = attempts.filter(ts => now - ts < windowMs);

  if (validAttempts.length >= maxLimit) {
    return false;
  }

  validAttempts.push(now);
  registrationAttempts.set(key, validAttempts);
  return true;
}

// ── ASOSIY OPERATSIYALAR ──────────────────────────────────────────────────────

/**
 * 1. Shifokor Ro'yxatdan O'tishi (Backend)
 */
export async function registerDoctor({
  fullName,
  phone,
  email,
  password,
  specialtyId,
  specialtyName,
  experienceYears = 0,
  licenseNo,
  hospitalName = '',
  workDays = '',
  bio = '',
  avatar = '',
  honeypot = '',
  clientIp = 'unknown',
  appUrl = ''
}) {
  console.log(`[DoctorAuth] Yangi ro'yxatdan o'tish so'rovi: ${maskEmail(email)}, IP: ${clientIp}`);

  // 1. Bot tekshiruvi (Honeypot)
  if (honeypot && honeypot.trim() !== '') {
    console.warn(`[DoctorAuth] ⚠️ Bot aniqlandi (Honeypot to'ldirilgan): IP ${clientIp}`);
    return {
      success: false,
      status: 400,
      error: "Xavfsizlik tekshiruvidan o'tmadi."
    };
  }

  // 2. Majburiy maydonlar
  if (!fullName || !fullName.trim()) {
    return { success: false, status: 400, error: "Ism va familiyani kiriting." };
  }
  if (!phone || !phone.trim()) {
    return { success: false, status: 400, error: "Telefon raqamini kiriting." };
  }
  if (!email || !email.trim()) {
    return { success: false, status: 400, error: "Email manzilini kiriting." };
  }
  if (!password || password.length < 8) {
    return { success: false, status: 400, error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." };
  }
  if (!licenseNo || !licenseNo.trim()) {
    return { success: false, status: 400, error: "Diplom yoki litsenziya raqami majburiy." };
  }

  // 3. Format validatsiyalari
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return { success: false, status: 400, error: "Noto'g'ri email formati. Masalan: shifokor@mednavbat.uz" };
  }

  const cleanPhone = normalizePhone(phone);
  if (!isValidUzbekPhone(cleanPhone)) {
    return { success: false, status: 400, error: "Noto'g'ri telefon formati. (+998XXXXXXXXX ko'rinishida 9 ta raqam bo'lishi kerak)" };
  }

  // 4. Rate Limiting tekshiruvi (IP va Email)
  if (!checkRateLimit(clientIp) || !checkRateLimit(cleanEmail)) {
    return {
      success: false,
      status: 429,
      error: "Juda ko'p urinishlar qilindi. Iltimos, 1 soatdan so'ng qayta urinib ko'ring."
    };
  }

  // 5. Takroriy email tekshiruvi
  if (doctorAccounts.has(cleanEmail)) {
    const existing = doctorAccounts.get(cleanEmail);
    // Agar allaqachon tasdiqlangan bo'lsa
    if (existing.emailVerified) {
      return {
        success: false,
        status: 409,
        error: "Bu email allaqachon ro'yxatdan o'tgan"
      };
    }
  }

  // 6. Parolni xavfsiz hash qilish (oddiy parol saqlanmaydi)
  const { salt, hash: passwordHash } = hashPassword(password);

  // 7. Kriptografik tasdiqlash tokeni va 6 xonali kod yaratish
  const rawToken = crypto.randomBytes(32).toString('hex'); // 32 bayt = 64 hex belgi
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000)); // 6 xonali kod
  const tokenHash = sha256(rawToken);
  const codeHash = sha256(verificationCode);
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

  // 8. Havolani shakllantirish
  const baseUrl = (appUrl || process.env.APP_URL || process.env.URL || 'https://mednavbat.uz').replace(/\/$/, '');
  const verifyUrl = `${baseUrl}/?verify_token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

  // 9. Email xabarini tayyorlash
  const { subject, html, text } = buildDoctorRegistrationEmail({
    fullName: fullName.trim(),
    verifyUrl,
    verificationCode,
    email: cleanEmail,
    licenseNo: licenseNo.trim(),
    specialtyName: specialtyName || specialtyId
  });

  // 10. Emailni yuborish (Resend orqali)
  const emailResult = await sendEmailViaResend({
    to: cleanEmail,
    subject,
    html,
    text
  });

  if (!emailResult.success) {
    return {
      success: false,
      status: 502,
      error: "Xabar yuborib bo'lmadi, keyinroq urinib ko'ring",
      details: emailResult.error
    };
  }

  // 11. Shifokor hisobini saqlash
  const doctorId = `doc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const doctorRecord = {
    id: doctorId,
    fullName: fullName.trim(),
    phone: cleanPhone,
    email: cleanEmail,
    passwordHash,
    salt,
    specialtyId,
    specialtyName: specialtyName || specialtyId,
    experienceYears: Number(experienceYears) || 0,
    licenseNo: licenseNo.trim(),
    hospitalName: hospitalName.trim(),
    workDays: workDays.trim(),
    bio: bio.trim(),
    avatar: avatar.trim() || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    // Holatlar:
    emailVerified: false,
    status: 'pending_verification', // "kutilmoqda"
    licenseStatus: 'under_review',   // "tekshirilmoqda"
    licenseVerified: false,          // Admin tasdiqlamaguncha false
    createdAt: new Date().toISOString()
  };

  doctorAccounts.set(cleanEmail, doctorRecord);

  // 12. Token va Kodni FAQAT HASH holida saqlash
  const tokenRecord = {
    email: cleanEmail,
    expiresAt,
    used: false
  };
  emailTokens.set(tokenHash, tokenRecord);
  verificationCodes.set(codeHash, tokenRecord);

  // Cooldown boshlash
  resendCooldowns.set(cleanEmail, Date.now());

  console.log(`[DoctorAuth] Yangi shifokor ro'yxatga olindi: ${doctorId}, email: ${maskEmail(cleanEmail)}`);

  return {
    success: true,
    status: 201,
    message: `Ro'yxatdan o'tdingiz! Emailingizni tekshiring: ${cleanEmail}`,
    email: cleanEmail,
    doctorId,
    statusState: 'pending_verification',
    // Dev/Test uchun token ma'lumotlari (faqat mahalliy muhitda)
    ...(emailResult.simulated ? { debugToken: rawToken, debugCode: verificationCode } : {})
  };
}

/**
 * 2. Emailni Tasdiqlash (Verification via Token or 6-digit Code)
 */
export function verifyDoctorEmail({ token, code, email }) {
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const now = Date.now();

  let targetRecord = null;
  let keyToDelete = null;
  let isCodeMatch = false;

  // 1. Token orqali tekshirish
  if (token && token.trim()) {
    const tokenHash = sha256(token.trim());
    if (emailTokens.has(tokenHash)) {
      targetRecord = emailTokens.get(tokenHash);
      keyToDelete = tokenHash;
    }
  }

  // 2. 6 xonali kod orqali tekshirish
  if (!targetRecord && code && code.trim()) {
    const codeHash = sha256(code.trim());
    if (verificationCodes.has(codeHash)) {
      targetRecord = verificationCodes.get(codeHash);
      keyToDelete = codeHash;
      isCodeMatch = true;
    }
  }

  if (!targetRecord) {
    return {
      success: false,
      status: 400,
      error: "Tasdiqlash havolasi yoki kodi noto'g'ri yoxud eskirgan."
    };
  }

  // Muddati o'tganmi?
  if (targetRecord.expiresAt < now) {
    if (isCodeMatch) {
      verificationCodes.delete(keyToDelete);
    } else {
      emailTokens.delete(keyToDelete);
    }
    return {
      success: false,
      status: 410,
      error: "Tasdiqlash havolasining amal qilish muddati tugagan (24 soat). Iltimos, yangi havola so'rang."
    };
  }

  // Agar email ko'rsatilgan bo'lsa va mos kelmasa
  if (cleanEmail && targetRecord.email !== cleanEmail) {
    return {
      success: false,
      status: 400,
      error: "Ushbu havola boshqa email manziliga tegishli."
    };
  }

  // Shifokor ma'lumotlarini yangilash
  const doctor = doctorAccounts.get(targetRecord.email);
  if (!doctor) {
    return {
      success: false,
      status: 404,
      error: "Shifokor hisobi topilmadi."
    };
  }

  // Holatni yangilaymiz: email tasdiqlandi, lekin litsenziya hali TEKSHIRILMOQDA!
  doctor.emailVerified = true;
  doctor.status = 'email_verified'; // yoki 'under_review'
  doctor.emailVerifiedAt = new Date().toISOString();

  // Tokenni bir martalik qilib o'chirish
  if (isCodeMatch) {
    verificationCodes.delete(keyToDelete);
  } else {
    emailTokens.delete(keyToDelete);
  }

  console.log(`[DoctorAuth] ✅ Email muvaffaqiyatli tasdiqlandi: ${maskEmail(doctor.email)}`);

  return {
    success: true,
    status: 200,
    message: "Email manzilingiz muvaffaqiyatli tasdiqlandi! Arizangiz ma'muriyat tomonidan ko'rib chiqilmoqda.",
    doctor: {
      id: doctor.id,
      fullName: doctor.fullName,
      email: doctor.email,
      phone: doctor.phone,
      specialtyName: doctor.specialtyName,
      emailVerified: true,
      licenseStatus: doctor.licenseStatus,
      status: doctor.status
    }
  };
}

/**
 * 3. Tasdiqlash Xatini Qayta Yuborish (Resend Verification with 60s cooldown)
 */
export async function resendVerificationEmail({ email, clientIp = 'unknown', appUrl = '' }) {
  if (!email || !email.trim()) {
    return { success: false, status: 400, error: "Email manzilini kiriting." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const doctor = doctorAccounts.get(cleanEmail);

  if (!doctor) {
    return {
      success: false,
      status: 404,
      error: "Ushbu email bilan ro'yxatdan o'tgan shifokor topilmadi."
    };
  }

  if (doctor.emailVerified) {
    return {
      success: false,
      status: 400,
      error: "Ushbu email allaqachon tasdiqlangan."
    };
  }

  // 60 soniyalik Cooldown tekshiruvi
  const lastResend = resendCooldowns.get(cleanEmail) || 0;
  const elapsed = Date.now() - lastResend;
  if (elapsed < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    return {
      success: false,
      status: 429,
      error: `Iltimos, yangi xabar so'rash uchun yana ${waitSeconds} soniya kuting.`,
      waitSeconds
    };
  }

  // Yangi token va kod
  const rawToken = crypto.randomBytes(32).toString('hex');
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const tokenHash = sha256(rawToken);
  const codeHash = sha256(verificationCode);
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

  const baseUrl = (appUrl || process.env.APP_URL || process.env.URL || 'https://mednavbat.uz').replace(/\/$/, '');
  const verifyUrl = `${baseUrl}/?verify_token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

  const { subject, html, text } = buildDoctorRegistrationEmail({
    fullName: doctor.fullName,
    verifyUrl,
    verificationCode,
    email: cleanEmail,
    licenseNo: doctor.licenseNo,
    specialtyName: doctor.specialtyName
  });

  const sendResult = await sendEmailViaResend({
    to: cleanEmail,
    subject,
    html,
    text
  });

  if (!sendResult.success) {
    return {
      success: false,
      status: 502,
      error: "Xabar yuborib bo'lmadi, keyinroq urinib ko'ring",
      details: sendResult.error
    };
  }

  // Tokenlarni saqlash
  const tokenRecord = {
    email: cleanEmail,
    expiresAt,
    used: false
  };
  emailTokens.set(tokenHash, tokenRecord);
  verificationCodes.set(codeHash, tokenRecord);
  resendCooldowns.set(cleanEmail, Date.now());

  console.log(`[DoctorAuth] Qayta xat yuborildi: ${maskEmail(cleanEmail)}`);

  return {
    success: true,
    status: 200,
    message: `Yangi tasdiqlash xabari emailingizga yuborildi: ${cleanEmail}`,
    ...(sendResult.simulated ? { debugToken: rawToken, debugCode: verificationCode } : {})
  };
}

/**
 * Shifokor login tekshiruvi (Parol va Email tasdiqlanishini tekshirish)
 */
export function authenticateDoctor(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase();
  let foundDoctor = null;

  for (const doc of doctorAccounts.values()) {
    if (doc.email.toLowerCase() === cleanId || doc.phone.replace(/[^\d+]/g, '') === cleanId.replace(/[^\d+]/g, '')) {
      foundDoctor = doc;
      break;
    }
  }

  if (!foundDoctor) {
    return {
      success: false,
      error: "Telefon/Email yoki parol noto'g'ri."
    };
  }

  // Parol tekshiruvi
  const isValid = verifyPassword(password, foundDoctor.salt, foundDoctor.passwordHash);
  if (!isValid) {
    return {
      success: false,
      error: "Telefon/Email yoki parol noto'g'ri."
    };
  }

  // Email tasdiqlanganmi?
  if (!foundDoctor.emailVerified) {
    return {
      success: false,
      requiresEmailVerification: true,
      email: foundDoctor.email,
      error: "Akkaunt kutilmoqda holatida. Iltimos, emailingizga yuborilgan havola orqali emailni tasdiqlang."
    };
  }

  return {
    success: true,
    doctor: {
      id: foundDoctor.id,
      fullName: foundDoctor.fullName,
      email: foundDoctor.email,
      phone: foundDoctor.phone,
      specialtyName: foundDoctor.specialtyName,
      status: foundDoctor.status,
      licenseStatus: foundDoctor.licenseStatus
    }
  };
}

/**
 * Barcha shifokorlar (DB integratsiyasi uchun yordamchi)
 */
export function getAllRegisteredDoctors() {
  return Array.from(doctorAccounts.values()).map(d => ({
    id: d.id,
    fullName: d.fullName,
    name: d.fullName,
    email: d.email,
    phone: d.phone,
    specialtyId: d.specialtyId,
    specialtyName: d.specialtyName,
    experienceYears: d.experienceYears,
    licenseNo: d.licenseNo,
    licenseNumber: d.licenseNo,
    hospitalName: d.hospitalName,
    emailVerified: d.emailVerified,
    status: d.status,
    licenseStatus: d.licenseStatus,
    licenseVerified: d.licenseVerified,
    createdAt: d.createdAt
  }));
}
