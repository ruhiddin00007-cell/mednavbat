import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { 
  validateLicenseNumberFormat, 
  checkLicenseNumberUniqueness, 
  evaluateDocumentWithAI,
  recordAuditLog,
  getAuditLogs
} from '../src/services/auth/licenseVerificationService.js';

import {
  authenticateUser,
  verifyJwtToken,
  createJwtToken,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginAttempts
} from '../src/services/auth/jwtAuth.service.js';

describe('Doctor License & AI Verification Service', () => {
  test('Litsenziya formati tekshiruvi', () => {
    assert.equal(validateLicenseNumberFormat('LN-123456').valid, true);
    assert.equal(validateLicenseNumberFormat('UZ-MED-2026-99').valid, true);
    assert.equal(validateLicenseNumberFormat('12').valid, false);
    assert.equal(validateLicenseNumberFormat('').valid, false);
  });

  test('Litsenziya takrorlanmasligi (Uniqueness)', () => {
    const existing = [
      { licenseNumber: 'LN-784920' },
      { licenseNumber: 'UZ-DOC-1122' }
    ];
    assert.equal(checkLicenseNumberUniqueness('LN-784920', existing).isUnique, false);
    assert.equal(checkLicenseNumberUniqueness('LN-999999', existing).isUnique, true);
  });

  test('AI Hujjat Tahlili va Baholash', () => {
    // 1. To'g'ri hujjat va ism
    const resGood = evaluateDocumentWithAI({
      registeredFullName: 'Akmal Rahimov',
      licenseNumber: 'LN-784920',
      licenseFileDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      passportFileDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    });

    assert.equal(typeof resGood.confidenceScore, 'number');
    assert.ok(resGood.confidenceScore >= 70);
    assert.equal(typeof resGood.isSuspicious, 'boolean');

    // 2. Ism mos kelmagan yoki soxtalashtirish shubhasi bo'lgan holat
    const resMismatch = evaluateDocumentWithAI({
      registeredFullName: 'Vali Aliyev',
      licenseNumber: 'LN-784920',
      licenseFileDataUrl: 'data:image/png;base64,bad_photoshop_sample'
    });
    assert.ok(resMismatch.reasons.length > 0);
  });

  test('Audit log yozish va olish', () => {
    const log = recordAuditLog({
      actorId: 'usr-admin-1',
      actorRole: 'admin',
      action: 'approve_doctor',
      resource: 'doctor:doc-101',
      details: { note: 'Test tasdiqlash' }
    });
    assert.equal(log.action, 'approve_doctor');
    const all = getAuditLogs();
    assert.ok(all.length > 0);
  });
});

describe('Backend JWT & Rate Limiting', () => {
  test('Token yaratish va tekshirish', () => {
    const payload = { userId: 'usr-doc-1', role: 'doctor', status: 'approved' };
    const token = createJwtToken(payload);
    assert.ok(typeof token === 'string' && token.split('.').length === 3);

    const decoded = verifyJwtToken(token);
    assert.equal(decoded.valid, true);
    assert.equal(decoded.payload.userId, 'usr-doc-1');
    assert.equal(decoded.payload.role, 'doctor');
  });

  test('Test hisoblari kirishi', () => {
    const adminRes = authenticateUser('admin@mednavbat.uz', 'MedNavbat2026!');
    assert.equal(adminRes.success, true);
    assert.equal(adminRes.user.role, 'admin');
    assert.ok(adminRes.token);

    const docRes = authenticateUser('doctor.approved@mednavbat.uz', 'MedNavbat2026!');
    assert.equal(docRes.success, true);
    assert.equal(docRes.user.role, 'doctor');
    assert.equal(docRes.user.status, 'approved');

    const wrongRes = authenticateUser('admin@mednavbat.uz', 'WrongPass!');
    assert.equal(wrongRes.success, false);
    assert.equal(wrongRes.status, 401);
  });

  test('Rate limiting ketma-ket 5 marta xato urinishda bloklaydi', () => {
    const testIp = 'test-ip-rate-limit-123';
    clearLoginAttempts(testIp);

    for (let i = 0; i < 5; i++) {
      recordFailedLoginAttempt(testIp);
    }
    const check = checkLoginRateLimit(testIp);
    assert.equal(check.allowed, false);
    assert.ok(check.error.includes('bloklandi'));
    clearLoginAttempts(testIp);
  });
});
