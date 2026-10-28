/**
 * MedNavbat Server — QR Chipta Service
 * ──────────────────────────────────────
 * HMAC-like imzo bilan noyob QR chiptalar yaratadi.
 * Token: mkt_<base64payload>_<signature>
 * QR URL: https://mednavbat.uz/verify?tkt=ID&token=TOKEN
 */

// In-memory store (Production: DB ishlatish tavsiya etiladi)
const ticketsStore = new Map(); // ticketId → ticket
const tokensStore  = new Map(); // token    → ticketId

const TICKET_SECRET = process.env.TICKET_SECRET || 'mednavbat_dev_ticket_secret_change_me';
const APP_URL       = process.env.APP_URL        || 'https://mednavbat.uz';

/** HMAC-like imzo */
function sign(payload) {
  const str = TICKET_SECRET + JSON.stringify(payload);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 33) ^ str.charCodeAt(i));
  return (h >>> 0).toString(16);
}

/** Base64url encode (Node.js) */
function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/** Base64url decode */
function b64urlDec(str) {
  return JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
}

/**
 * Yangi QR Chipta yaratish
 */
export function generateTicket({ phone, fullName, formattedPhone }) {
  const suffix   = Math.random().toString(36).slice(2, 7).toUpperCase();
  const year     = new Date().getFullYear();
  const ticketId = `MED-TKT-${year}-${suffix}`;

  const payload = {
    ticketId,
    phone,
    fullName: fullName || 'Hurmatli Bemor',
    issuedAt: new Date().toISOString(),
    serviceType: 'Onlayn Qabul va Shoshilinch Chipta'
  };

  const signature = sign(payload);
  const token     = `mkt_${b64url(payload)}_${signature}`;
  const qrData    = `${APP_URL}/verify?tkt=${ticketId}&token=${encodeURIComponent(token)}`;

  const ticket = {
    id:              ticketId,
    ticketId,
    token,
    fullName:        payload.fullName,
    phone,
    formattedPhone:  formattedPhone || phone,
    status:          'ACTIVE',
    statusLabelUz:   'Faol (Tasdiqlangan)',
    serviceTitle:    'MedNavbat Bemor Onlayn Chiptasi',
    clinicName:      'MedNavbat Milliy Tibbiyot Tizimi',
    issuedAt:        payload.issuedAt,
    issuedAtFormatted: new Intl.DateTimeFormat('uz-UZ', {
      dateStyle: 'medium', timeStyle: 'short'
    }).format(new Date()),
    validUntil:      new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    qrData,
    perks: [
      "Barcha viloyat shifokorlariga tezkor onlayn navbat",
      "SMS orqali navbat eslatmasi",
      "Klinikalarda elektron talon o'rnida o'tadi"
    ]
  };

  ticketsStore.set(ticketId, ticket);
  tokensStore.set(token,    ticketId);

  console.log(`[Ticket] Yangi chipta yaratildi: ${ticketId} — ${ticket.fullName}`);
  return ticket;
}

/**
 * ID bo'yicha chiptani olish
 */
export function getTicketById(id) {
  return ticketsStore.get(id) || null;
}

/**
 * QR token orqali tekshirish (klinikada skanerlanganda)
 */
export function verifyToken(token) {
  if (!token) return { isValid: false, error: 'Token yo'q' };

  try {
    const parts = token.split('_');
    if (parts.length < 3 || parts[0] !== 'mkt') {
      return { isValid: false, error: "Noto'g'ri token formati" };
    }

    const payload   = b64urlDec(parts[1]);
    const signature = parts[2];

    if (sign(payload) !== signature) {
      return { isValid: false, error: 'Token imzosi haqiqiy emas (soxtalashtirilgan)' };
    }

    const ticket = getTicketById(payload.ticketId) || {
      ticketId:     payload.ticketId,
      fullName:     payload.fullName,
      phone:        payload.phone,
      status:       'ACTIVE',
      statusLabelUz:'Faol (Tasdiqlangan)',
      issuedAt:     payload.issuedAt
    };

    return { isValid: true, ticket, verifiedAt: new Date().toISOString() };
  } catch (err) {
    return { isValid: false, error: `Verifikatsiya xatosi: ${err.message}` };
  }
}
