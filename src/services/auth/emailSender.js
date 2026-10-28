/**
 * MedNavbat — Email Sender Service (Resend / Brevo)
 * ──────────────────────────────────────────────────
 * Serverless / Node.js / Vite muhitida ishlaydi.
 * API kalit FAQAT server environment variables'dan olinadi (RESEND_API_KEY yoki EMAIL_API_KEY).
 * Frontend kodida va Git'da kalitlar saqlanmaydi.
 */

// Shaxsiy ma'lumotlarni loglarda yashirish
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 
    ? `${name[0]}***${name[name.length - 1]}` 
    : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '***';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 8) return '***';
  return `${clean.slice(0, 7)}****${clean.slice(-3)}`;
}

/**
 * Resend API orqali email yuborish
 */
export async function sendEmailViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || 'MedNavbat <onboarding@resend.dev>';

  // Agar API kalit mavjud bo'lsa — haqiqiy Resend API chaqiruvi
  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_resend_api_key')) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text
        })
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = responseData?.message || responseData?.error || `Resend HTTP error ${response.status}`;
        console.error(`[EmailSender] Resend xatosi (${maskEmail(to)}):`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          code: responseData?.name || 'EMAIL_SEND_FAILED'
        };
      }

      console.log(`[EmailSender] ✅ Email muvaffaqiyatli yuborildi: ${maskEmail(to)} (ID: ${responseData?.id})`);
      return {
        success: true,
        id: responseData?.id,
        mode: 'live'
      };
    } catch (err) {
      console.error(`[EmailSender] Tarmoq xatosi:`, err.message);
      return {
        success: false,
        error: "Xabar yuborib bo'lmadi, keyinroq urinib ko'ring",
        details: err.message
      };
    }
  }

  // API kalit o'rnatilmagan bo'lsa (Dev / Local Sandbox rejimi)
  console.log(`[EmailSender - MOCK/DEV REJIM]`);
  console.log(`  To     : ${maskEmail(to)}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Izoh   : Haqiqiy yuborish uchun .env faylida RESEND_API_KEY o'rnating.`);

  return {
    success: true,
    simulated: true,
    notice: "Test rejimida bajarildi. Haqiqiy yuborish uchun RESEND_API_KEY talab qilinadi."
  };
}
