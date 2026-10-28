/**
 * Netlify Function: GET/POST /api/doctor/verify-email (yoki /.netlify/functions/verify-email)
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * 32 baytlik kriptografik token yoki 6 xonali kod orqali emailni tasdiqlash.
 */

import { verifyDoctorEmail } from '../../src/services/auth/doctorAuth.service.js';

export const handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin || '*';
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    let token = '';
    let code = '';
    let email = '';

    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      token = params.token || params.verify_token || '';
      code = params.code || '';
      email = params.email || '';
    } else if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      token = body.token || body.verify_token || '';
      code = body.code || '';
      email = body.email || '';
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Faqat GET yoki POST so\'rovi qabul qilinadi' })
      };
    }

    const result = verifyDoctorEmail({ token, code, email });

    return {
      statusCode: result.status || (result.success ? 200 : 400),
      headers,
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('[Netlify Function: verify-email] Xatolik:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Tasdiqlashda server xatoligi yuz berdi."
      })
    };
  }
};
