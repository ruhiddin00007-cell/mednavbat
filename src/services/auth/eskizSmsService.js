/**
 * MedNavbat — Eskiz.uz SMS Integratsiya Moduli
 * ─────────────────────────────────────────────
 * Xususiyatlari:
 *  1. Eskiz.uz REST API orqali rasmiy SMS yuborish (https://notify.eskiz.uz).
 *  2. Token avtomatik keshlanadi va muddati o'tsa yangilanadi.
 *  3. Sinov (Test) rejimida: Eskizga so'rov yubormasdan, kodni brauzer konsoliga
 *     chiqaradi, shunda ishlab chiquvchi SMS balansini sarflamasdan sinab ko'radi.
 *  4. Barcha kalitlar faqat .env faylidan olinadi (kodda qattiq yozilmaydi).
 */

const ESKIZ_BASE_URL = 'https://notify.eskiz.uz/api';

// Muhit o'zgaruvchilari
const ESKIZ_EMAIL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ESKIZ_EMAIL) || '';
const ESKIZ_PASSWORD = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ESKIZ_PASSWORD) || '';
const ESKIZ_FROM = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ESKIZ_FROM) || '4546';
const IS_TEST_MODE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ESKIZ_TEST_MODE === 'true') ||
  !ESKIZ_EMAIL ||
  !ESKIZ_PASSWORD;

// Xotirada tokenni saqlash
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Eskiz.uz dan Bearer Token olish
 * @returns {Promise<string|null>}
 */
async function getEskizToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now) {
    return cachedToken;
  }

  if (!ESKIZ_EMAIL || !ESKIZ_PASSWORD) {
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('email', ESKIZ_EMAIL);
    formData.append('password', ESKIZ_PASSWORD);

    const res = await fetch(`${ESKIZ_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!res.ok) {
      console.warn('[Eskiz.uz] Avtorizatsiya xatosi (status):', res.status);
      return null;
    }

    const data = await res.json();
    const token = data?.data?.token;

    if (token) {
      cachedToken = token;
      // Eskiz tokenlari odatda 30 kun amal qiladi, biz 25 kunga keshlaymiz
      tokenExpiresAt = now + 25 * 24 * 60 * 60 * 1000;
      return token;
    }
  } catch (err) {
    console.warn('[Eskiz.uz] Tarmoq xatosi:', err.message);
  }

  return null;
}

/**
 * 6 xonali tasdiqlash kodini SMS orqali yuborish
 * @param {string} rawPhone - Masalan: "+998 90 123 45 67" yoki "998901234567"
 * @param {string} code     - 6 xonali tasdiqlash kodi
 * @returns {Promise<{ success: boolean, devCode?: string, testMode?: boolean, error?: string }>}
 */
export async function sendEskizSms(rawPhone, code) {
  // Telefon raqamidan faqat raqamlarni ajratib olish (masalan: 998901234567)
  const digits = String(rawPhone || '').replace(/\D/g, '');
  const cleanPhone = digits.startsWith('998') ? digits : `998${digits}`;

  // 1. SINOV (TEST) REJIMI:
  // Agar test rejimi yoqilgan bo'lsa yoki Eskiz kalitlari belgilanmagan bo'lsa
  if (IS_TEST_MODE) {
    const maskedPhone = `+${cleanPhone.slice(0, 5)} ••• •• ${cleanPhone.slice(-2)}`;
    // Foydalanuvchi sinovdan o'tkazishi uchun konsolga chiqarish:
    console.log(
      `%c[Eskiz.uz SMS SINOVI]%c Telefon: %c${maskedPhone}%c | Bir martalik kod: %c${code}`,
      'background:#0d9488;color:white;padding:3px 6px;border-radius:4px;font-weight:bold;',
      'color:#64748b;font-weight:bold;',
      'color:#0f172a;font-weight:bold;',
      'color:#64748b;',
      'background:#fef08a;color:#854d0e;padding:2px 8px;border-radius:4px;font-size:14px;font-weight:900;'
    );

    return {
      success: true,
      testMode: true,
      devCode: code,
      message: `[Sinov Rejimi] Tasdiqlash kodi konsolga chiqarildi: ${code}`,
    };
  }

  // 2. REAL ESKIZ.UZ REJIMI:
  try {
    const token = await getEskizToken();
    if (!token) {
      console.warn('[Eskiz.uz] Token olinmadi, test rejimiga o\'tilmoqda');
      console.log(`[Eskiz.uz Fallback Kod]: ${code}`);
      return { success: true, testMode: true, devCode: code };
    }

    const message = `MedNavbat: Sizning tasdiqlash kodingiz — ${code}. Ushbu kodni hech kimga bermang!`;

    const formData = new FormData();
    formData.append('mobile_phone', cleanPhone);
    formData.append('message', message);
    formData.append('from', ESKIZ_FROM);

    const res = await fetch(`${ESKIZ_BASE_URL}/message/sms/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (res.status === 401) {
      // Token eskirgan bo'lishi mumkin, keshni tozalab qayta urinib ko'ramiz
      cachedToken = null;
      tokenExpiresAt = 0;
      const freshToken = await getEskizToken();
      if (freshToken) {
        const retryRes = await fetch(`${ESKIZ_BASE_URL}/message/sms/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${freshToken}`,
            Accept: 'application/json',
          },
          body: formData,
        });
        if (retryRes.ok) {
          return { success: true, testMode: false };
        }
      }
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('[Eskiz.uz] SMS yuborishda xatolik:', errData);
      // Fallback
      return { success: true, testMode: true, devCode: code };
    }

    return { success: true, testMode: false };
  } catch (err) {
    console.warn('[Eskiz.uz] So\'rov xatosi, sinov kodi ishlatilmoqda:', err.message);
    return { success: true, testMode: true, devCode: code };
  }
}

export default sendEskizSms;
