import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

import {
  registerDoctor,
  verifyDoctorEmail,
  resendVerificationEmail,
  hashPassword,
  verifyPassword,
  isValidEmail,
  isValidUzbekPhone,
  sha256
} from '../src/services/auth/doctorAuth.service.js';

import {
  buildDoctorRegistrationEmail,
  escapeHtml
} from '../src/services/auth/doctorEmailTemplate.js';

import {
  maskEmail,
  maskPhone
} from '../src/services/auth/emailSender.js';

describe('1. Validatsiya va Yordamchi Funksiyalar', () => {

  it('Email formatini to\'g\'ri tekshirishi kerak', () => {
    assert.strictEqual(isValidEmail('ruhiddin44@gmail.com'), true);
    assert.strictEqual(isValidEmail('doctor.akmal@mednavbat.uz'), true);
    assert.strictEqual(isValidEmail('not-an-email'), false);
    assert.strictEqual(isValidEmail('test@'), false);
    assert.strictEqual(isValidEmail('@domain.com'), false);
    assert.strictEqual(isValidEmail(''), false);
  });

  it('O\'zbekiston telefon raqamini (+998 va 9 raqam) tekshirishi kerak', () => {
    assert.strictEqual(isValidUzbekPhone('+998901234567'), true);
    assert.strictEqual(isValidUzbekPhone('+998 90 123 45 67'), true);
    assert.strictEqual(isValidUzbekPhone('998901234567'), true);
    assert.strictEqual(isValidUzbekPhone('+9989012345'), false); // kam raqam
    assert.strictEqual(isValidUzbekPhone('+79991234567'), false); // boshqa davlat
    assert.strictEqual(isValidUzbekPhone(''), false);
  });

  it('Parol xavfsiz scrypt bilan hash qilinishi va tekshirilishi kerak', () => {
    const plain = 'StrongPass123!';
    const { salt, hash } = hashPassword(plain);

    assert.ok(salt && salt.length >= 32, 'Salt kamida 16 bayt bo\'lishi kerak');
    assert.ok(hash && hash.length === 128, 'scrypt hash 64 bayt (128 hex belgi) bo\'lishi kerak');
    assert.notStrictEqual(plain, hash, 'Parol ochiq matn bo\'lmasligi kerak');

    const isMatch = verifyPassword(plain, salt, hash);
    assert.strictEqual(isMatch, true, 'To\'g\'ri parol tasdiqlanishi kerak');

    const isWrongMatch = verifyPassword('WrongPassword', salt, hash);
    assert.strictEqual(isWrongMatch, false, 'Noto\'g\'ri parol rad etilishi kerak');
  });

  it('Loglar uchun email va telefon maskalanishi kerak', () => {
    assert.strictEqual(maskEmail('ruhiddin44@gmail.com'), 'r***4@gmail.com');
    assert.strictEqual(maskPhone('+998901234567'), '+998901****567');
  });

  it('XSS va HTML Injection\'dan to\'liq escape qilinishi kerak', () => {
    const malicious = '<script>alert("xss")</script> & "quotes" \'test\'';
    const escaped = escapeHtml(malicious);
    assert.strictEqual(escaped.includes('<script>'), false);
    assert.strictEqual(escaped.includes('&lt;script&gt;'), true);
    assert.strictEqual(escaped.includes('&quot;'), true);
    assert.strictEqual(escaped.includes('&#39;'), true);
  });
});

describe('2. Email Shablonlari va Matn Talablari', () => {

  it('Email shablonida majburiy talab qilingan o\'zbekcha matn va iliq so\'zlar bo\'lishi kerak', () => {
    const emailData = buildDoctorRegistrationEmail({
      fullName: 'Akmal Sobirov',
      verifyUrl: 'https://mednavbat.uz/?verify_token=test_token_123',
      verificationCode: '482910',
      email: 'ruhiddin44@gmail.com',
      licenseNo: 'LIC-998241',
      specialtyName: 'Kardiolog'
    });

    assert.strictEqual(emailData.subject, "MedNavbat: ro'yxatdan o'tganingiz qabul qilindi");
    
    // Matn talablari:
    assert.ok(emailData.text.includes('Hurmatli Akmal Sobirov'));
    assert.ok(emailData.text.includes('MedNavbat platformasida ro\'yxatdan o\'tganingiz uchun rahmat. Arizangiz qabul qilindi. Diplom va litsenziyangiz tekshirilgandan keyin profilingiz faollashtiriladi, bu haqda alohida xabar beramiz.'));
    assert.ok(emailData.text.includes('Agar siz ro\'yxatdan o\'tmagan bo\'lsangiz, bu xabarni e\'tiborsiz qoldiring.'));
    assert.ok(emailData.text.includes('482910'));
    assert.ok(emailData.text.includes('24 soat'));

    // HTML talablari:
    assert.ok(emailData.html.includes('Hurmatli Akmal Sobirov'));
    assert.ok(emailData.html.includes('Arizangiz qabul qilindi'));
    assert.ok(emailData.html.includes('Tekshirilmoqda'));
    assert.ok(emailData.html.includes('Email manzilini tasdiqlash'));

    // MUHIM QOIDA: "profil tasdiqlandi" deb yozilmasligi kerak!
    assert.strictEqual(emailData.text.includes('profil tasdiqlandi'), false);
    assert.strictEqual(emailData.text.includes('siz shifokor sifatida tasdiqlandingiz'), false);
    assert.strictEqual(emailData.html.includes('profil tasdiqlandi'), false);
    assert.strictEqual(emailData.html.includes('siz shifokor sifatida tasdiqlandingiz'), false);
  });
});

describe('3. Shifokor Ro\'yxatdan O\'tishi va Xavfsizlik', () => {

  it('Noto\'g\'ri email kiritilganda so\'rov rad etilishi kerak', async () => {
    const result = await registerDoctor({
      fullName: 'Dr. Test',
      phone: '+998901234567',
      email: 'invalid-email-address',
      password: 'Password123!',
      licenseNo: 'LIC-001',
      clientIp: '10.0.0.1'
    });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 400);
    assert.ok(result.error.includes('email formati'));
  });

  it('Parol 8 belgidan kam bo\'lsa rad etilishi kerak', async () => {
    const result = await registerDoctor({
      fullName: 'Dr. Test',
      phone: '+998901234567',
      email: 'test_doc_short_pass@mednavbat.uz',
      password: '123',
      licenseNo: 'LIC-001',
      clientIp: '10.0.0.2'
    });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 400);
    assert.ok(result.error.includes('kamida 8 ta belgi'));
  });

  it('Honeypot to\'ldirilgan bo\'lsa (Bot) rad etilishi kerak', async () => {
    const result = await registerDoctor({
      fullName: 'Spam Bot',
      phone: '+998901234567',
      email: 'bot@spam.com',
      password: 'Password123!',
      licenseNo: 'LIC-SPAM',
      honeypot: 'http://spam-link.com', // Bot to'ldirgan
      clientIp: '10.0.0.3'
    });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 400);
    assert.ok(result.error.includes('Xavfsizlik tekshiruvidan o\'tmadi'));
  });

  it('Muvaffaqiyatli ro\'yxatdan o\'tish va token yaratilishi', async () => {
    const testEmail = `doctor_unique_${Date.now()}@mednavbat.uz`;
    const result = await registerDoctor({
      fullName: 'Dr. Akmal Sobirov',
      phone: '+998901234567',
      email: testEmail,
      password: 'StrongSecretPassword88!',
      licenseNo: 'LIC-998241',
      specialtyId: 'kardiolog',
      clientIp: '10.0.0.4'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 201);
    assert.strictEqual(result.email, testEmail.toLowerCase());
    assert.strictEqual(result.statusState, 'pending_verification');
    assert.ok(result.message.includes('Ro\'yxatdan o\'tdingiz! Emailingizni tekshiring'));
    assert.ok(result.debugToken && result.debugToken.length === 64, 'Token kamida 32 bayt (64 hex belgi) bo\'lishi kerak');
    assert.ok(result.debugCode && result.debugCode.length === 6, 'Tasdiqlash kodi 6 xonali bo\'lishi kerak');

    // 4. Takroriy email rad etilishi
    // Avval tasdiqlaymiz:
    const verifyRes = verifyDoctorEmail({ token: result.debugToken, email: testEmail });
    assert.strictEqual(verifyRes.success, true);

    // Endi xuddi shu email bilan qayta ro'yxatdan o'tishga urinamiz:
    const dupResult = await registerDoctor({
      fullName: 'Boshqa Shaxs',
      phone: '+998909876543',
      email: testEmail,
      password: 'AnotherPassword123!',
      licenseNo: 'LIC-888',
      clientIp: '10.0.0.5'
    });
    assert.strictEqual(dupResult.success, false);
    assert.strictEqual(dupResult.status, 409);
    assert.strictEqual(dupResult.error, 'Bu email allaqachon ro\'yxatdan o\'tgan');
  });
});

describe('4. Emailni Tasdiqlash (Verification), Muddati va Qayta Yuborish', () => {

  it('Token bilan tasdiqlash va bir martalik bo\'lishi', async () => {
    const testEmail = `token_test_${Date.now()}@mednavbat.uz`;
    const regRes = await registerDoctor({
      fullName: 'Dr. Nigora',
      phone: '+998901112233',
      email: testEmail,
      password: 'SafePassword999!',
      licenseNo: 'LIC-77112',
      clientIp: '10.0.0.6'
    });

    const token = regRes.debugToken;

    // 1-marta tasdiqlash -> Muvaffaqiyatli
    const verifyRes = verifyDoctorEmail({ token, email: testEmail });
    assert.strictEqual(verifyRes.success, true);
    assert.strictEqual(verifyRes.doctor.emailVerified, true);
    assert.strictEqual(verifyRes.doctor.licenseStatus, 'under_review'); // litsenziya hali admin tekshiruvida!

    // 2-marta xuddi shu tokenni ishlatish -> Rad etilishi kerak (bir martalik)
    const secondTry = verifyDoctorEmail({ token, email: testEmail });
    assert.strictEqual(secondTry.success, false);
  });

  it('6 xonali kod bilan tasdiqlash', async () => {
    const testEmail = `code_test_${Date.now()}@mednavbat.uz`;
    const regRes = await registerDoctor({
      fullName: 'Dr. Sardor',
      phone: '+998903334455',
      email: testEmail,
      password: 'SafePassword999!',
      licenseNo: 'LIC-66221',
      clientIp: '10.0.0.7'
    });

    const code = regRes.debugCode;
    const verifyRes = verifyDoctorEmail({ code, email: testEmail });
    assert.strictEqual(verifyRes.success, true);
    assert.strictEqual(verifyRes.doctor.emailVerified, true);
  });

  it('Noto\'g\'ri token bilan rad etilishi kerak', () => {
    const verifyRes = verifyDoctorEmail({ token: 'fake_non_existent_token_1234567890' });
    assert.strictEqual(verifyRes.success, false);
    assert.strictEqual(verifyRes.status, 400);
  });

  it('Qayta yuborish (Resend) 60 soniyalik cooldown tekshiruvi', async () => {
    const testEmail = `resend_test_${Date.now()}@mednavbat.uz`;
    await registerDoctor({
      fullName: 'Dr. Jamshid',
      phone: '+998904445566',
      email: testEmail,
      password: 'SafePassword999!',
      licenseNo: 'LIC-55443',
      clientIp: '10.0.0.8'
    });

    // Darhol qayta yuborish so'ralsa -> 429 xatosi va cooldown berishi kerak
    const resendRes = await resendVerificationEmail({ email: testEmail, clientIp: '10.0.0.8' });
    assert.strictEqual(resendRes.success, false);
    assert.strictEqual(resendRes.status, 429);
    assert.ok(resendRes.waitSeconds > 0);
    assert.ok(resendRes.error.includes('soniya kuting'));
  });

  it('Rate Limit: bitta IP dan 1 soatda 5 tadan oshganda bloklanishi kerak', async () => {
    const testIp = '192.168.99.99';
    for (let i = 0; i < 5; i++) {
      await registerDoctor({
        fullName: `Dr. Limit ${i}`,
        phone: `+99890123450${i}`,
        email: `limit_test_${i}_${Date.now()}@mednavbat.uz`,
        password: 'Password123!',
        licenseNo: `LIC-${i}`,
        clientIp: testIp
      });
    }

    // 6-urinish
    const blockedRes = await registerDoctor({
      fullName: 'Dr. Limit Blocked',
      phone: '+998909999999',
      email: `limit_blocked_${Date.now()}@mednavbat.uz`,
      password: 'Password123!',
      licenseNo: 'LIC-BLOCK',
      clientIp: testIp
    });

    assert.strictEqual(blockedRes.success, false);
    assert.strictEqual(blockedRes.status, 429);
    assert.ok(blockedRes.error.includes('Juda ko\'p urinishlar qilindi'));
  });
});
