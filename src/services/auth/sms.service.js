/**
 * MedNavbat Frontend — SMS Service
 * ─────────────────────────────────
 * Eskiz.uz rasmiy API orqali SMS yuboradi.
 * Sinov (Test) rejimida kod brauzer konsoliga chiqadi.
 */

import { sendEskizSms } from './eskizSmsService.js';

/**
 * OTP SMS yuborish
 * @param {string} phone - Telefon raqami (+998...)
 * @param {string} code  - 6 xonali tasdiqlash kodi
 * @returns {Promise<{ success: boolean, devCode?: string, testMode?: boolean, error?: string }>}
 */
export async function sendOtpSms(phone, code) {
  return await sendEskizSms(phone, code);
}

export default sendOtpSms;
