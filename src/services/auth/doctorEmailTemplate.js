/**
 * MedNavbat — Shifokor Ro'yxatdan O'tish Email Shablonlari
 * ─────────────────────────────────────────────────────────
 * To'q ko'k (#0F172A, #1E293B) va Teal (#2DD4BF, #0D9488) MedNavbat brend uslubida.
 * Responsive, toza, barcha email mijozlarida (Gmail, Apple Mail, Outlook) mukammal ko'rinadi.
 * XSS va HTML-injection'dan himoyalangan (escapeHtml).
 */

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Shifokor ro'yxatdan o'tganda yuboriladigan xabar (HTML va Plain Text)
 */
export function buildDoctorRegistrationEmail({
  fullName,
  verifyUrl,
  verificationCode,
  email,
  licenseNo,
  specialtyName
}) {
  const safeName = escapeHtml(fullName || 'Shifokor');
  const safeEmail = escapeHtml(email || '');
  const safeLicense = escapeHtml(licenseNo || '');
  const safeSpecialty = escapeHtml(specialtyName || 'Tibbiyot mutaxassisi');
  const safeUrl = escapeHtml(verifyUrl || '#');
  const safeCode = escapeHtml(verificationCode || '');

  // ── Plain Text versiyasi ──────────────────────────────────────────────────
  const text = `
Hurmatli ${safeName},

MedNavbat platformasida ro'yxatdan o'tganingiz uchun rahmat. Arizangiz qabul qilindi. Diplom va litsenziyangiz tekshirilgandan keyin profilingiz faollashtiriladi, bu haqda alohida xabar beramiz.

Email manzilingizni tasdiqlash uchun quyidagi bir martalik havoladan foydalaning (havola 24 soat amal qiladi):
${verifyUrl}

Yoki 6 xonali tasdiqlash kodi: ${verificationCode}

Arizangiz holati:
- Mutaxassislik: ${safeSpecialty}
- Diplom/Litsenziya: ${safeLicense}
- Email holati: Tasdiqlash kutilmoqda
- Profil holati: Tekshirilmoqda (Admin ko'rigida)

Sayt: https://mednavbat.uz
Aloqa: +998 71 200-00-00 | info@mednavbat.uz

Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
MedNavbat — Tibbiy Qabul va Navbat Tizimi
`.trim();

  // ── HTML versiyasi ────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedNavbat: ro'yxatdan o'tganingiz qabul qilindi</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0b1120;
      padding: 32px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
      border: 1px solid #1e293b;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px 28px;
      text-align: center;
      border-bottom: 2px solid #2dd4bf;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #0d9488, #2dd4bf);
      border-radius: 14px;
      color: #ffffff;
      font-size: 24px;
      font-weight: 900;
      margin-bottom: 12px;
      box-shadow: 0 8px 16px rgba(45, 212, 191, 0.3);
    }
    .brand-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .main-text {
      font-size: 15px;
      line-height: 1.65;
      color: #334155;
      margin-bottom: 20px;
    }
    .status-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0d9488;
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 24px;
    }
    .status-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f766e;
      margin: 0 0 10px 0;
    }
    .status-item {
      font-size: 13px;
      color: #475569;
      margin: 6px 0;
      display: flex;
      justify-content: space-between;
    }
    .status-item strong {
      color: #0f172a;
    }
    .badge-review {
      display: inline-block;
      background-color: #fef3c7;
      color: #92400e;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .verify-btn {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(13, 148, 136, 0.35);
      transition: all 0.2s ease;
    }
    .code-box {
      background-color: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 14px;
      text-align: center;
      margin: 20px 0;
    }
    .code-label {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 6px 0;
    }
    .code-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #0f172a;
      margin: 0;
    }
    .expire-notice {
      font-size: 12px;
      color: #64748b;
      text-align: center;
      margin-top: 8px;
    }
    .url-fallback {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      word-break: break-all;
      background-color: #f8fafc;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-top: 16px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 28px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .footer-links {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 10px;
    }
    .footer-links a {
      color: #0d9488;
      text-decoration: none;
      margin: 0 8px;
    }
    .disclaimer {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Header -->
      <div class="header">
        <div class="logo-badge">🩺</div>
        <h1 class="brand-title">MedNavbat</h1>
        <p class="brand-subtitle">Raqamli Tibbiyot va Navbat Platformasi</p>
      </div>

      <!-- Main Body -->
      <div class="content">
        <h2 class="greeting">Hurmatli ${safeName},</h2>
        
        <p class="main-text">
          MedNavbat platformasida ro'yxatdan o'tganingiz uchun rahmat. <strong>Arizangiz qabul qilindi.</strong> Diplom va litsenziyangiz tekshirilgandan keyin profilingiz faollashtiriladi, bu haqda alohida xabar beramiz.
        </p>

        <!-- Status Card -->
        <div class="status-card">
          <div class="status-title">Ariza ma'lumotlari:</div>
          <div class="status-item">
            <span>Mutaxassislik:</span>
            <strong>${safeSpecialty}</strong>
          </div>
          <div class="status-item">
            <span>Diplom / Litsenziya №:</span>
            <strong>${safeLicense}</strong>
          </div>
          <div class="status-item">
            <span>Email:</span>
            <strong>${safeEmail}</strong>
          </div>
          <div class="status-item">
            <span>Profil holati:</span>
            <span class="badge-review">Tekshirilmoqda</span>
          </div>
        </div>

        <p class="main-text" style="font-size: 14px; margin-bottom: 8px;">
          Iltimos, profilingizni himoya qilish va arizangizni ko'rib chiqishga topshirish uchun quyidagi tugmani bosib email manzilingizni tasdiqlang:
        </p>

        <!-- Verify Button -->
        <div class="btn-container">
          <a href="${safeUrl}" class="verify-btn" target="_blank" rel="noopener noreferrer">
            Email manzilini tasdiqlash
          </a>
          <div class="expire-notice">⏱️ Ushbu havola <strong>24 soat</strong> davomida amal qiladi.</div>
        </div>

        <!-- 6-digit Code Box -->
        <div class="code-box">
          <p class="code-label">Yoki saytda 6 xonali tasdiqlash kodini kiriting:</p>
          <p class="code-digits">${safeCode}</p>
        </div>

        <!-- Fallback Link -->
        <p class="url-fallback">
          Tugma ishlamasa, ushbu havolani brauzerga nusxalang:<br>
          <a href="${safeUrl}" style="color: #0d9488; text-decoration: underline;">${safeUrl}</a>
        </p>

      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-links">
          <a href="https://mednavbat.uz" target="_blank" rel="noopener noreferrer">mednavbat.uz</a> •
          <a href="tel:+998712000000">+998 71 200-00-00</a> •
          <a href="mailto:info@mednavbat.uz">info@mednavbat.uz</a>
        </div>
        <p class="disclaimer">
          Agar siz ushbu arizani topshirmagan bo'lsangiz yoki xatolik yuz bergan deb hisoblasangiz, bu xabarni e'tiborsiz qoldiring. Akkaunt email tasdiqlanmaguncha faollashtirilmaydi.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`.trim();

  return {
    subject: "MedNavbat: ro'yxatdan o'tganingiz qabul qilindi",
    text,
    html
  };
}
