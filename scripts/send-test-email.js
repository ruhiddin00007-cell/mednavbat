/**
 * MedNavbat — Haqiqiy Emailga Sinov Yuborish Skripti
 * ──────────────────────────────────────────────────
 * Foydalanish:
 *   node scripts/send-test-email.js
 * yoki API kalit bilan:
 *   RESEND_API_KEY=re_xxxx node scripts/send-test-email.js
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// .env faylini o'qish (agar mavjud bo'lsa)
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length > 0) {
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

import { buildDoctorRegistrationEmail } from '../src/services/auth/doctorEmailTemplate.js';
import { sendEmailViaResend, maskEmail } from '../src/services/auth/emailSender.js';

const targetEmail = process.env.TEST_EMAIL || 'ruhiddin44@gmail.com';
const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;

console.log('═'.repeat(60));
console.log('📧 MEDNAVBAT SHIFOKOR EMAIL YUBORISH TESTI');
console.log('═'.repeat(60));
console.log(`🎯 Qabul qiluvchi : ${targetEmail}`);
console.log(`🔑 API Kalit      : ${apiKey ? (apiKey.slice(0, 6) + '...' + apiKey.slice(-4)) : '⚠️ O\'rnatilmagan (Mock/Sandbox rejimi)'}`);
console.log('─'.repeat(60));

const rawToken = crypto.randomBytes(32).toString('hex');
const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
const appUrl = (process.env.APP_URL || 'https://mednavbat.uz').replace(/\/$/, '');
const verifyUrl = `${appUrl}/?verify_token=${rawToken}&email=${encodeURIComponent(targetEmail)}`;

const { subject, html, text } = buildDoctorRegistrationEmail({
  fullName: 'Dr. Ruhiddin (Sinov Rejimi)',
  verifyUrl,
  verificationCode,
  email: targetEmail,
  licenseNo: 'LIC-UZ-998412',
  specialtyName: 'Kardiolog (Oliy toifali)'
});

console.log(`\n📨 Yuborilayotgan xat tafsilotlari:`);
console.log(`  Mavzu: "${subject}"`);
console.log(`  Tasdiqlash kodi: ${verificationCode}`);
console.log(`  Havola: ${verifyUrl.slice(0, 50)}...`);

console.log('\n🚀 Xabar yuborilmoqda...');

const result = await sendEmailViaResend({
  to: targetEmail,
  subject,
  html,
  text
});

console.log('─'.repeat(60));
if (result.success) {
  if (result.mode === 'live') {
    console.log(`✅ MUVAFFAQIShIYATLI YUBORILDI!`);
    console.log(`  Resend Email ID : ${result.id}`);
    console.log(`  Holati          : Qabul qiluvchiga yetkazildi`);
    console.log(`\n👉 ${targetEmail} pochtangizni (va agar ko'rinmasa Spam papkasini) tekshiring!`);
  } else {
    console.log(`ℹ️ SIMULYATSIYA REJIMI BAJARILDI (API kalit hali kiritilmagan):`);
    console.log(`  Email shabloni, token (32 bayt), 6 xonali kod va HTML/Text dizayn 100% tayyor.`);
    console.log(`  Haqiqiy xat pochtangizga kelishi uchun:`);
    console.log(`  1. https://resend.com ga kiring va bepul API key oling (re_...)`);
    console.log(`  2. .env fayliga yoki Netlify environment variables'ga qo'shing:`);
    console.log(`     RESEND_API_KEY=re_sizning_kalitingiz`);
    console.log(`  3. Qayta ishga tushiring: node scripts/send-test-email.js`);
  }
} else {
  console.error(`❌ Xatolik yuz berdi:`, result.error);
  if (result.details) console.error(`  Tafsilot:`, result.details);
}
console.log('═'.repeat(60) + '\n');
