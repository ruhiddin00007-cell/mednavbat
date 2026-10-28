/**
 * MedNavbat — Backend HTTP Server
 * ─────────────────────────────────
 * Ishga tushirish:
 *   cd server
 *   cp .env.example .env   ← OTP_SECRET, TICKET_SECRET, SMS_MODE to'ldiring
 *   npm install
 *   npm run dev             ← --watch rejimi (hot reload)
 *
 * Endpoints:
 *   POST /api/auth/send-otp
 *   POST /api/auth/verify-otp
 *   GET  /api/tickets/:id
 *   GET  /api/tickets/verify/:token
 *   GET  /health
 */

import 'dotenv/config';
import http from 'node:http';

import { sendOtp, verifyOtp }     from './otp.service.js';
import { generateTicket, getTicketById, verifyToken } from './ticket.service.js';
import { registerDoctor, verifyDoctorEmail, resendVerificationEmail } from '../src/services/auth/doctorAuth.service.js';

const PORT    = Number(process.env.PORT) || 3001;
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',').map(s => s.trim());

// ── Yordamchi funksiyalar ──────────────────────────────────────────────────────

/** Request body'ni JSON sifatida o'qish */
function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end',  () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve({}); }
    });
  });
}

/** JSON javob yuborish */
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/** CORS headerlarini qo'yish */
function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ORIGINS.includes(origin) || ORIGINS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods',  'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',  'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// ── HTTP Server ────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  setCors(req, res);

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const path     = url.pathname;
  const method   = req.method;

  // ── GET /health ─────────────────────────────────────────────────────────────
  if (path === '/health' && method === 'GET') {
    return json(res, 200, {
      status: 'ok',
      service: 'MedNavbat API',
      version: '1.0.0',
      smsMode: process.env.SMS_MODE || 'mock',
      timestamp: new Date().toISOString()
    });
  }

  // ── POST /api/auth/send-otp ─────────────────────────────────────────────────
  if (path === '/api/auth/send-otp' && method === 'POST') {
    const body   = await readBody(req);
    const result = await sendOtp(body.phone, body.fullName);
    return json(res, result.status || (result.success ? 200 : 400), result);
  }

  // ── POST /api/auth/verify-otp ──────────────────────────────────────────────
  if (path === '/api/auth/verify-otp' && method === 'POST') {
    const body   = await readBody(req);
    const verify = verifyOtp(body.phone, body.code);

    if (!verify.success) {
      return json(res, verify.status || 400, verify);
    }

    const ticket = generateTicket({
      phone:         verify.phone,
      fullName:      body.fullName || verify.fullName,
      formattedPhone: verify.formattedPhone
    });

    return json(res, 200, {
      success: true,
      user: {
        phone:         verify.phone,
        formattedPhone: verify.formattedPhone,
        fullName:      ticket.fullName,
        verifiedAt:    verify.verifiedAt
      },
      ticket
    });
  }

  // ── GET /api/tickets/verify/:token ────────────────────────────────────────
  const verifyMatch = path.match(/^\/api\/tickets\/verify\/(.+)$/);
  if (verifyMatch && method === 'GET') {
    const token  = decodeURIComponent(verifyMatch[1]);
    const result = verifyToken(token);
    return json(res, result.isValid ? 200 : 400, result);
  }

  // ── GET /api/tickets/:id ──────────────────────────────────────────────────
  const ticketMatch = path.match(/^\/api\/tickets\/([A-Za-z0-9_-]+)$/);
  if (ticketMatch && method === 'GET') {
    const ticket = getTicketById(ticketMatch[1]);
    if (!ticket) return json(res, 404, { error: 'Chipta topilmadi' });
    return json(res, 200, ticket);
  }

  // ── POST /api/doctor/register ──────────────────────────────────────────────
  if (path === '/api/doctor/register' && method === 'POST') {
    const body = await readBody(req);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const host = req.headers.host || `localhost:${PORT}`;
    const result = await registerDoctor({
      ...body,
      clientIp,
      appUrl: `http://${host}`
    });
    return json(res, result.status || (result.success ? 200 : 400), result);
  }

  // ── GET/POST /api/doctor/verify-email ─────────────────────────────────────
  if (path === '/api/doctor/verify-email') {
    const query = Object.fromEntries(url.searchParams.entries());
    let token = query.token || query.verify_token || '';
    let code = query.code || '';
    let email = query.email || '';

    if (method === 'POST') {
      const body = await readBody(req);
      token = body.token || body.verify_token || token;
      code = body.code || code;
      email = body.email || email;
    }

    const result = verifyDoctorEmail({ token, code, email });
    return json(res, result.status || (result.success ? 200 : 400), result);
  }

  // ── POST /api/doctor/resend-verification ──────────────────────────────────
  if (path === '/api/doctor/resend-verification' && method === 'POST') {
    const body = await readBody(req);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const host = req.headers.host || `localhost:${PORT}`;
    const result = await resendVerificationEmail({
      email: body.email,
      clientIp,
      appUrl: `http://${host}`
    });
    return json(res, result.status || (result.success ? 200 : 400), result);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── SERVER-SIDE TOKEN VA ROL VERIFIKATSIYASI (RBAC MIDDLEWARE) ─────────────
  // ════════════════════════════════════════════════════════════════════════════
  const parseAndVerifyAuthToken = (req) => {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';
    if (!authHeader) return { valid: false, error: 'Token taqdim etilmagan', status: 401 };

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (!token) return { valid: false, error: 'Token bo\'sh', status: 401 };

    // Format: Base64 payload tekshiruvi yoki Demo/JWT token
    try {
      // 1. Agar ticket / token formatida bo'lsa
      if (token.startsWith('pat-') || token.startsWith('doc-') || token.startsWith('adm-')) {
        const role = token.startsWith('pat-') ? 'patient' : token.startsWith('doc-') ? 'doctor' : 'admin';
        return { valid: true, user: { id: token, role } };
      }

      // 2. Base64 encoded JSON token (masalan { id, role, exp })
      const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
      if (decodedStr.startsWith('{') && decodedStr.endsWith('}')) {
        const payload = JSON.parse(decodedStr);
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return { valid: false, error: 'Token muddati tugagan', status: 401 };
        }
        return { valid: true, user: payload };
      }

      // 3. Fallback: Ticket token verifikatsiyasi
      const ticketRes = verifyToken(token);
      if (ticketRes && ticketRes.isValid) {
        return { valid: true, user: { id: ticketRes.ticket?.id || 'pat-ticket', role: 'patient' } };
      }

      return { valid: false, error: 'Token yaroqsiz', status: 401 };
    } catch (_err) {
      return { valid: false, error: 'Token formati noto\'g\'ri', status: 401 };
    }
  };

  // ── 1. BEMOR HIMOYALANGAN API: /api/patient/* ──────────────────────────────
  if (path.startsWith('/api/patient/')) {
    const auth = parseAndVerifyAuthToken(req);
    if (!auth.valid) {
      return json(res, auth.status || 401, { error: auth.error, code: 'UNAUTHORIZED' });
    }

    // Rol tekshiruvi: faqat patient (yoki nazorat uchun admin)
    if (auth.user.role !== 'patient' && auth.user.role !== 'admin') {
      return json(res, 403, { 
        error: 'Kirish rad etildi (403): Ushbu API faqat bemor hisoblari uchun.',
        code: 'FORBIDDEN',
        userRole: auth.user.role 
      });
    }

    if (path === '/api/patient/profile') {
      return json(res, 200, {
        success: true,
        role: 'patient',
        patientId: auth.user.id,
        profile: {
          fullName: auth.user.fullName || 'Bemor',
          phone: auth.user.phone || '+998901234567',
          verifiedAt: new Date().toISOString()
        }
      });
    }

    if (path === '/api/patient/appointments') {
      return json(res, 200, {
        success: true,
        patientId: auth.user.id,
        appointments: []
      });
    }

    return json(res, 200, { success: true, message: `Bemor API so'rovi bajarildi: ${path}` });
  }

  // ── 2. SHIFOKOR HIMOYALANGAN API: /api/doctor/* (ro'yxatdan o'tishdan tashqari) ──
  if (path.startsWith('/api/doctor/') && 
      path !== '/api/doctor/register' && 
      path !== '/api/doctor/verify-email' && 
      path !== '/api/doctor/resend-verification') {
    const auth = parseAndVerifyAuthToken(req);
    if (!auth.valid) {
      return json(res, auth.status || 401, { error: auth.error, code: 'UNAUTHORIZED' });
    }

    // Rol tekshiruvi: faqat doctor (yoki admin)
    if (auth.user.role !== 'doctor' && auth.user.role !== 'admin') {
      return json(res, 403, { 
        error: 'Kirish rad etildi (403): Shifokorlar hududiga kirish ruxsat etilmagan.',
        code: 'FORBIDDEN',
        userRole: auth.user.role 
      });
    }

    if (path === '/api/doctor/profile') {
      return json(res, 200, {
        success: true,
        role: 'doctor',
        doctorId: auth.user.id,
        status: auth.user.status || 'approved'
      });
    }

    if (path === '/api/doctor/appointments') {
      return json(res, 200, {
        success: true,
        doctorId: auth.user.id,
        appointments: []
      });
    }

    return json(res, 200, { success: true, message: `Shifokor API so'rovi bajarildi: ${path}` });
  }

  // ── 3. ADMIN HIMOYALANGAN API: /api/admin/* ────────────────────────────────
  if (path.startsWith('/api/admin/')) {
    const auth = parseAndVerifyAuthToken(req);
    if (!auth.valid) {
      return json(res, auth.status || 401, { error: auth.error, code: 'UNAUTHORIZED' });
    }

    // Rol tekshiruvi: FAQAT admin
    if (auth.user.role !== 'admin') {
      return json(res, 403, { 
        error: 'Kirish rad etildi (403): Administrator hududiga faqat tizim ma\'murlari kirishi mumkin.',
        code: 'FORBIDDEN',
        userRole: auth.user.role 
      });
    }

    if (path === '/api/admin/overview') {
      return json(res, 200, {
        success: true,
        role: 'admin',
        stats: {
          totalDoctors: 48,
          activeAppointments: 134,
          pendingApplications: 3
        }
      });
    }

    return json(res, 200, { success: true, message: `Admin API so'rovi bajarildi: ${path}` });
  }

  // ── 404 ─────────────────────────────────────────────────────────────────────
  json(res, 404, { error: `Endpoint topilmadi: ${method} ${path}` });
});

server.listen(PORT, () => {
  console.log('\n' + '═'.repeat(56));
  console.log(`🚀 MedNavbat API Server — http://localhost:${PORT}`);
  console.log(`📱 SMS rejimi : ${process.env.SMS_MODE || 'mock'}`);
  console.log(`🌐 CORS ruxsat: ${ORIGINS.join(', ')}`);
  console.log('═'.repeat(56));
  console.log('Endpoints:');
  console.log(`  POST  http://localhost:${PORT}/api/auth/send-otp`);
  console.log(`  POST  http://localhost:${PORT}/api/auth/verify-otp`);
  console.log(`  GET   http://localhost:${PORT}/api/tickets/:id`);
  console.log(`  GET   http://localhost:${PORT}/api/tickets/verify/:token`);
  console.log(`  GET   http://localhost:${PORT}/health`);
  console.log('─'.repeat(56) + '\n');
});

// Graceful shutdown
process.on('SIGINT',  () => { console.log('\n[Server] To'xtatildi.'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n[Server] To'xtatildi.'); process.exit(0); });
