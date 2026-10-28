/**
 * Netlify Function: POST /api/doctor/resend-verification (yoki /.netlify/functions/resend-verification)
 * ──────────────────────────────────────────────────────────────────────────────────────────────────
 * Shifokor emailiga tasdiqlash xatini qayta yuborish (60 soniyalik cooldown bilan).
 */

import { resendVerificationEmail } from '../../src/services/auth/doctorAuth.service.js';

export const handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin || '*';
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Faqat POST so\'rovi qabul qilinadi' })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const clientIp = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['client-ip'] || 
                     'unknown';

    const host = event.headers.host || '';
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const appUrl = `${protocol}://${host}`;

    const result = await resendVerificationEmail({
      email: body.email,
      clientIp,
      appUrl
    });

    return {
      statusCode: result.status || (result.success ? 200 : 400),
      headers,
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('[Netlify Function: resend-verification] Xatolik:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Qayta yuborishda server xatoligi yuz berdi."
      })
    };
  }
};
