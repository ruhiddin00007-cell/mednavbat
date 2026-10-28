import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateUzbekPhoneNumber,
  generateOtpCode,
  sendOtpToUser,
  verifyUserOtp
} from '../src/services/auth/otp.service.js';

import {
  generateUserTicket,
  verifyTicketToken
} from '../src/services/auth/ticket.service.js';

describe('Fast 1-Minute Registration & QR Ticket Flow Tests', () => {

  // 1. Telefon raqami validatsiyasi
  it('1. Telefon raqami validatsiyasi to‘g‘ri ishlashi kerak (+998 formati va operator kodlari)', () => {
    // To'g'ri raqamlar
    const valid1 = validateUzbekPhoneNumber('+998 90 123 45 67');
    assert.strictEqual(valid1.isValid, true);
    assert.strictEqual(valid1.cleanPhone, '+998901234567');
    assert.strictEqual(valid1.formattedPhone, '+998 (90) 123-45-67');

    const valid2 = validateUzbekPhoneNumber('998939876543');
    assert.strictEqual(valid2.isValid, true);
    assert.strictEqual(valid2.cleanPhone, '+998939876543');

    // Noto'g'ri raqamlar
    const invalidShort = validateUzbekPhoneNumber('+998 90 123');
    assert.strictEqual(invalidShort.isValid, false);
    assert.match(invalidShort.error, /9 ta raqam/);

    const invalidOperator = validateUzbekPhoneNumber('+998 12 123 45 67');
    assert.strictEqual(invalidOperator.isValid, false);
    assert.match(invalidOperator.error, /operator kodi/);
  });

  // 2. 6 xonali OTP yaratish va SMS yuborish
  it('2. OTP 6 xonali bo‘lishi, 5 daqiqa amal qilishi va SMS mock rejimida ishlashi kerak', async () => {
    const phone = '+998 90 999 88 77';
    const sendResult = await sendOtpToUser(phone, 'Dilshod Rahmatov');

    assert.strictEqual(sendResult.success, true);
    assert.strictEqual(sendResult.status, 200);
    assert.strictEqual(typeof sendResult.devCode, 'string');
    assert.strictEqual(sendResult.devCode.length, 6);
    assert.strictEqual(sendResult.expiresInSeconds, 300); // 5 daqiqa
  });

  // 3. To'g'ri kod kiritilganda tasdiqlash va Single-Use qoidasi
  it('3. To‘g‘ri kod kiritilganda tasdiqlanishi va bir marta ishlatilgach o‘chirilishi (single-use) kerak', async () => {
    const phone = '+998 94 555 44 33';
    const sendResult = await sendOtpToUser(phone, 'Shahnoza Aliyeva');
    const correctCode = sendResult.devCode;

    // 1-marta to'g'ri kod bilan tekshirish
    const verifyResult = verifyUserOtp(phone, correctCode);
    assert.strictEqual(verifyResult.success, true);
    assert.strictEqual(verifyResult.fullName, 'Shahnoza Aliyeva');

    // 2-marta o'sha kodni kiritganda xatolik (single-use)
    const secondTry = verifyUserOtp(phone, correctCode);
    assert.strictEqual(secondTry.success, false);
    assert.strictEqual(secondTry.status, 404);
  });

  // 4. Brute-force himoyasi (5 ta noto'g'ri urinishdan so'ng bloklash)
  it('4. 5 ta ketma-ket noto‘g‘ri kod kiritilganda xavfsizlik uchun vaqtincha bloklanishi kerak', async () => {
    const phone = '+998 97 111 22 33';
    await sendOtpToUser(phone, 'Sinov Foydalanuvchi');

    // 1 dan 4 gacha noto'g'ri urinish
    for (let i = 1; i <= 4; i++) {
      const res = verifyUserOtp(phone, '000000');
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.remainingAttempts, 5 - i);
    }

    // 5-noto'g'ri urinish -> Bloklash
    const blockRes = verifyUserOtp(phone, '000000');
    assert.strictEqual(blockRes.success, false);
    assert.strictEqual(blockRes.status, 403);
    assert.match(blockRes.error, /15 daqiqaga bloklandi/);
  });

  // 5. Noyob QR Chipta yaratish va Token orqali tekshirish
  it('5. Noyob QR Chipta generatsiyasi va uning imzolangan tokenini skaner tekshiruvi to‘g‘ri ishlashi kerak', () => {
    const ticket = generateUserTicket({
      phone: '+998901234567',
      fullName: 'Jasur Saidov',
      formattedPhone: '+998 (90) 123-45-67'
    });

    assert.ok(ticket.ticketId.startsWith('MED-TKT-'));
    assert.strictEqual(ticket.fullName, 'Jasur Saidov');
    assert.strictEqual(ticket.status, 'ACTIVE');
    assert.ok(ticket.token.startsWith('mkt_'));
    assert.ok(ticket.qrData.includes('https://mednavbat.uz/verify'));

    // Skaner orqali tokenni tekshirish
    const verifyResult = verifyTicketToken(ticket.token);
    assert.strictEqual(verifyResult.isValid, true);
    assert.strictEqual(verifyResult.ticket.ticketId, ticket.ticketId);
    assert.strictEqual(verifyResult.ticket.fullName, 'Jasur Saidov');

    // Soxta token tekshiruvi
    const fakeToken = ticket.token.slice(0, -4) + 'abcd';
    const fakeResult = verifyTicketToken(fakeToken);
    assert.strictEqual(fakeResult.isValid, false);
    assert.match(fakeResult.error, /haqiqiy emas/);
  });

});
