/**
 * MedNavbat — Shifokor Bildirishnomalar Markazi Testlari
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Shifokorlar xabarlari maxfiyligi va isolyatsiyasi (Doctor isolation)
 * 2. Voqealar bo'yicha xabarlar yaratilishi (System event notifications)
 * 3. Tashqi kanallar uchun maxfiylik sanitizatsiyasi (GDPR / HIPAA)
 * 4. Tinch soatlar (Quiet Hours) mantiqi
 * 5. Telegram bot bir martalik ulanish kodi (One-time code & linking)
 * 6. Admin yetkazilgan va o'qilganlik hisoboti (Delivery & Read tracking)
 * 7. 30 kundan eski xabarlarni avtomatik arxivlash
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Node.js muhitida window/localStorage mock
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, val) {
    this.store.set(key, String(val));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MockLocalStorage();
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const {
  getDoctorNotifications,
  getDoctorUnreadCount,
  addDoctorNotification,
  markDoctorNotifRead,
  markAllDoctorNotifsRead,
  deleteDoctorNotif,
  notifyNewAppointment,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyRegistrationApproved,
  notifyRegistrationRejected,
  notifyScheduleChange,
  notifyDailyReminder,
  notifyAdminMessage,
  broadcastAdminMessage,
  getAdminMessageDeliveryStatus,
  sanitizeForExternalChannel,
  isWithinQuietHours,
  generateTelegramLinkCode,
  verifyTelegramLinkCode,
  unlinkTelegram,
  getDoctorNotifSettings,
  saveDoctorNotifSettings
} = await import('../src/services/doctorNotificationService.js');

describe('1. SHIFOKORLAR MAXFIYLIGI VA ISOLYATSIYASI', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('Shifokor A faqat o\'z xabarlarini ko\'rishi, Shifokor B xabarlarini mutlaqo ko\'rmasligi kerak', () => {
    addDoctorNotification({
      doctorId: 'doc-akmal',
      type: 'new_appointment',
      title: 'Yangi navbat',
      message: 'Ali Valiyev, 10:00'
    });

    addDoctorNotification({
      doctorId: 'doc-sherzod',
      type: 'new_appointment',
      title: 'Yangi navbat',
      message: 'Hasan Husanov, 14:00'
    });

    const akmalNotifs = getDoctorNotifications('doc-akmal');
    const sherzodNotifs = getDoctorNotifications('doc-sherzod');

    assert.equal(akmalNotifs.length, 1);
    assert.equal(akmalNotifs[0].doctor_id, 'doc-akmal');
    assert.equal(akmalNotifs[0].message.includes('Ali Valiyev'), true);

    // Sherzodning ma'lumotlari Akmalga ko'rinmasligi
    const leakToAkmal = akmalNotifs.some(n => n.message.includes('Hasan Husanov'));
    assert.equal(leakToAkmal, false, 'Xatolik: Shifokor B xabari Shifokor A ga sizib chiqdi!');

    assert.equal(sherzodNotifs.length, 1);
    assert.equal(sherzodNotifs[0].doctor_id, 'doc-sherzod');
  });

  it('O\'qilmagan xabarlar soni har bir shifokor uchun alohida hisoblanishi kerak', () => {
    addDoctorNotification({ doctorId: 'doc-1', title: 'Xabar 1' });
    addDoctorNotification({ doctorId: 'doc-1', title: 'Xabar 2' });
    addDoctorNotification({ doctorId: 'doc-2', title: 'Xabar 3' });

    assert.equal(getDoctorUnreadCount('doc-1'), 2);
    assert.equal(getDoctorUnreadCount('doc-2'), 1);

    markAllDoctorNotifsRead('doc-1');
    assert.equal(getDoctorUnreadCount('doc-1'), 0);
    assert.equal(getDoctorUnreadCount('doc-2'), 1); // doc-2 o'zgarmasligi kerak
  });
});

describe('2. VOQEALAR BO\'YICHA BILDIRISHNOMALAR YARATILISHI', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('Yangi navbat kelganda to\'g\'ri formatda xabar yaratilishi kerak', () => {
    const notif = notifyNewAppointment('doc-1', {
      id: 'app-99',
      patientName: 'Dilshod Karimov',
      date: '2026-10-30',
      timeSlot: '11:00'
    });

    assert.ok(notif);
    assert.equal(notif.type, 'new_appointment');
    assert.equal(notif.target_section, 'timeline');
    assert.equal(notif.message.includes('Dilshod Karimov'), true);
    assert.equal(notif.message.includes('11:00'), true);
  });

  it('Navbat bekor qilinganda bekor qiluvchi roli va vaqti ko\'rsatilishi kerak', () => {
    const notif = notifyAppointmentCancelled('doc-1', {
      id: 'app-100',
      date: '2026-10-30',
      timeSlot: '15:00'
    }, 'admin');

    assert.equal(notif.type, 'appointment_cancel');
    assert.equal(notif.message.includes('Admin'), true);
    assert.equal(notif.message.includes('15:00'), true);
  });

  it('Dam olish so\'rovi tasdiqlanganda va rad etilganda to\'g\'ri xabarnoma chiqishi kerak', () => {
    const approved = notifyLeaveApproved('doc-1', '2026-11-01 - 2026-11-05');
    assert.equal(approved.type, 'leave_approved');
    assert.equal(approved.target_section, 'attendance');

    const rejected = notifyLeaveRejected('doc-1', 'Xodimlar yetishmovchiligi');
    assert.equal(rejected.type, 'leave_rejected');
    assert.equal(rejected.message.includes('Xodimlar yetishmovchiligi'), true);
  });

  it('Ish jadvali va kunlik eslatma to\'g\'ri bo\'limga yo\'naltirishi kerak', () => {
    const sched = notifyScheduleChange('doc-1', 'Jadval yangilandi');
    assert.equal(sched.target_section, 'schedule');

    const daily = notifyDailyReminder('doc-1', '28-oktyabr');
    assert.equal(daily.target_section, 'attendance');
    assert.equal(daily.message.includes('ishga kelasizmi'), true);
  });
});

describe('3. TASHQI KANALLAR UCHUN MAXFIYLIK SANITIZATSIYASI', () => {
  it('Tashqi kanallarga bemorning telefon raqami yoki shikoyati chiqarilmasligi kerak', () => {
    const rawNotif = {
      id: 'n-1',
      type: 'new_appointment',
      title: 'Yangi navbat',
      message: 'Bemor: Ali Valiyev (+998901234567), Shikoyat: O\'tkir oshqozon og\'rig\'i',
      meta: {
        date: '28-oktyabr',
        timeSlot: '10:00'
      }
    };

    const sanitized = sanitizeForExternalChannel(rawNotif);

    assert.ok(sanitized.title);
    assert.ok(sanitized.body);

    // Hech qanday telefon yoki shikoyat bo'lmasligi
    assert.equal(sanitized.body.includes('+998'), false, 'Xatolik: Telefon raqami sizib chiqdi!');
    assert.equal(sanitized.body.includes('oshqozon'), false, 'Xatolik: Tashxis/shikoyat sizib chiqdi!');
    assert.equal(sanitized.body.includes('10:00'), true);
  });
});

describe('4. TINCH SOATLAR (QUIET HOURS) MANTIQI', () => {
  it('Kechasi (masalan 23:30) tinch soatlar oralig\'ida bo\'lishi kerak', () => {
    const settings = {
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00'
    };

    const nightTime = new Date('2026-10-27T23:30:00');
    assert.equal(isWithinQuietHours(settings, nightTime), true);

    const earlyMorning = new Date('2026-10-27T05:15:00');
    assert.equal(isWithinQuietHours(settings, earlyMorning), true);

    const dayTime = new Date('2026-10-27T14:00:00');
    assert.equal(isWithinQuietHours(settings, dayTime), false);
  });

  it('Tinch soatlar o\'chirilgan bo\'lsa false qaytarishi kerak', () => {
    const settings = { quietHoursEnabled: false };
    const nightTime = new Date('2026-10-27T23:30:00');
    assert.equal(isWithinQuietHours(settings, nightTime), false);
  });
});

describe('5. TELEGRAM BOT BIR MARTALIK ULANISH KODI', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('Bir martalik 6 xonali kod yaratilishi va muvaffaqiyatli bog\'lanishi kerak', () => {
    const codeData = generateTelegramLinkCode('doc-101');
    assert.ok(codeData.code);
    assert.equal(codeData.code.length, 6);
    assert.ok(codeData.deepLink.includes(codeData.code));

    const result = verifyTelegramLinkCode(codeData.code, 'dr_akbarov');
    assert.equal(result.success, true);
    assert.equal(result.doctorId, 'doc-101');
    assert.equal(result.telegramUsername, '@dr_akbarov');

    // Sozlamalarda telegram yoqilganligini tekshirish
    const settings = getDoctorNotifSettings('doc-101');
    assert.equal(settings.telegramEnabled, true);
    assert.equal(settings.telegramUsername, '@dr_akbarov');
  });

  it('Bir martalik kod ikkinchi marta ishlatilganda rad etilishi kerak', () => {
    const codeData = generateTelegramLinkCode('doc-102');
    verifyTelegramLinkCode(codeData.code, 'dr_first');

    const reuse = verifyTelegramLinkCode(codeData.code, 'dr_second');
    assert.equal(reuse.success, false);
  });

  it('Telegram botdan uzish to\'g\'ri ishlashi kerak', () => {
    const codeData = generateTelegramLinkCode('doc-103');
    verifyTelegramLinkCode(codeData.code, 'dr_alimova');

    unlinkTelegram('doc-103');
    const settings = getDoctorNotifSettings('doc-103');
    assert.equal(settings.telegramEnabled, false);
    assert.equal(settings.telegramUsername, null);
  });
});

describe('6. ADMIN YETKAZILGAN VA O\'QILGANLIK HOLATI HISOBOTI', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('Admin yuborgan xabarning kimlar tomonidan o\'qilgani to\'g\'ri hisoblanishi kerak', () => {
    const adminMsgId = 'adm-test-1';
    broadcastAdminMessage(['doc-a', 'doc-b', 'doc-c'], 'Muhim xabar', 'Eslatma', adminMsgId);

    let status = getAdminMessageDeliveryStatus(adminMsgId);
    assert.equal(status.total, 3);
    assert.equal(status.delivered, 3);
    assert.equal(status.read, 0);

    // Faqat doc-a o'qiydi
    const notifsA = getDoctorNotifications('doc-a');
    markDoctorNotifRead(notifsA[0].id, 'doc-a');

    status = getAdminMessageDeliveryStatus(adminMsgId);
    assert.equal(status.read, 1);
    assert.equal(status.readPercent, 33);
    assert.equal(status.readDoctors[0].doctorId, 'doc-a');
    assert.ok(status.readDoctors[0].readAt);
  });
});
