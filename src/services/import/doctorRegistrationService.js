/**
 * MedNavbat — Doctor Registration & Admin Verification Service
 * ─────────────────────────────────────────────────────────────
 * Ushbu servis haqiqiy shifokorlarning o'z litsenziyasi bilan
 * tizimga ro'yxatdan o'tishi va admin tomonidan tekshirilib tasdiqlanishini ta'minlaydi.
 */

import { calculateTransparentDoctorScore, sanitizeDoctorPublicProfile } from '../../utils/ratingFormula';

export const PENDING_REGISTRATIONS_KEY = 'mednavbat_doctor_registrations';

/**
 * Shifokor tomonidan ariza topshirish
 */
export function submitDoctorRegistration(applicationData) {
  const {
    fullName,
    specialty,
    countryId,
    regionId,
    timeZone,
    licenseNumber,
    experienceYears,
    hospitalName,
    schedule,
    phone,
    email,
    consentGdpr
  } = applicationData;

  if (!fullName || !licenseNumber || !countryId || !specialty) {
    throw new Error("Majburiy maydonlar to'ldirilmagan: Ism, litsenziya raqami, davlat va mutaxassislik talab etiladi.");
  }

  if (!consentGdpr) {
    throw new Error("Tibbiy ma'lumotlar va maxfiylik siyosati (GDPR) shartlariga rozilik bildirilishi shart.");
  }

  const newApplication = {
    id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fullName: fullName.trim(),
    specialty,
    countryId: countryId.toUpperCase(),
    regionId: regionId || null,
    timeZone: timeZone || 'Asia/Tashkent',
    licenseNumber: licenseNumber.trim(),
    experienceYears: Number(experienceYears) || 0,
    hospitalName: hospitalName || 'Mustaqil amaliyot',
    schedule: schedule || null,
    phone: phone || '',
    email: email || '',
    consentGdpr: true,
    submittedAt: new Date().toISOString(),
    status: 'pending', // 'pending' | 'approved' | 'rejected'
    source: 'doctor_registration',
    licenseVerified: false
  };

  const existing = getPendingDoctorRegistrations();
  existing.push(newApplication);
  localStorage.setItem(PENDING_REGISTRATIONS_KEY, JSON.stringify(existing));

  return newApplication;
}

/**
 * Kutilayotgan barcha arizalarni olish (Admin panel uchun)
 */
export function getPendingDoctorRegistrations() {
  try {
    const raw = localStorage.getItem(PENDING_REGISTRATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_e) {
    return [];
  }
}

/**
 * Admin tomonidan litsenziyani tasdiqlash yoki rad etish
 */
export function reviewDoctorApplication(applicationId, { isApproved, adminNotes, adminId = 'admin-1' }) {
  const list = getPendingDoctorRegistrations();
  const index = list.findIndex(item => item.id === applicationId);

  if (index === -1) {
    throw new Error(`Ariza topilmadi: ${applicationId}`);
  }

  const app = list[index];
  app.status = isApproved ? 'approved' : 'rejected';
  app.adminNotes = adminNotes || '';
  app.reviewedAt = new Date().toISOString();
  app.reviewedBy = adminId;
  app.licenseVerified = Boolean(isApproved);

  list[index] = app;
  localStorage.setItem(PENDING_REGISTRATIONS_KEY, JSON.stringify(list));

  // Agar tasdiqlansa, rasmiy shifokorlar ro'yxatiga qo'shish uchun tayyor model
  if (isApproved) {
    const score = calculateTransparentDoctorScore({
      avgRating: 5.0,
      reviewCount: 0,
      experienceYears: app.experienceYears,
      licenseVerified: true
    });

    const approvedDoctor = sanitizeDoctorPublicProfile({
      id: `doc-${app.countryId.toLowerCase()}-${Date.now().toString(36)}`,
      fullName: app.fullName,
      name: app.fullName,
      specialty: app.specialty,
      countryId: app.countryId,
      regionId: app.regionId,
      timeZone: app.timeZone,
      licenseNumber: app.licenseNumber,
      licenseVerified: true,
      experienceYears: app.experienceYears,
      rating: score.displayRating,
      reviewCount: 0,
      schedule: app.schedule,
      onCall: false,
      manualStatus: 'auto',
      source: 'doctor_registration',
      hospitalName: app.hospitalName
    });

    return { application: app, approvedDoctor };
  }

  return { application: app, approvedDoctor: null };
}
