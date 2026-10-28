/**
 * MedNavbat — Backend API Router & Server Middleware
 * ──────────────────────────────────────────────────
 * Vite server yoki har qanday Node.js HTTP/Connect serverida ishlaydi.
 * Endpoints:
 *   - POST /api/auth/send-otp
 *   - POST /api/auth/verify-otp
 *   - GET /api/tickets/:id
 *   - GET /api/tickets/verify/:token
 *   - GET /api/countries
 *   - GET /api/countries/:iso2/regions
 *   - GET /api/doctors
 *   - GET /api/doctors/:id
 *   - GET /api/doctors/status (SSE Stream)
 */

import {
  getActiveCountriesWithDoctorStats,
  getRegionsByCountryWithStats,
  queryDoctors,
  getDoctorById
} from '../data/doctorsRepository.js';

import {
  sendOtpToUser,
  verifyUserOtp
} from '../services/auth/otp.service.js';

import {
  generateUserTicket,
  getTicketById,
  verifyTicketToken
} from '../services/auth/ticket.service.js';

import {
  authenticateUser,
  requireAuth,
  requireDoctorAuth,
  requireAdminAuth,
  SERVER_USERS
} from '../services/auth/jwtAuth.service.js';

import {
  recordAuditLog,
  getAuditLogs
} from '../services/auth/licenseVerificationService.js';

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_e) {
        resolve({});
      }
    });
  });
}

export function createApiMiddleware() {
  return async function apiMiddleware(req, res, next) {
    if (!req.url.startsWith('/api/')) {
      return next();
    }

    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams.entries());

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // ── 0. SERVER-SIDE JWT AUTH & LOGIN ENDPOINTS ─────────────────────────

    // POST /api/auth/login (universal: returns token, server-verified role & status)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const authResult = authenticateUser(body.identifier || body.email || body.phone, body.password, body.role);
      res.statusCode = authResult.status || (authResult.success ? 200 : 401);
      res.end(JSON.stringify(authResult));
      return;
    }

    // POST /api/auth/doctor/login
    if (pathname === '/api/auth/doctor/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const authResult = authenticateUser(body.identifier || body.email, body.password, 'doctor');
      res.statusCode = authResult.status || (authResult.success ? 200 : 401);
      res.end(JSON.stringify(authResult));
      return;
    }

    // POST /api/auth/admin/login
    if (pathname === '/api/auth/admin/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const authResult = authenticateUser(body.identifier || body.email, body.password, 'admin');
      res.statusCode = authResult.status || (authResult.success ? 200 : 401);
      res.end(JSON.stringify(authResult));
      return;
    }

    // GET /api/auth/me (validates Bearer token and returns server-verified role)
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const auth = requireAuth(req);
      if (!auth.authorized) {
        res.statusCode = auth.status;
        res.end(JSON.stringify({ success: false, error: auth.error }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, user: auth.user }));
      return;
    }

    // ── 0.1 PROTECTED DOCTOR ENDPOINTS (/api/doctor/*) ──────────────────────
    if (pathname.startsWith('/api/doctor/')) {
      const docAuth = requireDoctorAuth(req);
      if (!docAuth.authorized) {
        res.statusCode = docAuth.status;
        res.end(JSON.stringify({
          success: false,
          error: docAuth.error,
          doctorStatus: docAuth.doctorStatus || null
        }));
        return;
      }

      if (pathname === '/api/doctor/profile' && req.method === 'GET') {
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          profile: {
            ...docAuth.user,
            isLicenseVerified: true,
            status: 'approved'
          }
        }));
        return;
      }

      if (pathname === '/api/doctor/appointments' && req.method === 'GET') {
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          appointments: []
        }));
        return;
      }
    }

    // ── 0.2 PROTECTED ADMIN ENDPOINTS (/api/admin/*) ────────────────────────
    if (pathname.startsWith('/api/admin/')) {
      const adminAuth = requireAdminAuth(req);
      if (!adminAuth.authorized) {
        res.statusCode = adminAuth.status;
        res.end(JSON.stringify({ success: false, error: adminAuth.error }));
        return;
      }

      // GET /api/admin/pending-doctors
      if (pathname === '/api/admin/pending-doctors' && req.method === 'GET') {
        const pendingList = SERVER_USERS.filter(u => u.role === 'doctor' && (u.status === 'pending' || u.status === 'needs_review'));
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, doctors: pendingList }));
        return;
      }

      // POST /api/admin/doctors/:id/approve
      if (pathname.match(/^\/api\/admin\/doctors\/[^/]+\/approve$/) && req.method === 'POST') {
        const docId = pathname.split('/')[4];
        const body = await parseJsonBody(req);
        recordAuditLog({
          actorId: adminAuth.user.userId || 'admin',
          actorRole: 'admin',
          action: 'approve_doctor',
          resource: `doctor:${docId}`,
          details: { approvedSchedule: body.schedule || null, message: "Shifokor litsenziyasi va profili admin tomonidan tasdiqlandi." }
        });
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, message: "Shifokor arizasi muvaffaqiyatli tasdiqlandi." }));
        return;
      }

      // POST /api/admin/doctors/:id/reject
      if (pathname.match(/^\/api\/admin\/doctors\/[^/]+\/reject$/) && req.method === 'POST') {
        const docId = pathname.split('/')[4];
        const body = await parseJsonBody(req);
        recordAuditLog({
          actorId: adminAuth.user.userId || 'admin',
          actorRole: 'admin',
          action: 'reject_doctor',
          resource: `doctor:${docId}`,
          details: { reason: body.reason || "Hujjatlar talabga javob bermadi." }
        });
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, message: "Shifokor arizasi rad etildi." }));
        return;
      }

      // GET /api/admin/audit-logs
      if (pathname === '/api/admin/audit-logs' && req.method === 'GET') {
        const logs = getAuditLogs();
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, logs }));
        return;
      }
    }

    // ── AUTH & REGISTRATION ENDPOINTS ──────────────────────────────────────

    // 1. POST /api/auth/send-otp
    if (pathname === '/api/auth/send-otp' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await sendOtpToUser(body.phone, body.fullName);
      res.statusCode = result.status || (result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }


    // 2. POST /api/auth/verify-otp
    if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const verifyResult = verifyUserOtp(body.phone, body.code);
      if (!verifyResult.success) {
        res.statusCode = verifyResult.status || 400;
        res.end(JSON.stringify(verifyResult));
        return;
      }

      // Tasdiqlandi -> Yangi QR Chipta yaratish
      const ticket = generateUserTicket({
        phone: verifyResult.phone,
        fullName: body.fullName || verifyResult.fullName,
        formattedPhone: verifyResult.formattedPhone
      });

      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        user: {
          phone: verifyResult.phone,
          formattedPhone: verifyResult.formattedPhone,
          fullName: ticket.fullName,
          verifiedAt: verifyResult.verifiedAt
        },
        ticket
      }));
      return;
    }

    // 3. GET /api/tickets/verify/:token
    const ticketVerifyMatch = pathname.match(/^\/api\/tickets\/verify\/(.+)$/);
    if (ticketVerifyMatch && req.method === 'GET') {
      const token = decodeURIComponent(ticketVerifyMatch[1]);
      const result = verifyTicketToken(token);
      res.statusCode = result.isValid ? 200 : 400;
      res.end(JSON.stringify(result));
      return;
    }

    // 4. GET /api/tickets/:id
    const ticketMatch = pathname.match(/^\/api\/tickets\/([A-Za-z0-9_-]+)$/);
    if (ticketMatch && req.method === 'GET') {
      const ticketId = ticketMatch[1];
      const ticket = getTicketById(ticketId);
      if (!ticket) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Chipta topilmadi' }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify(ticket));
      return;
    }

    // ── COUNTRIES & DOCTORS ENDPOINTS ──────────────────────────────────────

    // 5. GET /api/countries
    if (pathname === '/api/countries' && req.method === 'GET') {
      const countries = getActiveCountriesWithDoctorStats();
      res.statusCode = 200;
      res.end(JSON.stringify(countries));
      return;
    }

    // 6. GET /api/countries/:iso2/regions
    const regionsMatch = pathname.match(/^\/api\/countries\/([A-Za-z0-9_-]+)\/regions$/);
    if (regionsMatch && req.method === 'GET') {
      const iso2 = regionsMatch[1];
      const regions = getRegionsByCountryWithStats(iso2);
      res.statusCode = 200;
      res.end(JSON.stringify(regions));
      return;
    }

    // 7. GET /api/doctors
    if (pathname === '/api/doctors' && req.method === 'GET') {
      const doctors = queryDoctors({
        country: query.country,
        region: query.region,
        specialty: query.specialty,
        online: query.online,
        sort: query.sort || 'rating'
      });
      res.statusCode = 200;
      res.end(JSON.stringify(doctors));
      return;
    }

    // 8. GET /api/doctors/:id
    const doctorMatch = pathname.match(/^\/api\/doctors\/([A-Za-z0-9_-]+)$/);
    if (doctorMatch && req.method === 'GET') {
      const docId = doctorMatch[1];
      const doc = getDoctorById(docId);
      if (!doc) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Shifokor topilmadi' }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify(doc));
      return;
    }

    // 9. GET /api/doctors/status (Real-time SSE Stream)
    if (pathname === '/api/doctors/status' && req.method === 'GET') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendUpdate = () => {
        const payload = JSON.stringify({
          timestamp: new Date().toISOString(),
          activeCountries: getActiveCountriesWithDoctorStats()
        });
        res.write(`data: ${payload}\n\n`);
      };

      sendUpdate();
      const interval = setInterval(sendUpdate, 30000);

      req.on('close', () => {
        clearInterval(interval);
      });
      return;
    }

    // ── SHIFOKOR REGISTRATSIYASI VA EMAIL TASDIQLASH ENDPOINTS ──────────────

    // 10. POST /api/doctor/register
    if (pathname === '/api/doctor/register' && req.method === 'POST') {
      const { registerDoctor } = await import('../services/auth/doctorAuth.service.js');
      const body = await parseJsonBody(req);
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const host = req.headers.host || 'localhost:5173';
      const appUrl = `http://${host}`;

      const result = await registerDoctor({
        ...body,
        clientIp,
        appUrl
      });
      res.statusCode = result.status || (result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    // 11. GET / POST /api/doctor/verify-email
    if (pathname === '/api/doctor/verify-email') {
      const { verifyDoctorEmail } = await import('../services/auth/doctorAuth.service.js');
      let token = query.token || query.verify_token || '';
      let code = query.code || '';
      let email = query.email || '';

      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        token = body.token || body.verify_token || token;
        code = body.code || code;
        email = body.email || email;
      }

      const result = verifyDoctorEmail({ token, code, email });
      res.statusCode = result.status || (result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    // 12. POST /api/doctor/resend-verification
    if (pathname === '/api/doctor/resend-verification' && req.method === 'POST') {
      const { resendVerificationEmail } = await import('../services/auth/doctorAuth.service.js');
      const body = await parseJsonBody(req);
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const host = req.headers.host || 'localhost:5173';
      const appUrl = `http://${host}`;

      const result = await resendVerificationEmail({
        email: body.email,
        clientIp,
        appUrl
      });
      res.statusCode = result.status || (result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    // 13. POST /api/ai/chat  (Mahalliy sinov uchun — Netlify Function'ni taqlid qiladi)
    if (pathname === '/api/ai/chat' && req.method === 'POST') {
      const ANTHROPIC_MODEL   = 'claude-opus-4-5';
      const ANTHROPIC_VERSION = '2023-06-01';
      const MAX_TOKENS        = 1500;

      const SYSTEM_PROMPT = `Sen MedNavbat tibbiy platformasining "Uy Shifokori Yordamchisi"san.

VAZIFANG:
- Bemorlar va ularning yaqinlariga sog'liq haqida tushunarli, batafsil va ishonchli ma'lumot berish.
- Simptomlarni tushuntirish, ularning mumkin bo'lgan sabablarini aytish.
- Qachon va qayerga (poliklinika, kasalxona, tez yordam) murojaat qilish kerakligini aniq ko'rsatish.
- Uy sharoitida qo'llash mumkin bo'lgan amaliy tavsiyalar berish.

MUHIM CHEKLOVLAR (hech qachon buzma):
- Aniq tibbiy tashxis QO'YMA — bu faqat tekshiruv o'tkazgan shifokor vakolati.
- Retsept yozma va dori dozasini o'z bildingizcha belgilama.
- Shoshilinch/xavfli belgilar ko'rinsa (ko'krak og'rig'i, nafas qisishi, og'ir nafas olish, hushdan ketish, insult belgilari) — DARHOL "103 — Tez Yordam"ga qo'ng'iroq qilishni tavsiya et.

TIL QOIDASI:
- Foydalanuvchi qaysi tilda yozsa (o'zbek, rus, ingliz yoki boshqa) — o'sha tilda erkin va tabiiy javob ber.

USLUB:
- Iliq, mehribon, lekin professional va aniq bo'l.
- Haddan tashqari qisqa yoki rad javoblari berma — savolga haqiqatan foydali javob ber.
- Kerak bo'lganda ro'yxat, qadamlar yoki jadval ishlat.`;

      // Auth tekshiruvi
      const authHdr = req.headers.authorization || '';
      const sessionToken = authHdr.startsWith('Bearer ') ? authHdr.slice(7).trim() : '';
      if (!sessionToken) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Avtorizatsiya talab qilinadi.' }));
        return;
      }

      // So'rov tanasi
      const body = await parseJsonBody(req);
      const messages = (body.messages || [])
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 8000) }))
        .slice(-30);

      if (!messages.length) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "messages massivi bo'sh" }));
        return;
      }

      // API kalit — .env faylidan (local dev uchun)
      // MUHIM: Bu mahalliy faqat sinov uchun. Production'da ANTHROPIC_API_KEY Netlify'da o'rnatilsin.
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
        res.statusCode = 503;
        res.end(JSON.stringify({
          error: "Local sinov: .env faylida ANTHROPIC_API_KEY o'rnating yoki Netlify'da muhit o'zgaruvchisini qo'shing."
        }));
        return;
      }

      try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: ANTHROPIC_MODEL,
            max_tokens: MAX_TOKENS,
            system: SYSTEM_PROMPT,
            messages,
            stream: true,
          }),
        });

        if (!anthropicRes.ok) {
          let errBody = {};
          try { errBody = await anthropicRes.json(); } catch {}
          res.statusCode = anthropicRes.status;
          res.end(JSON.stringify({ error: errBody.error?.message || `API xatosi: ${anthropicRes.status}` }));
          return;
        }

        const reader = anthropicRes.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                accumulated += parsed.delta.text;
              }
            } catch {}
          }
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ content: accumulated }));
      } catch (err) {
        console.error('[ai-chat middleware] Xatolik:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Serverda kutilmagan xatolik.' }));
      }
      return;
    }

    // Noma'lum endpoint
    next();
  };
}
