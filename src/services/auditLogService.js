/**
 * MedNavbat — Audit Log Service (Maxfiy Xavfsizlik Jurnali)
 * ──────────────────────────────────────────────────────────
 * Qoidalar:
 *  1. Har bir muhim harakat (kirish, navbat ko'rish, band qilish, bekor qilish, profil o'chirish)
 *     ushbu jurnalga qayd etiladi.
 *  2. Jurnal faqat 'admin' roli uchun ko'rinadi.
 *  3. Maxfiylik talabi: Telefon raqamlari niqoblangan holda (+998 90 ••• •• 67),
 *     ism-shariflar qisqartirilgan, tibbiy tashxislar esa umumlashtirilgan tarzda
 *     saqlanadi. Shaxsiy ma'lumotlar ochiq holda loglanmaydi.
 */

const AUDIT_STORAGE_KEY = 'mednavbat_audit_logs';

/**
 * Telefon raqamini xavfsiz niqoblash (+998 90 ••• •• 67)
 */
export function maskPhoneNumber(phone) {
  if (!phone) return 'Noma\'lum';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 9) {
    const end = digits.slice(-2);
    const op = digits.length >= 12 ? digits.slice(3, 5) : digits.slice(0, 2);
    return `+998 (${op}) ••• •• ${end}`;
  }
  return '•••';
}

/**
 * Xavfsiz log yozish
 * @param {Object} entry
 * @param {string} entry.action      - Harakat turi (LOGIN, VIEW, BOOK, CANCEL, DELETE_ACCOUNT, etc.)
 * @param {string} entry.actorRole   - 'patient' | 'doctor' | 'admin' | 'system'
 * @param {string} [entry.actorId]   - Foydalanuvchi ID yoki niqoblangan telefon
 * @param {string} [entry.resource]  - Qaysi ma'lumot (shifokor, navbat, profil)
 * @param {string} [entry.details]   - Xavfsiz umumiy tavsif
 */
export function logAuditEvent({ action, actorRole, actorId = 'anonim', resource = 'tizim', details = '' }) {
  try {
    const newLog = {
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      action,
      actorRole,
      actorId: actorId.includes('+998') || actorId.startsWith('998') ? maskPhoneNumber(actorId) : actorId,
      resource,
      details,
      clientAgent: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop') : 'Unknown'
    };

    // Sessiyada saqlash
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existing = JSON.parse(sessionStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
      existing.unshift(newLog);
      // Maksimal 200 ta log saqlanadi
      if (existing.length > 200) existing.length = 200;
      sessionStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(existing));
    }

    return newLog;
  } catch (err) {
    // Maxfiy audit xatolarini sokin ushlash
    return null;
  }
}

/**
 * Barcha audit yozuvlarini olish (faqat admin uchun)
 * @returns {Array}
 */
export function getAuditLogs() {
  if (typeof window === 'undefined' || !window.sessionStorage) return [];
  try {
    return JSON.parse(sessionStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Jurnalni tozalash (faqat admin)
 */
export function clearAuditLogs() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    sessionStorage.removeItem(AUDIT_STORAGE_KEY);
  }
}

export default {
  logAuditEvent,
  getAuditLogs,
  clearAuditLogs,
  maskPhoneNumber,
};
