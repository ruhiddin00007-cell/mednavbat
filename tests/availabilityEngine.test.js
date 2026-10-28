import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateDoctorAvailability,
  getLocalTimeInZone,
  timeStringToMinutes
} from '../src/utils/availabilityEngine.js';

describe('Doctor Availability Engine (Real-Time TimeZone Tests)', () => {

  // 1. Toshkent 12:00 vs Nyu-York 03:00 testi
  it('1. Toshkentda 12:00 bo‘lganda, Nyu-Yorkdagi shifokor 03:00 (offline), Toshkentdagi esa 12:00 (online) bo‘lishi kerak', () => {
    // 2026-10-05T07:00:00Z UTC vaqti:
    // Toshkent (UTC+5) da 12:00 (Dushanba)
    // Nyu-York (UTC-4, EDT) da 03:00 (Dushanba erta tong)
    const testDate = new Date('2026-10-05T07:00:00Z');

    const doctorTashkent = {
      id: 'doc-uz-1',
      fullName: 'Dr. Akmal Rahimov',
      timeZone: 'Asia/Tashkent',
      schedule: {
        mon: ['09:00', '18:00']
      },
      onCall: false,
      manualStatus: 'auto'
    };

    const doctorNewYork = {
      id: 'doc-us-1',
      fullName: 'Dr. Emily Watson',
      timeZone: 'America/New_York',
      schedule: {
        mon: ['09:00', '17:00']
      },
      onCall: false,
      manualStatus: 'auto'
    };

    const statusUz = calculateDoctorAvailability(doctorTashkent, testDate);
    const statusUs = calculateDoctorAvailability(doctorNewYork, testDate);

    // Toshkentdagi shifokor kunduzi 12:00 da ishlayotgan bo'lishi kerak
    assert.strictEqual(statusUz.isOnline, true, "Toshkentdagi shifokor 12:00 da online bo'lishi kerak");
    assert.strictEqual(statusUz.localTimeStr, '12:00');

    // Nyu-Yorkdagi shifokor erta tong 03:00 da offline bo'lishi kerak
    assert.strictEqual(statusUs.isOnline, false, "Nyu-Yorkdagi shifokor 03:00 da offline bo'lishi kerak");
    assert.strictEqual(statusUs.localTimeStr, '03:00');
    assert.match(statusUs.nextOnlineText, /online bo'ladi/);
  });

  // 2. Yarim tun testi ("24" / 24:00 va tungi o'tuvchi smena 20:00 - 04:00)
  it('2. Yarim tun ("24:00") va tuni bilan o‘tadigan smena (20:00 - 04:00) to‘g‘ri ishlashi kerak', () => {
    // 2.1 "24" yoki "24:00" gacha ishlaydigan shifokor (soat 23:30 da online)
    const doctorUntilMidnight = {
      id: 'doc-mid-1',
      timeZone: 'Asia/Tashkent',
      schedule: {
        mon: ['09:00', '24:00']
      },
      onCall: false,
      manualStatus: 'auto'
    };
    // Toshkent vaqti bilan 23:30: UTC 18:30
    const lateNightDate = new Date('2026-10-05T18:30:00Z');
    const lateStatus = calculateDoctorAvailability(doctorUntilMidnight, lateNightDate);
    assert.strictEqual(lateStatus.isOnline, true, "23:30 da '24:00' gacha bo'lgan shifokor online bo'lishi kerak");

    // 2.2 Tungi o'tuvchi smena (Dushanba 20:00 dan Seshanba 04:00 gacha)
    const doctorOvernight = {
      id: 'doc-night-1',
      timeZone: 'Asia/Tashkent',
      schedule: {
        mon: ['20:00', '04:00'],
        tue: ['20:00', '04:00']
      },
      onCall: false,
      manualStatus: 'auto'
    };

    // Seshanba 02:00 (UTC Dushanba 21:00) - smena kechagi kundan davom etmoqda
    const overnightActiveDate = new Date('2026-10-05T21:00:00Z');
    const overnightStatus = calculateDoctorAvailability(doctorOvernight, overnightActiveDate);
    assert.strictEqual(overnightStatus.isOnline, true, "Seshanba 02:00 da tungi smena online bo'lishi kerak");

    // Seshanba 05:00 (UTC 00:00) - smena 04:00 da tugagan, shuning uchun offline
    const overnightEndedDate = new Date('2026-10-06T00:00:00Z');
    const endedStatus = calculateDoctorAvailability(doctorOvernight, overnightEndedDate);
    assert.strictEqual(endedStatus.isOnline, false, "05:00 da tungi smena offline bo'lishi kerak");
  });

  // 3. Yozgi vaqtga o'tish kuni (DST switch date) testi
  it('3. Yozgi vaqtga o‘tish (DST switch) kunida vaqt to‘g‘ri hisoblanishi kerak', () => {
    // Masalan, AQShda 2026-yil 8-mart kuni DST boshlanadi (soat 02:00 dan 03:00 ga sakraydi, EDT UTC-4 ga o'tadi)
    // 2026-03-08T15:00:00Z da Nyu-Yorkda (UTC-4 bo'lgani sababli) soat 11:00 bo'ladi
    const dstDate = new Date('2026-03-08T15:00:00Z');

    const doctorNY = {
      id: 'doc-dst-1',
      timeZone: 'America/New_York',
      schedule: {
        sun: ['10:00', '14:00']
      },
      onCall: false,
      manualStatus: 'auto'
    };

    const localTime = getLocalTimeInZone(dstDate, 'America/New_York');
    assert.strictEqual(localTime.hour, 11, 'DST o‘tish kunida Nyu-York soati 11:00 bo‘lishi kerak');

    const status = calculateDoctorAvailability(doctorNY, dstDate);
    assert.strictEqual(status.isOnline, true, 'DST kunida 11:00 da 10:00-14:00 oralig‘idagi shifokor online bo‘lishi kerak');
  });

  // 4. onCall = true testi
  it('4. onCall = true bo‘lsa jadvaldan va vaqtdan qat‘i nazar har doim ONLINE bo‘lishi kerak', () => {
    const doctorOnCall = {
      id: 'doc-oncall-1',
      timeZone: 'Asia/Tashkent',
      schedule: {
        mon: ['09:00', '18:00']
      },
      onCall: true,
      manualStatus: 'auto'
    };

    // Kechasi soat 03:00 (UTC 22:00)
    const nightDate = new Date('2026-10-05T22:00:00Z');
    const status = calculateDoctorAvailability(doctorOnCall, nightDate);

    assert.strictEqual(status.isOnline, true, 'onCall=true shifokor kechasi ham online');
    assert.strictEqual(status.reason, 'on_call');
  });

  // 5. manualStatus = "offline" testi
  it('5. manualStatus = "offline" bo‘lsa jadval bo‘yicha ish vaqti bo‘lsa ham OFFLINE bo‘lishi kerak', () => {
    const doctorManualOff = {
      id: 'doc-manual-off',
      timeZone: 'Asia/Tashkent',
      schedule: {
        mon: ['09:00', '18:00']
      },
      onCall: false,
      manualStatus: 'offline'
    };

    // Kunduzi 12:00 (Toshkentda eng qizg'in ish vaqti)
    const noonDate = new Date('2026-10-05T07:00:00Z');
    const status = calculateDoctorAvailability(doctorManualOff, noonDate);

    assert.strictEqual(status.isOnline, false, 'manualStatus=offline bo‘lgan shifokor ish vaqtida ham offline bo‘ladi');
    assert.strictEqual(status.reason, 'manual_offline');
  });

});
