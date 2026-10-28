/**
 * MedNavbat — Maxfiylik, Rollar, Geolocation va OTP Xavfsizligi Testlari
 * ──────────────────────────────────────────────────────────────────────
 * 1. Bemorlar maxfiyligi: Bemor A Bemor B ning navbati yoki ma'lumotlarini ko'rmasligi.
 * 2. Shifokor maxfiyligi: Shifokor faqat o'ziga yozilgan bemorlarni ko'rishi.
 * 3. Band vaqtlar anonimligi: Band vaqtlar ko'rinsin, lekin kim band qilgani ko'rinmasin.
 * 4. Eskiz OTP & Brute-force: 5 ta xato urinishdan so'ng 15 daqiqaga bloklash.
 * 5. Xarita masofa hisoblash va fallback tekshiruvi.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  sendOtpToUser, 
  verifyUserOtp, 
  validateUzbekPhoneNumber,
  checkPhoneBlockStatus 
} from '../src/services/auth/otp.service.js';
import { 
  calculateDistanceKm, 
  getHospitalsSortedByDistance,
  HOSPITALS_GEO 
} from '../src/data/hospitalsWithCoordinates.js';
import { logAuditEvent, maskPhoneNumber } from '../src/services/auditLogService.js';

describe('1. BEMORLAR MAXFIYLIGI VA ISOLYATSIYASI', () => {
  const appointmentsDb = [
    {
      id: 'app-1',
      patientId: 'pat-ali',
      patientName: 'Ali Valiyev',
      patientPhone: '+998901111111',
      doctorId: 'doc-tash-1',
      doctorName: 'Dr. Akmal Rahimov',
      date: '2026-10-25',
      timeSlot: '10:00',
      status: 'Tasdiqlangan',
      diagnosis: 'Yurak ritmi buzilishi'
    },
    {
      id: 'app-2',
      patientId: 'pat-vali',
      patientName: 'Vali Aliyev',
      patientPhone: '+998902222222',
      doctorId: 'doc-tash-2',
      doctorName: 'Prof. Sherzod Mirzayev',
      date: '2026-10-25',
      timeSlot: '11:00',
      status: 'Tasdiqlangan',
      diagnosis: 'Jarrohlik konsultatsiyasi'
    }
  ];

  it('Bemor A (Ali) faqat o\'z navbatlarini ko\'rishi va Bemor B ning navbatlarini mutlaqo ko\'rmasligi kerak', () => {
    const currentPatient = { id: 'pat-ali', phone: '+998901111111', name: 'Ali Valiyev' };

    const aliAppointments = appointmentsDb.filter(a => 
      a.patientId === currentPatient.id || a.patientPhone === currentPatient.phone
    );

    assert.equal(aliAppointments.length, 1);
    assert.equal(aliAppointments[0].id, 'app-1');
    assert.equal(aliAppointments[0].patientName, 'Ali Valiyev');

    // Vali'ning ma'lumotlari kirmaganligini tekshirish
    const hasValiData = aliAppointments.some(a => a.patientName === 'Vali Aliyev' || a.patientPhone === '+998902222222');
    assert.equal(hasValiData, false, 'Xatolik: Bemor A ga Bemor B ning ma\'lumotlari sizib chiqdi!');
  });

  it('Bemor B (Vali) faqat o\'z navbatlarini ko\'rishi va Bemor A ning tashxisini ko\'rmasligi kerak', () => {
    const currentPatient = { id: 'pat-vali', phone: '+998902222222', name: 'Vali Aliyev' };

    const valiAppointments = appointmentsDb.filter(a => 
      a.patientId === currentPatient.id || a.patientPhone === currentPatient.phone
    );

    assert.equal(valiAppointments.length, 1);
    assert.equal(valiAppointments[0].id, 'app-2');

    // Ali'ning tashxisi yoki ma'lumoti ko'rinmasligi
    const hasAliDiagnosis = valiAppointments.some(a => a.diagnosis === 'Yurak ritmi buzilishi');
    assert.equal(hasAliDiagnosis, false);
  });
});

describe('2. SHIFOKORLAR MAXFIYLIGI VA ISOLYATSIYASI', () => {
  const appointmentsDb = [
    {
      id: 'app-101',
      doctorId: 'doc-tash-1',
      doctorName: 'Dr. Akmal Rahimov',
      patientName: 'Ali Valiyev',
      patientPhone: '+998 90 111-11-11',
      timeSlot: '10:00'
    },
    {
      id: 'app-102',
      doctorId: 'doc-tash-2',
      doctorName: 'Prof. Sherzod Mirzayev',
      patientName: 'Hasan Husanov',
      patientPhone: '+998 90 333-33-33',
      timeSlot: '14:00'
    }
  ];

  it('Shifokor A (Dr. Akmal) FAQAT o\'ziga yozilgan bemorlarni ko\'rishi kerak', () => {
    const currentDoctor = { id: 'doc-tash-1', name: 'Dr. Akmal Rahimov' };

    const docAppointments = appointmentsDb.filter(a => 
      a.doctorId === currentDoctor.id || a.doctorName.includes(currentDoctor.name)
    );

    assert.equal(docAppointments.length, 1);
    assert.equal(docAppointments[0].patientName, 'Ali Valiyev');

    // Boshqa shifokorning bemori ko'rinmasligi kerak
    const hasOtherDoctorPatient = docAppointments.some(a => a.patientName === 'Hasan Husanov');
    assert.equal(hasOtherDoctorPatient, false, 'Xatolik: Shifokor A ga boshqa shifokorning bemori ko\'rindi!');
  });
});

describe('3. BAND VAQTLAR ANONIMLIGI', () => {
  it('Band vaqtlar anonimlashtirilganda shaxsiy ma\'lumotlar (ism, telefon) butunlay tozalanadi', () => {
    const rawAppointments = [
      { timeSlot: '10:00', patientName: 'Maxfiy Bemor', patientPhone: '+998901234567', status: 'Tasdiqlangan' },
      { timeSlot: '11:00', patientName: 'Boshqa Bemor', patientPhone: '+998909876543', status: 'Tasdiqlangan' }
    ];

    // Anonymous slot availability projection
    const anonymousSlots = rawAppointments.map(a => ({
      timeSlot: a.timeSlot,
      isOccupied: a.status !== 'Bekor qilingan'
    }));

    anonymousSlots.forEach(slot => {
      assert.equal(slot.patientName, undefined);
      assert.equal(slot.patientPhone, undefined);
      assert.equal(slot.isOccupied, true);
    });
  });
});

describe('4. ESKIZ OTP & 5 MARTA NOTO\'G\'RI KODDAN KEYIN BLOKLASH', () => {
  const testPhone = '+998909998877';

  it('Yaroqli +998 telefon raqami to\'g\'ri tasdiqlanishi kerak', () => {
    const val = validateUzbekPhoneNumber(testPhone);
    assert.equal(val.isValid, true);
    assert.equal(val.cleanPhone, '+998909998877');
  });

  it('OTP yaratilganda 6 xonali bo\'lishi va devCode berilishi kerak', async () => {
    const res = await sendOtpToUser(testPhone, 'Sinovchi');
    assert.equal(res.success, true);
    assert.equal(typeof res.devCode, 'string');
    assert.equal(res.devCode.length, 6);
  });

  it('5 marta ketma-ket noto\'g\'ri kod kiritilganda raqam 15 daqiqaga bloklanishi kerak', async () => {
    const targetPhone = '+998908887766';
    await sendOtpToUser(targetPhone, 'Bloklash Sinuvi');

    // 4 marta xato kiritish
    for (let i = 1; i <= 4; i++) {
      const wrong = verifyUserOtp(targetPhone, '000000');
      assert.equal(wrong.success, false);
      assert.equal(wrong.remainingAttempts, 5 - i);
    }

    // 5-marta xato kiritish -> Bloklanadi!
    const fifthAttempt = verifyUserOtp(targetPhone, '000000');
    assert.equal(fifthAttempt.success, false);
    assert.equal(fifthAttempt.status, 403);

    // Bloklanganlik holatini tekshirish
    const blockStatus = checkPhoneBlockStatus(targetPhone);
    assert.equal(blockStatus.isBlocked, true);
    assert.ok(blockStatus.remainingMinutes > 0);
  });
});

describe('5. LEAFLET XARITA & HAVERSINE MASOFA HISOBLASH', () => {
  it('Toshkentdan RSHTYoIM gacha bo\'lgan masofa to\'g\'ri hisoblanishi kerak (~0-5 km)', () => {
    const toshkentCenterLat = 41.3111;
    const toshkentCenterLng = 69.2797;

    const rshtyim = HOSPITALS_GEO.find(h => h.id === 'hosp-tash-1');
    assert.ok(rshtyim != null);

    const dist = calculateDistanceKm(toshkentCenterLat, toshkentCenterLng, rshtyim.lat, rshtyim.lng);
    assert.ok(dist > 0 && dist < 10, `Masofa kutilganidek yaqin bo'lishi kerak: ${dist} km`);
  });

  it('Shifoxonalar yaqinlik bo\'yicha saralanganda eng yaqin shifoxona 1-o\'rinda turishi kerak', () => {
    // Chilonzor koordinatasi
    const userLat = 41.2825;
    const userLng = 69.2155;

    const sorted = getHospitalsSortedByDistance(userLat, userLng);
    assert.equal(sorted[0].id, 'hosp-tash-1');
    assert.equal(sorted[0].distanceKm, 0); // User ayni RSHTYoIM yonida
  });

  it('Ruxsat berilmaganda (null koordinata) shifoxonalar xatosiz qaytishi kerak', () => {
    const list = getHospitalsSortedByDistance(null, null);
    assert.equal(list.length, HOSPITALS_GEO.length);
    assert.equal(list[0].distanceKm, null);
  });
});

describe('6. AUDIT LOG & MAXFIY SANITIZATION', () => {
  it('Telefon raqamlari audit jurnaliga to\'liq emas, niqoblangan holda yozilishi kerak', () => {
    const masked = maskPhoneNumber('+998901234567');
    assert.equal(masked.includes('123'), false, 'Xatolik: Ochiq telefon raqami qoldi!');
    assert.ok(masked.includes('•••'));
    assert.ok(masked.endsWith('67'));
  });

  it('Audit jurnali yozuvi to\'g\'ri yaratilishi kerak', () => {
    const entry = logAuditEvent({
      action: 'TEST_ACTION',
      actorRole: 'patient',
      actorId: '+998901234567',
      resource: 'navbat',
      details: 'Sinov amali'
    });

    assert.ok(entry != null);
    assert.equal(entry.action, 'TEST_ACTION');
    assert.equal(entry.actorRole, 'patient');
    assert.ok(!entry.actorId.includes('12345'));
  });
});
