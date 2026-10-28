/**
 * MedNavbat — Xususiy Shifokor Joylashuvi va Maxfiylik Servisi
 * ─────────────────────────────────────────────────────────────
 * TALABLAR:
 * 1. Shifokor maxfiylik sozlamasini tanlaydi:
 *    - 'public': Aniq manzil hammaga ko'rinadi.
 *    - 'after_confirmed': Aniq manzil va koordinatalar FAQAT navbati
 *      tasdiqlangan bemorga, shifokorning o'ziga va adminga ko'rinadi.
 * 2. Tasdiqlanmagan bemor yoki mehmonga:
 *    - Faqat taxminiy joy (300-500 m radiusli hudud/doira yoki faqat tuman/hudud).
 *    - Aniq manzil o'rniga: "[Tuman], Aniq manzil navbat tasdiqlangach ko'rinadi".
 *    - Aniq koordinatalar berilmaydi (xavfsiz taxminiy markaz beriladi).
 *    - "Yo'l ko'rsatish" (Directions) tugmasi bloklanadi / navbatdan keyin faollashadi.
 * 3. Log va konsolga xom koordinata va manzillar yozilmaydi.
 */

/**
 * Bemorning shifokorda tasdiqlangan navbati bor-yo'qligini tekshirish
 */
export function hasConfirmedAppointment(patient, doctorId, appointments = []) {
  if (!patient || !doctorId || !Array.isArray(appointments)) return false;

  const patientId = patient.id || patient.patientId;
  const patientPhone = (patient.phone || '').replace(/\D/g, '');

  return appointments.some((app) => {
    // Shifokor mosligi
    const docMatch = app.doctorId === doctorId || 
                     app.doctor_id === doctorId || 
                     (app.doctorName && app.doctorName.includes(doctorId));
    if (!docMatch) return false;

    // Bemor mosligi (ID yoki telefon)
    const appPatientPhone = (app.patientPhone || app.patient_phone || '').replace(/\D/g, '');
    const patientMatch = (patientId && (app.patientId === patientId || app.patient_id === patientId)) ||
                         (patientPhone && appPatientPhone && patientPhone === appPatientPhone);
    if (!patientMatch) return false;

    // Holat tasdiqlangan bo'lishi kerak (Tasdiqlangan, Qabulda yoki Yakunlangan)
    const validStatuses = ['Tasdiqlangan', 'Qabulda', 'Yakunlangan', 'Yakunlandi', 'Bajarildi'];
    return validStatuses.includes(app.status);
  });
}

/**
 * Taxminiy xavfsiz koordinata hosil qilish (~350-450 metr siljish)
 * Aniq koordinatani sir saqlash uchun deterministik siljish qo'shiladi
 */
export function generateApproximateCoordinates(lat, lng, seed = 'default') {
  if (lat == null || lng == null) return { lat, lng };

  // Seed bo'yicha deterministik pseudo-offset
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  // Taxminan 300-450 metr (1 gradus lat ~ 111 km, 0.003 ~ 330m)
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const offsetRadius = 0.0035; // ~380 metr

  const approxLat = lat + Math.sin(angle) * offsetRadius;
  const approxLng = lng + Math.cos(angle) * offsetRadius;

  return {
    lat: Number(approxLat.toFixed(5)),
    lng: Number(approxLng.toFixed(5)),
    isApproximate: true,
    radiusMeters: 400
  };
}

/**
 * Ko'ruvchi (Viewer) roli va huquqiga qarab shifokor joylashuv ma'lumotlarini tozalash/filtrlash
 *
 * @param {Object} doctor Shifokor obyekti
 * @param {Object} viewer Hozirgi ko'ruvchi (userProfile, currentRole, isAdminAuthenticated)
 * @param {Array} appointments Barcha navbatlar
 * @returns {Object} Sanitized doctor object
 */
export function sanitizeDoctorLocationForViewer(doctor, viewer = null, appointments = []) {
  if (!doctor) return null;

  // Agar shifoxonada ishlovchi oddiy shifokor bo'lsa (xususiy kabineti yo'q), maxfiylik cheklovi yo'q
  const isPrivate = doctor.isPrivateDoctor || 
                    doctor.practiceType === 'private_practice' || 
                    doctor.practiceType === 'both' ||
                    Boolean(doctor.privateCabinet);

  if (!isPrivate) {
    return { ...doctor, isLocationMasked: false };
  }

  const cabinet = doctor.privateCabinet || (doctor.workplaces && doctor.workplaces.find(w => w.type === 'private_cabinet')) || {};
  const privacySetting = cabinet.privacyType || doctor.privacyType || 'after_confirmed';

  // 1. Agar admin bo'lsa — to'liq ko'radi
  const isAdmin = viewer?.role === 'admin' || viewer?.isAdmin || viewer?.isAdminAuthenticated;
  if (isAdmin) {
    return { ...doctor, isLocationMasked: false, canViewExactLocation: true };
  }

  // 2. Agar shifokor O'ZI bo'lsa — to'liq ko'radi
  const isSelf = viewer && (
    viewer.id === doctor.id || 
    viewer.id === doctor.doctorId || 
    viewer.doctorId === doctor.id ||
    (viewer.email && doctor.email && viewer.email.toLowerCase() === doctor.email.toLowerCase())
  );
  if (isSelf) {
    return { ...doctor, isLocationMasked: false, canViewExactLocation: true };
  }

  // 3. Agar shifokor "Aniq manzilim hammaga ko'rinsin" (public) deb tanlagan bo'lsa — to'liq ko'rinadi
  if (privacySetting === 'public') {
    return { ...doctor, isLocationMasked: false, canViewExactLocation: true };
  }

  // 4. "after_confirmed": bemorning ushbu shifokorda TASDIQLANGAN navbati bormi?
  const hasConfirmed = hasConfirmedAppointment(viewer, doctor.id, appointments);
  if (hasConfirmed) {
    return { ...doctor, isLocationMasked: false, canViewExactLocation: true, confirmedBookingAccess: true };
  }

  // 5. RUXSAT YO'Q: Aniq koordinata va ko'cha/uy manzilini YASHIRISH!
  const rawLat = cabinet.lat ?? doctor.lat;
  const rawLng = cabinet.lng ?? doctor.lng;
  const approx = generateApproximateCoordinates(rawLat, rawLng, doctor.id || 'seed');

  const district = cabinet.district || doctor.district || '';
  const regionName = cabinet.regionName || doctor.regionName || '';
  const landmark = cabinet.landmark || doctor.landmark || '';

  // Maxfiy manzil matni
  const maskedAddress = district 
    ? `${district}${landmark ? ` (${landmark})` : ''} — Aniq manzil navbat tasdiqlangach ko'rinadi 🔒`
    : `${regionName || "O'zbekiston"} — Aniq manzil navbat tasdiqlangach ko'rinadi 🔒`;

  const sanitizedCabinet = {
    ...cabinet,
    lat: approx.lat,
    lng: approx.lng,
    address: maskedAddress,
    exactAddressHidden: true,
    approxRadiusMeters: approx.radiusMeters
  };

  return {
    ...doctor,
    lat: approx.lat,
    lng: approx.lng,
    hospitalAddress: maskedAddress,
    cabinetAddress: maskedAddress,
    address: maskedAddress,
    privateCabinet: sanitizedCabinet,
    isLocationMasked: true,
    canViewExactLocation: false,
    approxRadiusMeters: approx.radiusMeters,
    maskNotice: "Shifokor maxfiylik sozlamasi: Aniq manzil va yo'nalish navbatingiz tasdiqlangandan so'ng taqdim etiladi."
  };
}

/**
 * Xaritada ko'rsatish uchun shifokorlar va xususiy kabinetlarni tayyorlash
 * - Nofaol yoki o'chirilgan shifokorlar MUTLAQO qo'shilmaydi (is_active !== false)
 * - Tasdiqlanmagan shifokor/kabinetlar bemorlarga ko'rinmaydi (status === 'approved')
 * - Maxfiylik darajasi sanitizatsiya qilinadi
 */
export function getActivePrivateDoctorMapEntries(doctors = [], viewer = null, appointments = []) {
  if (!Array.isArray(doctors)) return [];

  const list = [];

  doctors.forEach((doc) => {
    // 1. Shifokor faol va tasdiqlangan bo'lishi shart
    if (doc.is_active === false || doc.isActive === false) return;
    if (doc.status && doc.status !== 'approved') return;
    if (doc.licenseVerified === false) return;

    // 2. Xususiy shifokormi?
    const isPrivate = doc.isPrivateDoctor || 
                      doc.practiceType === 'private_practice' || 
                      doc.practiceType === 'both' ||
                      Boolean(doc.privateCabinet);

    if (!isPrivate) return;

    // 3. Sanitizatsiya
    const sanitized = sanitizeDoctorLocationForViewer(doc, viewer, appointments);
    if (!sanitized) return;

    const cab = sanitized.privateCabinet || {};
    const lat = cab.lat ?? sanitized.lat;
    const lng = cab.lng ?? sanitized.lng;

    if (lat == null || lng == null) return;

    list.push({
      id: `priv-doc-${doc.id}`,
      type: 'private_doctor',
      doctorId: doc.id,
      doctorName: doc.fullName || doc.name,
      specialtyId: doc.specialtyId || doc.specialty,
      specialtyName: doc.specialtyName || doc.specialty,
      experienceYears: doc.experienceYears || 0,
      rating: doc.rating || 5.0,
      price: doc.price || 150000,
      avatar: doc.avatar,
      cabinetName: cab.cabinetName || cab.name || `${doc.fullName || doc.name} qabuli`,
      regionId: cab.regionId || doc.regionId,
      regionName: cab.regionName || doc.regionName,
      district: cab.district || doc.district,
      address: cab.address || sanitized.address,
      phone: cab.phone || doc.phone,
      landmark: cab.landmark,
      lat,
      lng,
      isLocationMasked: sanitized.isLocationMasked,
      canViewExactLocation: sanitized.canViewExactLocation,
      approxRadiusMeters: sanitized.approxRadiusMeters || 400,
      workScheduleDays: cab.workScheduleDays || doc.workScheduleDays || ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
      availableSlots: cab.availableSlots || doc.availableSlots || ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      doctor: sanitized
    });
  });

  return list;
}
