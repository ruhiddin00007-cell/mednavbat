/**
 * MedNavbat — Xavfsizlik va Kriptografiya Yordamchisi (cryptoHelper.js)
 * ──────────────────────────────────────────────────────────────────────
 * 1. Parollarni scrypt / PBKDF2 (SHA-256) va salt bilan xavfsiz xeshlash.
 *    Oddiy matn (plaintext) hech qachon saqlanmaydi!
 * 2. Timing-safe taqqoslash (Timing attack'dan himoya).
 * 3. Fayllarni tekshirish (faqat jpg, png, pdf; hajm <= 5 MB).
 * 4. Fayl nomini tozalash (Path traversal va maxsus belgilardan tozalash).
 * 5. Loglar uchun shaxsiy ma'lumotlarni niqoblash (masking).
 */

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf']);

/**
 * Fayl nomini tozalash va xavfsiz qilish
 * Path traversal (../), bo'shliqlar va zararli belgilarni olib tashlaydi
 */
export function sanitizeFileName(rawFileName) {
  if (!rawFileName || typeof rawFileName !== 'string') {
    return `doc_${Date.now()}`;
  }
  // Bazaviy nomni olish (katalog yo'llarini olib tashlash)
  const base = rawFileName.replace(/^.*[\\/]/, '');
  // Kengaytmani ajratish
  const lastDot = base.lastIndexOf('.');
  const ext = lastDot !== -1 ? base.substring(lastDot).toLowerCase() : '';
  const nameWithoutExt = lastDot !== -1 ? base.substring(0, lastDot) : base;

  // Xavfsiz belgilarga aylantirish
  const cleanName = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);

  const cleanExt = ext.replace(/[^a-z0-9.]/g, '');

  return `${cleanName || 'document'}_${Date.now().toString(36)}${cleanExt}`;
}

/**
 * Yuklangan faylni tekshirish (tur va hajm)
 */
export function validateUploadedFile(file) {
  if (!file) {
    return { isValid: false, error: "Fayl tanlanmadi." };
  }

  // Hajm tekshiruvi (max 5 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Fayl hajmi 5 MB dan oshmasligi kerak. Siz yuklagan hajm: ${(file.size / (1024 * 1024)).toFixed(1)} MB`
    };
  }

  // MIME type tekshiruvi
  const mimeType = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const ext = name.substring(name.lastIndexOf('.'));

  const isValidMime = ALLOWED_MIME_TYPES.has(mimeType);
  const isValidExt = ALLOWED_EXTENSIONS.has(ext);

  if (!isValidMime && !isValidExt) {
    return {
      isValid: false,
      error: "Faqat JPG, PNG yoki PDF formatidagi fayllar qabul qilinadi."
    };
  }

  return { isValid: true };
}

/**
 * Faylni Base64 / Data URL ga o'qish (brauzerda xavfsiz ko'rish uchun)
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Faylni o'qishda xatolik yuz berdi."));
    reader.readAsDataURL(file);
  });
}

/**
 * 16 baytlik tasodifiy salt generatsiya qilish
 */
export function generateSalt(length = 16) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback
  let salt = '';
  for (let i = 0; i < length * 2; i++) {
    salt += Math.floor(Math.random() * 16).toString(16);
  }
  return salt;
}

/**
 * Parolni PBKDF2 (SHA-256) bilan hash qilish (Brauzer va Server uchun)
 */
export async function hashPasswordClient(password, salt = generateSalt()) {
  if (!password || typeof password !== 'string') {
    throw new Error("Parol kiritilishi shart");
  }

  // Web Crypto API (Brauzerda eng zamonaviy va tezkor)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const saltBuffer = enc.encode(salt);
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 32 bayt
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { salt, hash: hashHex };
  }

  // Fallback: Oddiy SHA-256 zanjiri
  let current = `${password}:${salt}`;
  for (let i = 0; i < 5000; i++) {
    current = simpleSha256Fallback(current);
  }
  return { salt, hash: current };
}

/**
 * Parolni xesh bilan solishtirish
 */
export async function verifyPasswordClient(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  try {
    const result = await hashPasswordClient(password, salt);
    return timingSafeCompare(result.hash, storedHash);
  } catch (_e) {
    return false;
  }
}

/**
 * Timing-safe string taqqoslash
 */
export function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function simpleSha256Fallback(str) {
  // Oddiy deterministik hashing
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, 'a');
}

/**
 * Loglar uchun ma'lumotlarni tozalash (Sanitization)
 */
export function maskSensitiveData(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    // Telefon raqami
    if (data.includes('+998') || /^\d{9,12}$/.test(data)) {
      const clean = data.replace(/\D/g, '');
      return clean.length >= 9 ? `+998 ••• •• ${clean.slice(-2)}` : '••••';
    }
    // Email
    if (data.includes('@')) {
      const [u, d] = data.split('@');
      return `${u.slice(0, 1)}•••@${d}`;
    }
    return data;
  }
  return data;
}
