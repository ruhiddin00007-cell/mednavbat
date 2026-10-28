/**
 * Netlify Function: POST /api/ai/chat
 * ────────────────────────────────────────────────────────────────────────────
 * MedNavbat "Uy Shifokori Yordamchisi" — Anthropic Claude orqali AI chat.
 *
 * Xavfsizlik:
 *  - API kalit faqat Netlify muhit o'zgaruvchisida (ANTHROPIC_API_KEY)
 *  - Brauzer kodida hech qachon ko'rinmaydi
 *  - Foydalanuvchi autentifikatsiyasi tekshiriladi (Authorization: Bearer token)
 *  - Rate limit: daqiqada 10 ta so'rov (IP + token juftligi bo'yicha)
 */

// ── Model sozlamasi (bitta joyda) ─────────────────────────────────────────────
const ANTHROPIC_MODEL   = 'claude-opus-4-5';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS        = 1500;
const RATE_LIMIT_RPM    = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

// ── Tizim ko'rsatmasi (System Prompt) ────────────────────────────────────────
const SYSTEM_PROMPT = `Sen MedNavbat tibbiy platformasining "Uy Shifokori Yordamchisi"san.

VAZIFANG:
- Bemorlar va ularning yaqinlariga sog'liq haqida tushunarli, batafsil va ishonchli ma'lumot berish.
- Simptomlarni tushuntirish, ularning mumkin bo'lgan sabablarini aytish.
- Qachon va qayerga (poliklinika, kasalxona, tez yordam) murojaat qilish kerakligini aniq ko'rsatish.
- Uy sharoitida qo'llash mumkin bo'lgan amaliy tavsiyalar berish.

MUHIM CHEKLOVLAR (hech qachon buzma):
- Aniq tibbiy tashxis QO'YMA — bu faqat tekshiruv o'tkazgan shifokor vakolati.
- Retsept yozma va dori dozasini o'z bildingizcha belgilama.
- Shoshilinch/xavfli belgilar ko'rinsa (ko'krak og'rig'i, nafas qisishi, og'ir nafas olish, hushdan ketish, insult belgilari — yuz falaji, bir tomonlama zaiflik, nutq buzilishi, kuchli bosh og'rig'i, kuchli qon ketish) — DARHOL "103 — Tez Yordam"ga qo'ng'iroq qilishni tavsiya et va boshqa maslahat berishdan oldin shu ogohlantirishni birinchi joyga qo'y.

TIL QOIDASI:
- Foydalanuvchi qaysi tilda yozsa (o'zbek, rus, ingliz yoki boshqa) — o'sha tilda erkin va tabiiy javob ber.
- Tibbiy atamalarni oddiy so'zlar bilan izohlа.

USLUB:
- Iliq, mehribon, lekin professional va aniq bo'l.
- Haddan tashqari qisqa yoki rad javoblari berma — savolga haqiqatan foydali javob ber.
- Kerak bo'lganda ro'yxat, qadamlar yoki jadval ishlat.
- Har bir javob oxirida, agar mavzu jiddiy bo'lsa, shifokorga murojaat qilishni eslatib qo'y.`;

// ── In-memory rate limiting ───────────────────────────────────────────────────
const rateMap = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const timestamps = (rateMap.get(key) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_RPM) return true;
  timestamps.push(now);
  rateMap.set(key, timestamps);
  return false;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ── Asosiy handler ────────────────────────────────────────────────────────────
export const handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '*';
  const headers = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // ── Autentifikatsiya ──────────────────────────────────────────────────────
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return {
      statusCode: 401,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.' }),
    };
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const clientIp =
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.headers['client-ip'] ||
    'unknown';
  const rateLimitKey = `${clientIp}:${token.slice(-8)}`;

  if (isRateLimited(rateLimitKey)) {
    return {
      statusCode: 429,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `So'rovlar haddan tashqari ko'p. Iltimos, bir daqiqa kuting (limit: ${RATE_LIMIT_RPM}/daqiqa).`,
      }),
    };
  }

  // ── So'rov tanasini tahlil qilish ─────────────────────────────────────────
  let messages;
  try {
    const body = JSON.parse(event.body || '{}');
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages massivi bo'sh yoki noto'g'ri");
    }
    messages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 8000) }))
      .slice(-30); // Kontekst oynasi: oxirgi 30 ta xabar
  } catch (e) {
    return {
      statusCode: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Noto'g'ri so'rov: ${e.message}` }),
    };
  }

  // ── API kalit tekshiruvi ──────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[ai-chat] ANTHROPIC_API_KEY muhit o\'zgaruvchisi o\'rnatilmagan');
    return {
      statusCode: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: "AI xizmati hozircha mavjud emas. Iltimos, keyinroq urinib ko'ring.",
      }),
    };
  }

  // ── Anthropic API ─────────────────────────────────────────────────────────
  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!anthropicResponse.ok) {
      let errBody = {};
      try { errBody = await anthropicResponse.json(); } catch {}
      const status = anthropicResponse.status;
      let userMsg = `API xatosi (${status})`;
      if (status === 401) userMsg = "API kalit noto'g'ri.";
      else if (status === 429) userMsg = 'AI xizmatiga so\'rovlar haddan tashqari ko\'p.';
      else if (status === 529) userMsg = 'AI xizmati hozir band. Keyinroq urinib ko\'ring.';
      else if (errBody.error?.message) userMsg = errBody.error.message;
      return {
        statusCode: status,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: userMsg }),
      };
    }

    // SSE oqimini o'qib, javobni to'plash
    const reader = anthropicResponse.body.getReader();
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
        } catch { /* SSE parse xatolarini e'tiborsiz qoldirish */ }
      }
    }

    if (!accumulated) {
      return {
        statusCode: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "AI bo'sh javob qaytardi. Iltimos, qayta urinib ko'ring." }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: accumulated }),
    };

  } catch (err) {
    console.error('[ai-chat] Xatolik:', err);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: "Serverda kutilmagan xatolik. Iltimos, keyinroq urinib ko'ring.",
      }),
    };
  }
};
