/**
 * MedNavbat — SMS OTP Service (Eskiz.uz + Mock)
 * ──────────────────────────────────────────────
 * SMS_MODE=mock  → Kod terminalga chiqadi (default)
 * SMS_MODE=eskiz → Haqiqiy SMS Eskiz.uz orqali yuboriladi
 */

const SMS_MODE    = process.env.SMS_MODE      || 'mock';
const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL   || '';
const ESKIZ_PASS  = process.env.ESKIZ_PASSWORD || '';
const ESKIZ_FROM  = process.env.ESKIZ_FROM    || '4546';
const ESKIZ_AUTH  = 'https://notify.eskiz.uz/api/auth/login';
const ESKIZ_SEND  = 'https://notify.eskiz.uz/api/message/sms/send';

let _eskizToken    = null;
let _tokenExpireAt = 0;

/**
 * Eskiz.uz avtorizatsiya tokenini olish (kesh bilan)
 */
async function getEskizToken() {
  if (_eskizToken && Date.now() < _tokenExpireAt) return _eskizToken;
  if (!ESKIZ_EMAIL || !ESKIZ_PASS) return null;

  try {
    const form = new FormData();
    form.append('email',    ESKIZ_EMAIL);
    form.append('password', ESKIZ_PASS);

    const res  = await fetch(ESKIZ_AUTH, { method: 'POST', body: form });
    const data = await res.json();

    if (data?.data?.token) {
      _eskizToken    = data.data.token;
      _tokenExpireAt = Date.now() + 25 * 24 * 60 * 60 * 1000; // 25 kun
      console.log('[SMS] Eskiz.uz token yangilandi ✓');
      return _eskizToken;
    }
  } catch (err) {
    console.warn('[SMS] Eskiz.uz avtorizatsiyada xatolik:', err.message);
  }
  return null;
}

/**
 * OTP SMS yuborish — asosiy funksiya
 * @param {string} phone  - tozalangan telefon (998XXXXXXXXX)
 * @param {string} code   - 6 xonali kod
 * @returns {Promise<{success:boolean, provider:string, devCode?:string, messageId?:string}>}
 */
export async function sendOtpSms(phone, code) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const message    = `MedNavbat: Tasdiqlash kodingiz: ${code}. Hech kimga bermang!`;

  // ── Eskiz.uz haqiqiy SMS ───────────────────────────────────────────────────
  if (SMS_MODE === 'eskiz') {
    const token = await getEskizToken();
    if (token) {
      try {
        const form = new FormData();
        form.append('mobile_phone', cleanPhone);
        form.append('message',      message);
        form.append('from',         ESKIZ_FROM);

        const res    = await fetch(ESKIZ_SEND, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    form
        });
        const result = await res.json();

        if (res.ok && result?.status === 'waiting') {
          console.log(`[SMS] Eskiz.uz → +${cleanPhone} ✓ (id: ${result.id})`);
          return { success: true, provider: 'eskiz.uz', messageId: result.id };
        }

        console.warn('[SMS] Eskiz.uz xatolik:', result);
      } catch (err) {
        console.warn('[SMS] Eskiz.uz yuborishda xatolik, mock rejimga o'tildi:', err.message);
      }
    } else {
      console.warn('[SMS] Eskiz.uz token yo'q — ESKIZ_EMAIL / ESKIZ_PASSWORD tekshiring.');
    }
  }

  // ── Mock / Dev rejimi ─────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(58));
  console.log(`📱 [MEDNAVBAT SMS MOCK]`);
  console.log(`   Telefon : +${cleanPhone}`);
  console.log(`   OTP Kod : \x1b[32m\x1b[1m${code}\x1b[0m`);
  console.log(`   Muddati : 5 daqiqa`);
  console.log('─'.repeat(58) + '\n');

  return {
    success:  true,
    provider: 'dev-mock',
    devCode:  code
  };
}
