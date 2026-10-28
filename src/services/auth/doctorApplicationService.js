/**
 * MedNavbat — Shifokor Arizalari va Tasdiqlash Servisi (doctorApplicationService.js)
 * ───────────────────────────────────────────────────────────────────────────────
 * 1. Yangi shifokor ro'yxatdan o'tishi va arizalarni saqlash
 * 2. Takroriy telefon va emailni rad etish
 * 3. Rate limiting va Honeypot (bot) tekshiruvi
 * 4. Hujjatlar va parollar xavfsizligi
 * 5. Admin tasdiqlashi (Approve) va rad etishi (Reject sababi bilan)
 * 6. Shifokorning arizani tuzatib qayta topshirishi (Resubmit)
 * 7. Audit jurnali va xabarnomalar integratsiyasi
 */

import { hashPasswordClient, sanitizeFileName, validateUploadedFile } from './cryptoHelper.js';
import { logAuditEvent, maskPhoneNumber } from '../auditLogService.js';
import { addNotification } from '../notificationService.js';
import { sendOtpToUser, validateUzbekPhoneNumber } from './otp.service.js';
import { sendEmailViaResend, maskEmail } from './emailSender.js';
import { 
  validateLicenseNumberFormat, 
  checkLicenseNumberUniqueness, 
  evaluateDocumentWithAI, 
  recordAuditLog 
} from './licenseVerificationService.js';

const APPLICATIONS_STORAGE_KEY = 'mednavbat_doctor_applications';

// Rate Limiting (Maksimal 5 ta urinish soatiga)
const registrationRateLimit = new Map(); // key -> timestamps array

function checkRateLimit(key, maxLimit = 5, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const attempts = (registrationRateLimit.get(key) || []).filter(ts => now - ts < windowMs);
  if (attempts.length >= maxLimit) {
    return false;
  }
  attempts.push(now);
  registrationRateLimit.set(key, attempts);
  return true;
}

/**
 * Barcha shifokor arizalarini olish
 */
export function getStoredDoctorApplications() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_e) {
    // Storage xatosi
  }
  return [];
}

/**
 * Arizalarni xotiraga saqlash
 */
export function saveStoredDoctorApplications(apps) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
    window.dispatchEvent(new CustomEvent('mednavbat_doctor_applications_changed', { detail: apps }));
  } catch (_e) {
    // Ignored
  }
}

/**
 * Yangi shifokor arizasini topshirish (Ro'yxatdan o'tish)
 */
export async function submitDoctorRegistrationApplication({
  firstName,
  lastName,
  middleName = '',
  birthDate,
  phone,
  phoneVerified = false,
  email,
  specialtyId,
  specialtyName,
  experienceYears = 0,
  diplomaNumber,
  licenseNumber,
  licenseExpiry,
  // Shifokor turi va ish joylari
  practiceType = 'hospital', // 'hospital' | 'private_practice' | 'both'
  hospitalName = '',
  hospitalRegion = '',
  hospitalAddress = '',
  hospitalScheduleDays = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
  hospitalAvailableSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  // Xususiy kabinet ma'lumotlari
  privateCabinet = null,
  workplaces = [],
  privateLicenseNumber = '',
  privateLicenseFile = null,
  diplomaFile,
  licenseFile,
  passportFile = null,
  avatarFile = null,
  password,
  confirmPassword,
  consentPersonalData,
  consentTerms,
  honeypot = '',
  clientIp = '127.0.0.1'
}, existingDoctors = []) {
  // 1. Bot himoyasi (Honeypot)
  if (honeypot && honeypot.trim() !== '') {
    return {
      success: false,
      status: 400,
      error: "Xavfsizlik tekshiruvidan o'tmadi (Bot aniqlandi)."
    };
  }

  // 2. Majburiy maydonlar tekshiruvi
  if (!firstName?.trim() || !lastName?.trim()) {
    return { success: false, status: 400, error: "Ism va familiyangizni to'liq kiriting." };
  }
  if (!birthDate) {
    return { success: false, status: 400, error: "Tug'ilgan sanangizni tanlang." };
  }
  if (!phone?.trim()) {
    return { success: false, status: 400, error: "Telefon raqamingizni kiriting." };
  }
  if (!phoneVerified) {
    return { success: false, status: 400, error: "Telefon raqamingizni SMS tasdiqlash kodi bilan tasdiqlang." };
  }
  if (!email?.trim()) {
    return { success: false, status: 400, error: "Email manzilingizni kiriting." };
  }
  if (!specialtyId) {
    return { success: false, status: 400, error: "Mutaxassisligingizni tanlang." };
  }
  if (!diplomaNumber?.trim()) {
    return { success: false, status: 400, error: "Diplom raqamini kiriting." };
  }
  if (!licenseNumber?.trim()) {
    return { success: false, status: 400, error: "Litsenziya yoki sertifikat raqamini kiriting." };
  }

  // Litsenziya raqami formati va takrorlanmasligi tekshiruvi (Talab 4)
  const licFormatCheck = validateLicenseNumberFormat(licenseNumber);
  if (!licFormatCheck.isValid) {
    return { success: false, status: 400, error: licFormatCheck.error };
  }
  const licUniqCheck = checkLicenseNumberUniqueness(licenseNumber, existingDoctors);
  if (!licUniqCheck.isUnique) {
    return { success: false, status: 409, error: licUniqCheck.error };
  }

  if (!licenseExpiry) {
    return { success: false, status: 400, error: "Litsenziyaning amal qilish muddatini kiriting." };
  }

  // Shifokor turi bo'yicha ish joyi tekshiruvi
  const isPrivateDoctor = practiceType === 'private_practice' || practiceType === 'both';
  const hasHospital = practiceType === 'hospital' || practiceType === 'both';

  if (hasHospital && !hospitalName?.trim()) {
    return { success: false, status: 400, error: "Ishlayotgan shifoxonangizni kiriting yoki tanlang." };
  }

  if (isPrivateDoctor) {
    if (!privateCabinet?.address?.trim() || !privateCabinet?.district?.trim()) {
      return { success: false, status: 400, error: "Xususiy kabinet manzili va tumanini to'liq kiriting." };
    }
    if (privateCabinet.lat == null || privateCabinet.lng == null) {
      return { success: false, status: 400, error: "Xususiy kabinet joylashuvini xaritada belgilang." };
    }
    if (!privateLicenseNumber?.trim()) {
      return { success: false, status: 400, error: "Xususiy tibbiy faoliyat litsenziya/ruxsatnoma raqamini kiriting." };
    }
    if (!privateLicenseFile) {
      return { success: false, status: 400, error: "Xususiy tibbiy faoliyat litsenziya/ruxsatnoma hujjatini yuklang." };
    }
  }

  // Agar faqat xususiy bo'lsa va hospitalName kiritilmagan bo'lsa, kabinet nomi ishlatiladi
  const effectiveHospitalName = hospitalName?.trim() || privateCabinet?.cabinetName || `Dr. ${firstName.trim()} ${lastName.trim()} qabuli`;

  if (!diplomaFile) {
    return { success: false, status: 400, error: "Diplom nusxasi faylini yuklang." };
  }
  if (!licenseFile) {
    return { success: false, status: 400, error: "Litsenziya nusxasi faylini yuklang." };
  }
  if (!passportFile) {
    return { success: false, status: 400, error: "Pasport yoki shaxsni tasdiqlovchi selfie rasmini yuklang." };
  }

  // 3. Rozilik katakchalari
  if (!consentPersonalData || !consentTerms) {
    return {
      success: false,
      status: 400,
      error: "Davom etish uchun shaxsiy ma'lumotlarni qayta ishlashga va foydalanish shartlariga rozilik bildirishingiz shart."
    };
  }

  // 4. Telefon va email formatlari
  const phoneValidation = validateUzbekPhoneNumber(phone);
  if (!phoneValidation.isValid) {
    return { success: false, status: 400, error: phoneValidation.error };
  }
  const cleanPhone = phoneValidation.cleanPhone;

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, status: 400, error: "Email formati noto'g'ri. Masalan: shifokor@mednavbat.uz" };
  }

  // 5. Parol talablari (Kamida 8 belgi, harf va raqam)
  if (!password || password.length < 8) {
    return { success: false, status: 400, error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { success: false, status: 400, error: "Parolda kamida bitta harf va bitta raqam bo'lishi kerak." };
  }
  if (password !== confirmPassword) {
    return { success: false, status: 400, error: "Parollar bir-biriga mos kelmadi." };
  }

  // 6. Rate Limiting tekshiruvi
  if (!checkRateLimit(cleanEmail) || !checkRateLimit(clientIp)) {
    return {
      success: false,
      status: 429,
      error: "Juda ko'p urinishlar qilindi. Iltimos, keyinroq qayta urinib ko'ring."
    };
  }

  // 7. Bir telefon yoki email bilan ikki marta ro'yxatdan o'tishni taqiqlash!
  const applications = getStoredDoctorApplications();
  const phoneDigits = cleanPhone.replace(/\D/g, '');

  const duplicateInApps = applications.find(a => 
    a.email?.toLowerCase() === cleanEmail || 
    (a.phone && a.phone.replace(/\D/g, '') === phoneDigits)
  );

  const duplicateInDoctors = (existingDoctors || []).find(d => 
    d.email?.toLowerCase() === cleanEmail || 
    (d.phone && d.phone.replace(/\D/g, '') === phoneDigits)
  );

  if (duplicateInApps || duplicateInDoctors) {
    // Agar oldingi ariza rad etilgan bo'lsa, qayta topshirish mumkin, lekin yangi dublikat ochilmaydi
    if (duplicateInApps && duplicateInApps.status === 'rejected') {
      return {
        success: false,
        status: 409,
        isRejectedPrevious: true,
        rejectedAppId: duplicateInApps.id,
        error: "Ushbu ma'lumotlar bilan avval topshirilgan arizangiz rad etilgan. Iltimos, hisobingizga kirib mavjud arizani tahrirlang va qayta yuboring."
      };
    }

    return {
      success: false,
      status: 409,
      error: "Ushbu email yoki telefon raqami allaqachon ro'yxatdan o'tgan!"
    };
  }

  // 8. Hujjat fayllarini tekshirish
  if (diplomaFile?.file) {
    const val = validateUploadedFile(diplomaFile.file);
    if (!val.isValid) return { success: false, status: 400, error: `Diplom: ${val.error}` };
  }
  if (licenseFile?.file) {
    const val = validateUploadedFile(licenseFile.file);
    if (!val.isValid) return { success: false, status: 400, error: `Litsenziya: ${val.error}` };
  }
  if (passportFile?.file) {
    const val = validateUploadedFile(passportFile.file);
    if (!val.isValid) return { success: false, status: 400, error: `Pasport/Selfie: ${val.error}` };
  }
  if (avatarFile?.file) {
    const val = validateUploadedFile(avatarFile.file);
    if (!val.isValid) return { success: false, status: 400, error: `Foto: ${val.error}` };
  }

  // 9. Parolni xavfsiz xeshlash (scrypt/PBKDF2)
  const { salt, hash: passwordHash } = await hashPasswordClient(password);

  // 10. Shifokor va Ariza ma'lumotlarini shakllantirish
  const fullName = middleName ? `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}` : `${lastName.trim()} ${firstName.trim()}`;
  const applicationId = `doc-app-${Date.now()}`;
  const doctorId = `doc-${Date.now()}`;

  const sanitizedDiploma = {
    name: sanitizeFileName(diplomaFile.name || 'diplom.pdf'),
    type: diplomaFile.type || 'application/pdf',
    size: diplomaFile.size || 0,
    dataUrl: diplomaFile.dataUrl || ''
  };

  const sanitizedLicense = {
    name: sanitizeFileName(licenseFile.name || 'litsenziya.pdf'),
    type: licenseFile.type || 'application/pdf',
    size: licenseFile.size || 0,
    dataUrl: licenseFile.dataUrl || ''
  };

  const sanitizedPassport = passportFile ? {
    name: sanitizeFileName(passportFile.name || 'pasport.jpg'),
    type: passportFile.type || 'image/jpeg',
    size: passportFile.size || 0,
    dataUrl: passportFile.dataUrl || ''
  } : null;

  const sanitizedPrivateLicense = privateLicenseFile ? {
    name: sanitizeFileName(privateLicenseFile.name || 'xususiy_litsenziya.pdf'),
    type: privateLicenseFile.type || 'application/pdf',
    size: privateLicenseFile.size || 0,
    dataUrl: privateLicenseFile.dataUrl || ''
  } : null;

  // Xususiy kabinet ma'lumotlarini standartlashtirish
  const formattedCabinet = isPrivateDoctor && privateCabinet ? {
    id: `cab-${Date.now()}`,
    cabinetName: privateCabinet.cabinetName?.trim() || `Dr. ${firstName.trim()} ${lastName.trim()} qabuli`,
    name: privateCabinet.cabinetName?.trim() || `Dr. ${firstName.trim()} ${lastName.trim()} qabuli`,
    regionId: privateCabinet.regionId || 'tashkent_city',
    regionName: privateCabinet.regionName || "Toshkent shahri",
    district: privateCabinet.district?.trim() || '',
    address: privateCabinet.address?.trim() || '',
    landmark: privateCabinet.landmark?.trim() || '',
    phone: privateCabinet.phone?.trim() || cleanPhone,
    lat: Number(privateCabinet.lat),
    lng: Number(privateCabinet.lng),
    privacyType: privateCabinet.privacyType || 'after_confirmed', // 'public' | 'after_confirmed'
    approxRadiusMeters: 400,
    privateLicenseNumber: privateLicenseNumber?.trim() || '',
    workScheduleDays: privateCabinet.workScheduleDays || ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    availableSlots: privateCabinet.availableSlots || ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    status: 'pending_verification' // admin tasdiqlaydi
  } : null;

  // Ish joylari ro'yxatini shakllantirish (Workplaces)
  const initialWorkplaces = [];
  if (hasHospital) {
    initialWorkplaces.push({
      id: `wp-hosp-${Date.now()}`,
      type: 'hospital',
      name: effectiveHospitalName,
      regionId: hospitalRegion || '',
      regionName: hospitalRegion || '',
      address: hospitalAddress || '',
      phone: cleanPhone,
      workScheduleDays: hospitalScheduleDays,
      availableSlots: hospitalAvailableSlots,
      status: 'pending_verification'
    });
  }
  if (isPrivateDoctor && formattedCabinet) {
    initialWorkplaces.push({
      id: formattedCabinet.id,
      type: 'private_cabinet',
      name: formattedCabinet.cabinetName,
      cabinetName: formattedCabinet.cabinetName,
      regionId: formattedCabinet.regionId,
      regionName: formattedCabinet.regionName,
      district: formattedCabinet.district,
      address: formattedCabinet.address,
      landmark: formattedCabinet.landmark,
      phone: formattedCabinet.phone,
      lat: formattedCabinet.lat,
      lng: formattedCabinet.lng,
      privacyType: formattedCabinet.privacyType,
      approxRadiusMeters: 400,
      workScheduleDays: formattedCabinet.workScheduleDays,
      availableSlots: formattedCabinet.availableSlots,
      status: 'pending_verification'
    });
  }

  const newApplication = {
    id: applicationId,
    doctorId,
    role: 'doctor',
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    middleName: middleName.trim(),
    fullName,
    name: `Dr. ${firstName.trim()} ${lastName.trim()}`,
    birthDate,
    phone: cleanPhone,
    phoneVerified: true,
    email: cleanEmail,
    specialtyId,
    specialtyName: specialtyName || specialtyId,
    experienceYears: Number(experienceYears) || 0,
    diplomaNumber: diplomaNumber.trim(),
    licenseNumber: licenseNumber.trim(),
    licenseExpiry,
    // Shifokor turi va ish joylari
    practiceType,
    isPrivateDoctor,
    hospitalName: effectiveHospitalName,
    hospitalRegion: hospitalRegion.trim() || formattedCabinet?.regionName || '',
    hospitalAddress: hospitalAddress.trim() || formattedCabinet?.address || '',
    privateCabinet: formattedCabinet,
    workplaces: initialWorkplaces.length > 0 ? initialWorkplaces : (workplaces || []),
    privateLicenseNumber: privateLicenseNumber?.trim() || '',
    privateLicenseFile: sanitizedPrivateLicense,
    // Agar xususiy bo'lsa koordinatalarni doctor sathiga ham o'rnatamiz
    lat: formattedCabinet?.lat ?? null,
    lng: formattedCabinet?.lng ?? null,
    district: formattedCabinet?.district ?? '',
    landmark: formattedCabinet?.landmark ?? '',
    privacyType: formattedCabinet?.privacyType ?? 'public',
    // Hujjatlar
    diplomaFile: sanitizedDiploma,
    licenseFile: sanitizedLicense,
    passportFile: sanitizedPassport,
    avatarFile: sanitizedAvatar,
    avatar: sanitizedAvatar?.dataUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    // Xavfsiz xeshlangan parol (oddiy parol saqlanmaydi!)
    passwordHash,
    salt,
    // 10. AI & OCR Hujjat Baholash (Talab 4)
    // AI hech qachon 'approved' qilmaydi: faqat 'pending' yoki 'needs_review'
    ...(() => {
      const ai = evaluateDocumentWithAI({
        fullName,
        licenseNumber: licFormatCheck.cleanLicenseNumber || licenseNumber,
        licenseFile,
        passportFile,
        diplomaFile
      });
      return {
        aiConfidenceScore: ai.aiConfidenceScore,
        isSuspicious: ai.isSuspicious,
        aiFlags: ai.aiFlags,
        aiAnalysis: ai,
        status: ai.suggestedStatus, // 'pending' yoki 'needs_review'
        licenseStatus: 'under_review',
        licenseVerified: false
      };
    })(),
    rejectionReason: null,
    // Standart ish kunlari (admin tasdiqlaganda sozlaydi)
    workScheduleDays: (formattedCabinet && !hasHospital) ? formattedCabinet.workScheduleDays : ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    availableSlots: (formattedCabinet && !hasHospital) ? formattedCabinet.availableSlots : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    roomNumber: '101',
    rating: 5.0,
    reviewsCount: 0,
    consentPersonalData: true,
    consentTerms: true,
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null
  };

  // Saqlash
  applications.unshift(newApplication);
  saveStoredDoctorApplications(applications);

  // Audit jurnaliga xavfsiz (maskalangan) yozuv
  recordAuditLog({
    actorId: doctorId,
    actorRole: 'doctor',
    action: 'register_doctor',
    resource: `doctor:${doctorId}`,
    details: {
      fullName,
      licenseNumber: licFormatCheck.cleanLicenseNumber || licenseNumber,
      status: newApplication.status,
      aiConfidenceScore: newApplication.aiConfidenceScore,
      isSuspicious: newApplication.isSuspicious
    }
  });

  logAuditEvent({
    action: 'DOCTOR_APPLICATION_SUBMITTED',
    actorRole: 'doctor',
    actorId: cleanPhone,
    resource: `Application: ${applicationId}`,
    details: `Yangi shifokor arizasi topshirildi (Diplom: ${diplomaNumber.slice(0, 3)}***)`
  });

  // Shifokorga bildirishnoma yuborish
  addNotification({
    userId: doctorId,
    userPhone: cleanPhone,
    type: 'system',
    title: "Arizangiz qabul qilindi",
    message: `Hurmatli ${fullName}! Arizangiz va hujjatlaringiz ma'muriyatga qabul qilindi. 1-3 ish kunida ko'rib chiqilib tasdiqlanadi.`
  });

  // Email / SMS xabar (mock / test)
  sendEmailViaResend({
    to: cleanEmail,
    subject: "MedNavbat: Shifokor arizangiz qabul qilindi",
    text: `Hurmatli ${fullName}! MedNavbat platformasiga shifokorlik arizangiz qabul qilindi. Hujjatlaringiz ma'muriyat tomonidan ko'rib chiqilmoqda.`,
    html: `<p>Hurmatli <strong>${fullName}</strong>!</p><p>Arizangiz qabul qilindi. Ma'muriyat ko'rib chiqqach sizga xabar beriladi.</p>`
  });

  return {
    success: true,
    status: 201,
    message: "Arizangiz muvaffaqiyatli qabul qilindi! Ma'muriyat tasdiqlashi kutilmoqda.",
    application: newApplication
  };
}

/**
 * Rad etilgan shifokor arizasini tuzatib qayta topshirish (Resubmit)
 */
export async function resubmitDoctorRegistrationApplication(applicationId, updatedData) {
  const applications = getStoredDoctorApplications();
  const index = applications.findIndex(a => a.id === applicationId || a.doctorId === applicationId);

  if (index === -1) {
    return { success: false, status: 404, error: "Ariza topilmadi." };
  }

  const existing = applications[index];

  // Yangilangan ma'lumotlar
  const updatedApp = {
    ...existing,
    ...updatedData,
    // Holat yana kutilmoqda bo'ladi
    status: 'pending_verification',
    licenseStatus: 'under_review',
    licenseVerified: false,
    rejectionReason: null,
    resubmittedAt: new Date().toISOString()
  };

  applications[index] = updatedApp;
  saveStoredDoctorApplications(applications);

  logAuditEvent({
    action: 'DOCTOR_APPLICATION_RESUBMITTED',
    actorRole: 'doctor',
    actorId: existing.phone,
    resource: `Application: ${applicationId}`,
    details: "Tuzatilgan shifokor arizasi qayta topshirildi"
  });

  addNotification({
    userId: existing.doctorId,
    userPhone: existing.phone,
    type: 'system',
    title: "Arizangiz qayta ko'rib chiqishga topshirildi",
    message: "Ma'lumotlaringiz ma'muriyatga qayta topshirildi. Tez orada tekshiriladi."
  });

  return {
    success: true,
    message: "Arizangiz muvaffaqiyatli qayta topshirildi! Admin ko'rib chiqishi kutilmoqda.",
    application: updatedApp
  };
}

/**
 * Admin: Arizani tasdiqlash (Approve)
 */
export function approveDoctorApplication(applicationId, {
  workScheduleDays = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
  availableSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  roomNumber = '204-xona',
  consultationPrice = 150000
} = {}) {
  const applications = getStoredDoctorApplications();
  const index = applications.findIndex(a => a.id === applicationId || a.doctorId === applicationId);

  if (index === -1) {
    return { success: false, error: "Ariza topilmadi." };
  }

  const target = applications[index];
  const now = new Date().toISOString();

  target.status = 'approved';
  target.licenseStatus = 'verified';
  target.licenseVerified = true;
  target.rejectionReason = null;
  target.workScheduleDays = workScheduleDays;
  target.availableSlots = availableSlots;
  target.roomNumber = roomNumber;
  target.price = consultationPrice;
  target.reviewedAt = now;
  target.reviewedBy = 'admin';

  if (target.privateCabinet) {
    target.privateCabinet.status = 'approved';
  }
  if (Array.isArray(target.workplaces)) {
    target.workplaces = target.workplaces.map(w => ({ ...w, status: 'approved' }));
  }

  applications[index] = target;
  saveStoredDoctorApplications(applications);

  // Audit jurnaliga yozish
  logAuditEvent({
    action: 'DOCTOR_APPLICATION_APPROVED',
    actorRole: 'admin',
    actorId: 'admin',
    resource: `Doctor: ${target.doctorId}`,
    details: `Shifokor arizasi tasdiqlandi: ${target.fullName || target.name}`
  });

  // Bildirishnoma
  addNotification({
    userId: target.doctorId,
    userPhone: target.phone,
    type: 'system',
    title: "Tabriklaymiz! Arizangiz tasdiqlandi 🎉",
    message: `Hurmatli ${target.fullName || target.name}! MedNavbat ma'muriyati shifokorlik arizangizni tasdiqladi. Bemorlar qabulini boshlashingiz mumkin.`
  });

  // SMS / Email xabarnoma yuborish
  sendOtpToUser(target.phone, `MedNavbat: Hurmatli ${target.fullName || target.name}, arizangiz tasdiqlandi! Bemorlar navbatini qabul qilishingiz mumkin.`);

  sendEmailViaResend({
    to: target.email,
    subject: "MedNavbat: Shifokor arizangiz tasdiqlandi! 🎉",
    text: `Hurmatli ${target.fullName || target.name}! MedNavbat ma'muriyati shifokorlik arizangizni tasdiqladi.`,
    html: `<h3>Tabriklaymiz!</h3><p>Hurmatli <strong>${target.fullName || target.name}</strong>, shifokorlik arizangiz tasdiqlandi. Ish jadvalingiz belgilandi. Tizimga kirishingiz mumkin.</p>`
  });

  return {
    success: true,
    message: `Shifokor ${target.fullName || target.name} muvaffaqiyatli tasdiqlandi va tizimda faollashtirildi!`,
    doctor: target
  };
}

/**
 * Admin: Arizani rad etish (Reject)
 */
export function rejectDoctorApplication(applicationId, reason = '') {
  if (!reason || !reason.trim()) {
    return { success: false, error: "Iltimos, rad etish sababini aniq ko'rsating." };
  }

  const applications = getStoredDoctorApplications();
  const index = applications.findIndex(a => a.id === applicationId || a.doctorId === applicationId);

  if (index === -1) {
    return { success: false, error: "Ariza topilmadi." };
  }

  const target = applications[index];
  const now = new Date().toISOString();

  target.status = 'rejected';
  target.licenseStatus = 'rejected';
  target.licenseVerified = false;
  target.rejectionReason = reason.trim();
  target.reviewedAt = now;
  target.reviewedBy = 'admin';

  applications[index] = target;
  saveStoredDoctorApplications(applications);

  // Audit jurnaliga yozish
  logAuditEvent({
    action: 'DOCTOR_APPLICATION_REJECTED',
    actorRole: 'admin',
    actorId: 'admin',
    resource: `Doctor: ${target.doctorId}`,
    details: `Ariza rad etildi. Sabab: ${reason.trim()}`
  });

  // Shifokorga bildirishnoma
  addNotification({
    userId: target.doctorId,
    userPhone: target.phone,
    type: 'system',
    title: "Arizangiz rad etildi ⚠️",
    message: `Hurmatli ${target.fullName || target.name}! Arizangiz quyidagi sababga ko'ra rad etildi: ${reason.trim()}. Ma'lumotlarni tuzatib qayta topshirishingiz mumkin.`
  });

  // SMS / Email xabarnoma yuborish
  sendOtpToUser(target.phone, `MedNavbat: Arizangiz rad etildi. Sabab: ${reason.trim()}. Ma'lumotlarni to'g'irlab qayta topshiring.`);

  sendEmailViaResend({
    to: target.email,
    subject: "MedNavbat: Shifokor arizangiz holati",
    text: `Hurmatli ${target.fullName || target.name}! Arizangiz quyidagi sababga ko'ra rad etildi: ${reason.trim()}.`,
    html: `<h3>Arizangiz holati</h3><p>Hurmatli <strong>${target.fullName || target.name}</strong>, arizangiz quyidagi sababga ko'ra rad etildi:</p><blockquote>${reason.trim()}</blockquote><p>Iltimos, hisobingizga kirib ma'lumotlarni yangilab qayta topshiring.</p>`
  });

  return {
    success: true,
    message: `Ariza rad etildi va shifokorga SMS/email orqali sababi yuborildi.`,
    doctor: target
  };
}

/**
 * Shifokor arizasini ID yoki Email yoki Telefon bo'yicha topish
 */
export function findDoctorApplication(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const digits = clean.replace(/\D/g, '');
  const apps = getStoredDoctorApplications();

  return apps.find(a => 
    a.id === clean ||
    a.doctorId === clean ||
    a.email?.toLowerCase() === clean ||
    (digits && a.phone && a.phone.replace(/\D/g, '') === digits)
  ) || null;
}

/**
 * Shifokor o'z kabineti joylashuvini tahrirlashi (Talab 2, 3 va 6)
 * - Shifokor faqat o'z kabinetini tahrirlay oladi.
 * - Joylashuv o'zgarsa, holat 'pending_location_review' ga o'tib, admin qayta ko'rib chiqishi talab etiladi.
 * - Konsol va audit jurnallariga xom koordinata yoki aniq ko'cha manzili YOZILMAYDI.
 */
export function updateDoctorCabinetLocation(doctorId, updatedCabinetData, actorUserId = null) {
  if (!doctorId || !updatedCabinetData) {
    return { success: false, error: "Ma'lumotlar to'liq emas." };
  }

  // Xavfsizlik: Faqat o'z kabinetini tahrirlashi mumkin
  if (actorUserId && actorUserId !== doctorId) {
    // Agar foydalanuvchi o'zi bo'lmasa, xatolik
    return { success: false, error: "Xavfsizlik cheklovi: faqat o'z kabinetingizni tahrirlashingiz mumkin." };
  }

  const applications = getStoredDoctorApplications();
  const index = applications.findIndex(a => a.id === doctorId || a.doctorId === doctorId);

  let targetApp = index !== -1 ? applications[index] : null;

  const currentCab = targetApp?.privateCabinet || {};
  const isCoordsChanged = (currentCab.lat !== updatedCabinetData.lat) || (currentCab.lng !== updatedCabinetData.lng);
  const isAddressChanged = currentCab.address !== updatedCabinetData.address;

  const newStatus = (isCoordsChanged || isAddressChanged) ? 'pending_location_review' : (currentCab.status || 'approved');

  const newCabinet = {
    ...currentCab,
    ...updatedCabinetData,
    lat: Number(updatedCabinetData.lat),
    lng: Number(updatedCabinetData.lng),
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  if (targetApp) {
    targetApp.privateCabinet = newCabinet;
    targetApp.lat = newCabinet.lat;
    targetApp.lng = newCabinet.lng;
    targetApp.district = newCabinet.district;
    targetApp.landmark = newCabinet.landmark;
    targetApp.privacyType = newCabinet.privacyType;
    targetApp.cabinetLocationNeedsReview = (newStatus === 'pending_location_review');

    if (Array.isArray(targetApp.workplaces)) {
      targetApp.workplaces = targetApp.workplaces.map(w => 
        w.type === 'private_cabinet' ? { ...w, ...newCabinet } : w
      );
    }

    applications[index] = targetApp;
    saveStoredDoctorApplications(applications);
  }

  // Audit jurnaliga xavfsiz (koordinata va ko'chasiz) yozuv
  logAuditEvent({
    action: 'DOCTOR_CABINET_LOCATION_UPDATED',
    actorRole: 'doctor',
    actorId: doctorId,
    resource: `DoctorCabinet: ${doctorId}`,
    details: "Xususiy kabinet joylashuvi yangilandi (Admin tekshiruviga yuborildi)"
  });

  return {
    success: true,
    message: (isCoordsChanged || isAddressChanged)
      ? "Kabinet joylashuvi yangilandi! Xavfsizlik talablariga muvofiq, joy o'zgargani uchun ma'muriyat tasdiqlashi kutilmoqda."
      : "Kabinet ma'lumotlari muvaffaqiyatli saqlandi.",
    cabinet: newCabinet,
    needsAdminReview: (isCoordsChanged || isAddressChanged)
  };
}

/**
 * Admin kabinet joylashuvini tasdiqlashi
 */
export function approveDoctorCabinetLocation(doctorId) {
  const applications = getStoredDoctorApplications();
  const index = applications.findIndex(a => a.id === doctorId || a.doctorId === doctorId);
  if (index === -1) return { success: false, error: "Shifokor topilmadi." };

  const target = applications[index];
  if (target.privateCabinet) {
    target.privateCabinet.status = 'approved';
  }
  target.cabinetLocationNeedsReview = false;
  applications[index] = target;
  saveStoredDoctorApplications(applications);

  logAuditEvent({
    action: 'DOCTOR_CABINET_LOCATION_APPROVED',
    actorRole: 'admin',
    actorId: 'admin',
    resource: `DoctorCabinet: ${doctorId}`,
    details: "Xususiy kabinet joylashuvi admin tomonidan tasdiqlandi"
  });

  return { success: true, message: "Xususiy kabinet joylashuvi tasdiqlandi va bemorlar xaritasida faollashtirildi!" };
}

