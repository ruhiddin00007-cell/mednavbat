import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getRegions, getHospitalsByRegion, getAllHospitals, STANDARD_TIME_SLOTS, LUNCH_BREAK } from '../src/data/medicalDataLoader.js';
import { formatUzbekPhone, isValidUzbekPhone } from '../src/utils/phoneFormatter.js';
import { bookNewAppointment, fetchOccupiedSlots, cancelExistingAppointment, getLocalAppointments, saveLocalAppointments } from '../src/services/appointmentService.js';

describe('1. 14 ta Hudud va Shifoxonalar Tuzilishi', () => {
  it('O\'zbekiston bo\'yicha aynan 14 ta hudud mavjud bo\'lishi kerak', () => {
    const regions = getRegions();
    assert.strictEqual(regions.length, 14, `Kutilgan 14 ta hudud, mavjud: ${regions.length}`);
    
    const requiredIds = [
      'tashkent_city', 'tashkent_region', 'andijan', 'bukhara', 
      'fergana', 'jizzakh', 'khorezm', 'namangan', 'navoiy', 
      'kashkadarya', 'samarkand', 'sirdaryo', 'surkhandarya', 'karakalpakstan'
    ];
    
    requiredIds.forEach(id => {
      assert.ok(regions.some(r => r.id === id), `Hudud topilmadi: ${id}`);
    });
  });

  it('Har bir hududda kamida bitta rasmiy shifoxona va uning manzili, telefoni bo\'lishi kerak', () => {
    const regions = getRegions();
    regions.forEach(r => {
      const hospitals = getHospitalsByRegion(r.id);
      assert.ok(hospitals.length >= 1, `${r.name}da shifoxona topilmadi`);
      hospitals.forEach(h => {
        assert.ok(h.name, 'Shifoxona nomi bo\'sh');
        assert.ok(h.address, 'Shifoxona manzili bo\'sh');
        assert.ok(h.phone && h.phone.startsWith('+998'), `Shifoxona telefoni +998 bilan boshlanishi kerak: ${h.phone}`);
        assert.ok(Array.isArray(h.doctors) && h.doctors.length >= 1, `Shifoxonada shifokorlar bo'lishi kerak: ${h.name}`);
      });
    });
  });

  it('Shifokor ma\'lumotlarida ism, mutaxassislik, ish kunlari va ish vaqti bo\'lishi kerak', () => {
    const allHospitals = getAllHospitals();
    allHospitals.forEach(h => {
      h.doctors.forEach(doc => {
        assert.ok(doc.id, 'Shifokor ID bo\'sh');
        assert.ok(doc.name, 'Shifokor ismi bo\'sh');
        assert.ok(doc.specialtyId, 'Shifokor mutaxassisligi bo\'sh');
        assert.ok(Array.isArray(doc.workDays) && doc.workDays.length > 0, 'Ish kunlari bo\'sh');
        assert.ok(doc.workHours, 'Ish vaqti bo\'sh');
        assert.ok(doc.lunchBreak, 'Tushlik tanaffusi ko\'rsatilishi kerak');
      });
    });
  });
});

describe('2. Telefon Raqami Formati (+998)', () => {
  it('Faqat +998 formatini qabul qilishi va to\'g\'ri formatlashi kerak', () => {
    assert.strictEqual(formatUzbekPhone('901234567'), '+998 90 123 45 67');
    assert.strictEqual(formatUzbekPhone('+998901234567'), '+998 90 123 45 67');
    assert.strictEqual(formatUzbekPhone('998939876543'), '+998 93 987 65 43');
  });

  it('Yaroqli va yaroqsiz raqamlarni aniq tekshirishi kerak', () => {
    assert.strictEqual(isValidUzbekPhone('+998 90 123 45 67'), true);
    assert.strictEqual(isValidUzbekPhone('+998 93 987 65 43'), true);
    // Boshqa davlat yoki yetarli emas
    assert.strictEqual(isValidUzbekPhone('+7 900 123 45 67'), false);
    assert.strictEqual(isValidUzbekPhone('+1 234 567 8900'), false);
    assert.strictEqual(isValidUzbekPhone('+998 90 123'), false);
  });
});

describe('3. Navbat Olish, 30-daqiqalik Slotlar va Double-booking Cheklovi', () => {
  it('Slotlar 09:00 dan 17:00 gacha 30 daqiqalik bo\'lishi va tushlik (13:00-14:00) kiritilmasligi kerak', () => {
    assert.ok(STANDARD_TIME_SLOTS.includes('09:00'));
    assert.ok(STANDARD_TIME_SLOTS.includes('09:30'));
    assert.ok(STANDARD_TIME_SLOTS.includes('10:00'));
    assert.ok(STANDARD_TIME_SLOTS.includes('12:30'));
    assert.ok(STANDARD_TIME_SLOTS.includes('14:00'));
    assert.ok(STANDARD_TIME_SLOTS.includes('17:00'));
    
    // Tushlik vaqti (13:00 va 13:30) slotlar ro'yxatida bo'lmasligi kerak
    assert.strictEqual(STANDARD_TIME_SLOTS.includes('13:00'), false);
    assert.strictEqual(STANDARD_TIME_SLOTS.includes('13:30'), false);
    assert.strictEqual(LUNCH_BREAK, '13:00 - 14:00');
  });

  it('Bitta shifokorga ayni shu sana va vaqtga ikkinchi marta navbat olinmasligi (Double-booking) kerak', async () => {
    const testDoctorId = 'doc-test-double-booking';
    const testDate = '2026-11-20';
    const testTime = '10:30';

    // 1-bemor navbat oladi
    const firstRes = await bookNewAppointment({
      doctorId: testDoctorId,
      doctorName: 'Dr. Test Shifokor',
      specialtyName: 'Kardiolog',
      hospitalName: 'Test Shifoxona',
      patientName: 'Ali Valiyev',
      patientPhone: '+998 90 111 22 33',
      date: testDate,
      timeSlot: testTime
    });

    assert.strictEqual(firstRes.success, true);
    assert.ok(firstRes.appointment.ticketCode);

    // 2-bemor aynan shu vaqtga yozilmoqchi bo'ladi
    const secondRes = await bookNewAppointment({
      doctorId: testDoctorId,
      doctorName: 'Dr. Test Shifokor',
      specialtyName: 'Kardiolog',
      hospitalName: 'Test Shifoxona',
      patientName: 'G\'ani Karimov',
      patientPhone: '+998 90 222 33 44',
      date: testDate,
      timeSlot: testTime
    });

    // Rad etilishi shart!
    assert.strictEqual(secondRes.success, false);
    assert.strictEqual(secondRes.isOccupied, true);

    // Bekor qilingandan so'ng vaqt yana bo'sh bo'lishi kerak
    await cancelExistingAppointment(firstRes.appointment.id, firstRes.appointment.ticketCode);

    // 2-bemor endi muvaffaqiyatli yoza olishi kerak
    const thirdRes = await bookNewAppointment({
      doctorId: testDoctorId,
      doctorName: 'Dr. Test Shifokor',
      specialtyName: 'Kardiolog',
      hospitalName: 'Test Shifoxona',
      patientName: 'G\'ani Karimov',
      patientPhone: '+998 90 222 33 44',
      date: testDate,
      timeSlot: testTime
    });

    assert.strictEqual(thirdRes.success, true);
  });
});
