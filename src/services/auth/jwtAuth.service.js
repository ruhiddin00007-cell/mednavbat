/**
 * MedNavbat — Server-side JWT Authentication & Role Verification Service
 * ──────────────────────────────────────────────────────────────────────
 * Backend xavfsizlik yadrosi:
 * - JWT token yaratish va imzolash (HMAC-SHA256)
 * - Token amal qilish muddati va yaxlitligini tekshirish
 * - Server darajasida rolni (doctor/admin/patient) tekshirish
 * - Login urinishlari uchun Rate Limiting (Brute-force himoyasi)
 * - Parollarni xavfsiz scrypt/PBKDF2 bilan solishtirish
 */

import crypto from 'node:crypto';

// Maxfiy kalit (Production muhitida .env dan olinadi)
const JWT_SECRET = process.env.JWT_SECRET || 'mednavbat_secure_jwt_secret_key_2026_uz_tashkent_!#$';
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 soat

// ── 1. RATE LIMITER ────────────────────────────────────────────────────────────
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_PERIOD_MS = 15 * 60 * 1000; // 15 daqiqa

/**
 * Login uchun rate limitni tekshirish
 * @param {string} identifier - IP manzil yoki email/telefon
 */
export function checkLoginRateLimit(identifier) {
  const key = String(identifier || 'unknown').toLowerCase().trim();
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  // Lockout muddati tugagan bo'lsa tozalash
  if (record.lockedUntil && now > record.lockedUntil) {
    loginAttempts.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (record.lockedUntil && now <= record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      error: `Xavfsizlik sababli bloklandi. Iltimos, ${Math.ceil(remainingSeconds / 60)} daqiqadan keyin qayta urining.`,
      lockedUntil: record.lockedUntil,
      remainingSeconds
    };
  }

  // 1 soatdan eski urinishlarni tozalash
  if (now - record.firstAttempt > 60 * 60 * 1000) {
    loginAttempts.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  const remaining = MAX_ATTEMPTS - record.count;
  if (remaining <= 0) {
    record.lockedUntil = now + LOCKOUT_PERIOD_MS;
    return {
      allowed: false,
      error: "Ketma-ket 5 marta noto'g'ri urinish! Hisob 15 daqiqaga vaqtincha bloklandi.",
      lockedUntil: record.lockedUntil,
      remainingSeconds: LOCKOUT_PERIOD_MS / 1000
    };
  }

  return { allowed: true, remaining };
}

/**
 * Muvaffaqiyatsiz urinishni yozib borish
 */
export function recordFailedLoginAttempt(identifier) {
  const key = String(identifier || 'unknown').toLowerCase().trim();
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, firstAttempt: now };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_PERIOD_MS;
  }
  loginAttempts.set(key, record);
}

/**
 * Muvaffaqiyatli kirishda urinishlar tarixini tozalash
 */
export function clearLoginAttempts(identifier) {
  const key = String(identifier || 'unknown').toLowerCase().trim();
  loginAttempts.delete(key);
}

// ── 2. JWT TOKEN IMPLEMENTATION ────────────────────────────────────────────────
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * JWT Token yaratish (HMAC-SHA256)
 */
export function createJwtToken(payload, expiresIn = TOKEN_EXPIRY_SECONDS) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
    iss: 'mednavbat.uz'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * JWT Tokenni tekshirish va payloadni olish
 */
export function verifyJwtToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: "Token taqdim etilmadi." };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: "Token formati noto'g'ri." };
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // Imzoni tekshirish
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expSigBuffer)) {
    return { valid: false, error: "Token imzosi haqiqiy emas (qalbakilashtirilgan)." };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    // Amal qilish muddati tekshiruvi
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token muddati tugagan. Qaytadan kiring.", expired: true };
    }

    return { valid: true, payload };
  } catch (_e) {
    return { valid: false, error: "Token ma'lumotlarini o'qishda xatolik." };
  }
}

// ── 3. PAROLLARNI XAVFSIZ XESHLASH VA TEKSHIRISH ──────────────────────────────
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, storedHash, salt) {
  if (!password || !storedHash || !salt) return false;
  try {
    const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const bufA = Buffer.from(calculatedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  } catch (_e) {
    return false;
  }
}

// ── 4. BACKEND TEST AKKAUNTLAR BAZASI ───────────────────────────────────────────
// Standart test foydalanuvchilari (parol barchasida: MedNavbat2026!)
const defaultSalt = 'a1b2c3d4e5f60718';
const defaultHash = hashPassword('MedNavbat2026!', defaultSalt).hash;

export const SERVER_USERS = [
  {
    id: 'usr-admin-1',
    email: 'admin@mednavbat.uz',
    phone: '+998901112233',
    role: 'admin',
    fullName: 'Bosh Administrator',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'approved'
  },
  {
    id: 'usr-doc-approved-1',
    email: 'doctor.approved@mednavbat.uz',
    phone: '+998902223344',
    role: 'doctor',
    fullName: 'Dr. Akmal Rahimov',
    specialtyName: 'Kardiolog',
    licenseNumber: 'LN-784920',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'approved' // Shifokor paneliga kirish ruxsat etilgan
  },
  {
    id: 'usr-doc-pending-1',
    email: 'doctor.pending@mednavbat.uz',
    phone: '+998903334455',
    role: 'doctor',
    fullName: 'Dr. Nilufar Karimova',
    specialtyName: 'Pediatr',
    licenseNumber: 'LN-392817',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'pending' // Tekshirilmoqda, /doctor ga kira olmaydi
  },
  {
    id: 'usr-doc-review-1',
    email: 'doctor.review@mednavbat.uz',
    phone: '+998904445566',
    role: 'doctor',
    fullName: 'Dr. Jamshid Aliyev',
    specialtyName: 'Stomatolog',
    licenseNumber: 'LN-918273',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'needs_review' // AI shubha bildirgan, admin ko'rishi kerak
  },
  {
    id: 'usr-patient-1',
    email: 'patient@mednavbat.uz',
    phone: '+998905556677',
    role: 'patient',
    fullName: 'Anvar Zokirov',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'approved'
  }
];

/**
 * Serverda foydalanuvchini autentifikatsiya qilish
 */
export function authenticateUser(identifier, password, requiredRole = null) {
  const cleanId = String(identifier || '').trim().toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, '');

  const rateCheck = checkLoginRateLimit(cleanId);
  if (!rateCheck.allowed) {
    return { success: false, status: 429, error: rateCheck.error };
  }

  const user = SERVER_USERS.find(u => 
    u.email.toLowerCase() === cleanId || 
    u.phone.replace(/\D/g, '') === digitsOnly
  );

  if (!user) {
    recordFailedLoginAttempt(cleanId);
    return {
      success: false,
      status: 401,
      error: "Email/telefon yoki maxfiy parol noto'g'ri."
    };
  }

  const isPasswordValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isPasswordValid) {
    recordFailedLoginAttempt(cleanId);
    return {
      success: false,
      status: 401,
      error: "Email/telefon yoki maxfiy parol noto'g'ri."
    };
  }

  // Rol tekshiruvi (agar so'ralgan bo'lsa)
  if (requiredRole && user.role !== requiredRole) {
    return {
      success: false,
      status: 403,
      error: `Ushbu profil '${requiredRole}' roliga ega emas.`
    };
  }

  clearLoginAttempts(cleanId);

  // JWT Token yaratish
  const token = createJwtToken({
    userId: user.id,
    role: user.role,
    status: user.status,
    fullName: user.fullName,
    email: user.email,
    licenseNumber: user.licenseNumber || null
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      fullName: user.fullName,
      status: user.status,
      licenseNumber: user.licenseNumber || null
    }
  };
}

// ── 5. SERVER MIDDLEWARE HELPERS ───────────────────────────────────────────────

/**
 * Request'dan Bearer tokenni ajratib olish
 */
export function extractBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Faqat autentifikatsiya qilingan foydalanuvchilar uchun tekshiruv
 */
export function requireAuth(req) {
  const token = extractBearerToken(req);
  if (!token) {
    return { authorized: false, status: 401, error: "Avtorizatsiya tokeni mavjud emas (401 Unauthorized)." };
  }
  const verify = verifyJwtToken(token);
  if (!verify.valid) {
    return { authorized: false, status: 401, error: verify.error };
  }
  return { authorized: true, user: verify.payload };
}

/**
 * Faqat shifokorlar uchun server middleware tekshiruvi
 * Qoida: role === 'doctor' VA status === 'approved' bo'lishi shart!
 */
export function requireDoctorAuth(req) {
  const auth = requireAuth(req);
  if (!auth.authorized) return auth;

  if (auth.user.role !== 'doctor') {
    return {
      authorized: false,
      status: 403,
      error: "Taqiqlangan (403 Forbidden): Bu marshrut faqat shifokorlar uchun."
    };
  }

  if (auth.user.status !== 'approved') {
    return {
      authorized: false,
      status: 403,
      error: "Hujjatlaringiz hali admin tomonidan tasdiqlanmagan. Shifokor kabinetiga kirish yopiq.",
      doctorStatus: auth.user.status
    };
  }

  return auth;
}

/**
 * Faqat admin uchun server middleware tekshiruvi
 * Qoida: role === 'admin' bo'lishi shart!
 */
export function requireAdminAuth(req) {
  const auth = requireAuth(req);
  if (!auth.authorized) return auth;

  if (auth.user.role !== 'admin') {
    return {
      authorized: false,
      status: 403,
      error: "Taqiqlangan (403 Forbidden): Ushbu amal faqat administrator uchun ruxsat etilgan."
    };
  }

  return auth;
}
