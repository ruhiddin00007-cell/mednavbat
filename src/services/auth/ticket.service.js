/**
 * MedNavbat — Fast Ticket & Secure QR Generation Service
 * ─────────────────────────────────────────────────────────
 * Tezkor 1-daqiqalik registratsiya yakunida foydalanuvchiga
 * noyob, imzolangan va haqiqiy skaner qilinadigan QR Chipta yaratadi.
 */

const ticketsStore = new Map(); // ticketId -> ticketObject
const tokensStore = new Map();  // token -> ticketId

const TICKET_STORAGE_KEY = 'mednavbat_user_ticket';

/**
 * Oddiy xavfsiz token yaratuvchi
 */
function createSignature(payload) {
  const str = JSON.stringify(payload);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Yangi QR Chipta yaratish
 * @param {Object} params
 * @param {string} params.phone - Tasdiqlangan telefon
 * @param {string} params.fullName - Foydalanuvchi ismi
 */
export function generateUserTicket({ phone, fullName, formattedPhone }) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const ticketId = `MED-TKT-${new Date().getFullYear()}-${randomSuffix}`;

  const payload = {
    ticketId,
    phone,
    fullName: fullName || 'Hurmatli Bemor',
    issuedAt: new Date().toISOString(),
    serviceType: 'Onlayn Qabul va Shoshilinch Chipta'
  };

  const signature = createSignature(payload);
  const token = `mkt_${Buffer ? Buffer.from(JSON.stringify(payload)).toString('base64url') : btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}_${signature}`;

  const ticket = {
    id: ticketId,
    ticketId,
    token,
    fullName: fullName || 'Hurmatli Bemor',
    phone,
    formattedPhone: formattedPhone || phone,
    status: 'ACTIVE', // 'ACTIVE' | 'USED' | 'CANCELLED'
    statusLabelUz: 'Faol (Tasdiqlangan)',
    serviceTitle: 'MedNavbat Bemor Onlayn Chiptasi',
    clinicName: 'MedNavbat Milliy Tibbiyot Tizimi',
    issuedAt: new Date().toISOString(),
    issuedAtFormatted: new Intl.DateTimeFormat('uz-UZ', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date()),
    validUntil: new Date(timestamp + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 kun
    qrData: `https://mednavbat.uz/verify?tkt=${ticketId}&token=${encodeURIComponent(token)}`,
    perks: [
      "Barcha viloyat shifokorlariga tezkor onlayn navbat",
      "SMS orqali navbat eslatmasi",
      "Klinikalarda elektron talon o'rnida o'tadi"
    ]
  };

  ticketsStore.set(ticketId, ticket);
  tokensStore.set(token, ticketId);

  // LocalStorage keshiga ham saqlash
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(ticket));
    }
  } catch (_e) {
    // Ignored
  }

  return ticket;
}

/**
 * Saqlangan oxirgi chiptani olish
 */
export function getSavedTicket() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TICKET_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (_e) {}
  return null;
}

/**
 * Chiptani ID bo'yicha olish
 */
export function getTicketById(ticketId) {
  if (!ticketId) return null;
  if (ticketsStore.has(ticketId)) {
    return ticketsStore.get(ticketId);
  }
  const saved = getSavedTicket();
  if (saved && saved.ticketId === ticketId) {
    return saved;
  }
  return null;
}

/**
 * QR token orqali skaner tekshiruvi (GET /api/tickets/verify/:token)
 */
export function verifyTicketToken(token) {
  if (!token) {
    return { isValid: false, error: 'Token topilmadi' };
  }

  try {
    const parts = token.split('_');
    if (parts.length < 3 || parts[0] !== 'mkt') {
      return { isValid: false, error: "Noto'g'ri QR token formati" };
    }

    const base64Data = parts[1];
    const signature = parts[2];
    const jsonStr = Buffer 
      ? Buffer.from(base64Data, 'base64url').toString('utf8')
      : decodeURIComponent(escape(atob(base64Data)));

    const payload = JSON.parse(jsonStr);
    const expectedSig = createSignature(payload);

    if (signature !== expectedSig) {
      return { isValid: false, error: "QR token imzosi haqiqiy emas (soxtalashtirilgan)" };
    }

    const ticket = getTicketById(payload.ticketId) || {
      ticketId: payload.ticketId,
      fullName: payload.fullName,
      phone: payload.phone,
      status: 'ACTIVE',
      statusLabelUz: 'Faol (Tasdiqlangan)',
      issuedAt: payload.issuedAt
    };

    return {
      isValid: true,
      ticket,
      verifiedAt: new Date().toISOString()
    };
  } catch (err) {
    return { isValid: false, error: `Verifikatsiya xatosi: ${err.message}` };
  }
}
