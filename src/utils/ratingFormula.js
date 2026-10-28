/**
 * MedNavbat — Shaffof va Ochiq Shifokor Reyting Formulasi (Transparent Rating Formula)
 * ─────────────────────────────────────────────────────────────────────────────────
 *
 * TIBBIY VA HUQUQIY AXLOQ QOIDASI:
 * "Eng yaxshi shifokor" yoki subyektiv marketing so'zlari qat'iyan man etiladi.
 * Reyting faqatgina tekshiriladigan matematik va rasmiy dalillarga tayanadi:
 *
 * 1. Tekshirilgan Litsenziya (licenseVerified):
 *    - Agar shifokor litsenziyasi rasmiy reyestr yoki admin tomonidan tasdiqlanmagan bo'lsa
 *      (licenseVerified === false), uning yakuniy koeffitsienti nolga tenglashtiriladi yoki
 *      "Litsenziya tasdiqlanmagan" deb maxsus ogohlantirish beriladi.
 *
 * 2. Matematik Formula (Bayesian Weighted Multi-Factor Score):
 *    Formulaning elementlari:
 *      - R_raw: Bemorlarning o'rtacha bergan bahosi (1.0 dan 5.0 gacha)
 *      - N: Bemorlarning bergan baholari soni (reviewCount)
 *      - C: Global o'rtacha baho konstantasi (C = 4.0)
 *      - m: Ishonchlilik chegarasi uchun minimal sharhlar kvantili (m = 5 ta baho)
 *      - E: Tajriba yillari (experienceYears, maksimal 30 yil bilan cheklanadi)
 *      - V: Litsenziya tasdiqlanganligi multiplikatori (V = 1.0 agar true, 0.5 agar kutilmoqda)
 *
 *    Matematik ifoda:
 *      BayesianRating = (N / (N + m)) * R_raw + (m / (N + m)) * C
 *      ExperienceFactor = 1 + 0.15 * (min(E, 30) / 30)   // 1.00 dan 1.15 gacha tajriba omili
 *      LicenseFactor = licenseVerified ? 1.0 : 0.0       // Litsenziyasiz shifokor reytingi hisoblanmaydi
 *
 *      FinalScore = round( BayesianRating * ExperienceFactor * LicenseFactor, 2 )
 *      NormalizedRating = min(5.0, round(BayesianRating, 1)) // Foydalanuvchiga ko'rsatiladigan 5 yulduzli o'lchov
 *
 * 3. GDPR va Maxfiylik Qonunlariga (O'zbekiston Qonunchiligi & GDPR) Muvofiqlik:
 *    - Shifokorning shaxsiy pasport / JSHSHIR ma'lumotlari, shaxsiy yashash manzili yoki
 *      bank kartalari faqat himoyalangan serverda qoladi.
 *    - Ommaviy ko'rinishga (UI ga) faqat kasbiy, litsenziyalangan va ochiq ma'lumotlar uzatiladi:
 *      fullName, specialty, countryId, regionId, rating, experienceYears, timeZone, publicSchedule.
 */

export const RATING_CONFIG = {
  GLOBAL_BASELINE_RATING: 4.0, // Global o'rtacha boshlang'ich
  MINIMUM_REVIEWS_CONFIDENCE: 5, // Bayes ishonch chegarasi
  MAX_EXPERIENCE_CAP: 30, // Tajriba ta'siri cheklovi
};

/**
 * Shifokorning ochiq va shaffof reytingini hisoblaydi
 * @param {Object} params
 * @param {number} params.avgRating - Bemorlar qo'ygan o'rtacha baho (1.0 - 5.0)
 * @param {number} params.reviewCount - Baholar umumiy soni
 * @param {number} params.experienceYears - Tasdiqlangan kasbiy tajriba yillari
 * @param {boolean} params.licenseVerified - Rasmiy litsenziya tasdiqlanganmi?
 * @returns {{ finalScore: number, displayRating: number, isVerified: boolean, formulaExplanation: string }}
 */
export function calculateTransparentDoctorScore({
  avgRating = 0,
  reviewCount = 0,
  experienceYears = 0,
  licenseVerified = false
}) {
  if (!licenseVerified) {
    return {
      finalScore: 0,
      displayRating: Number(avgRating.toFixed(1)) || 0,
      isVerified: false,
      statusLabel: 'Litsenziya tasdiqlanmagan',
      formulaExplanation: 'Litsenziya tasdiqlanmagan shifokorlar reyting tizimida qatnashmaydi (V=0).'
    };
  }

  const { GLOBAL_BASELINE_RATING, MINIMUM_REVIEWS_CONFIDENCE, MAX_EXPERIENCE_CAP } = RATING_CONFIG;
  const N = Math.max(0, Number(reviewCount) || 0);
  const R = Math.min(5, Math.max(1, Number(avgRating) || GLOBAL_BASELINE_RATING));
  const E = Math.min(MAX_EXPERIENCE_CAP, Math.max(0, Number(experienceYears) || 0));

  // 1. Bayesiy tekislash (kam sharhli shifokorlar sun'iy 5.0 bo'lib qolmasligi uchun)
  const bayesianRating = (N / (N + MINIMUM_REVIEWS_CONFIDENCE)) * R + 
                         (MINIMUM_REVIEWS_CONFIDENCE / (N + MINIMUM_REVIEWS_CONFIDENCE)) * GLOBAL_BASELINE_RATING;

  // 2. Tajriba multiplikatori (maksimal +15% shaffof qo'shimcha)
  const experienceMultiplier = 1 + (0.15 * (E / MAX_EXPERIENCE_CAP));

  // 3. Yakuniy kompozit ball
  const rawFinal = bayesianRating * experienceMultiplier;
  const finalScore = Number(rawFinal.toFixed(2));

  // Foydalanuvchi UI sida ko'rsatiladigan 5 yulduzli o'lchov
  const displayRating = Number(Math.min(5.0, bayesianRating).toFixed(1));

  return {
    finalScore,
    displayRating,
    isVerified: true,
    statusLabel: 'Tasdiqlangan shifokor',
    formulaExplanation: `Bayesian(${N} sharh, ${R} ball) * TajribaOmili(${E} yil, ${(experienceMultiplier).toFixed(2)}) = ${finalScore}`
  };
}

/**
 * GDPR va Maxfiylik qoidalari bo'yicha shifokor obyektini tozalash (sanitization)
 * Shaxsiy nozik ma'lumotlarni chiqarib tashlaydi, faqat ommaviy maydonlarni qoldiradi.
 */
export function sanitizeDoctorPublicProfile(doctor) {
  if (!doctor) return null;

  return {
    id: doctor.id,
    fullName: doctor.fullName || doctor.name,
    name: doctor.name || doctor.fullName,
    specialty: doctor.specialty || doctor.specialtyId,
    specialtyId: doctor.specialtyId || doctor.specialty,
    specialtyName: doctor.specialtyName,
    specialtyName_uz: doctor.specialtyName_uz,
    countryId: doctor.countryId,
    regionId: doctor.regionId,
    regionName: doctor.regionName,
    timeZone: doctor.timeZone || 'Asia/Tashkent',
    licenseNumber: doctor.licenseNumber ? `LIC-${doctor.licenseNumber.slice(0, 4)}***` : 'Tasdiqlanmagan',
    licenseVerified: Boolean(doctor.licenseVerified),
    experienceYears: Number(doctor.experienceYears) || 0,
    rating: Number(doctor.rating) || 0,
    reviewCount: Number(doctor.reviewCount || doctor.reviewsCount) || 0,
    reviewsCount: Number(doctor.reviewCount || doctor.reviewsCount) || 0,
    schedule: doctor.schedule || null,
    onCall: Boolean(doctor.onCall),
    manualStatus: doctor.manualStatus || 'auto',
    source: doctor.source || 'demo',
    avatar: doctor.avatar,
    hospitalName: doctor.hospitalName,
    roomNumber: doctor.roomNumber,
    availableSlots: doctor.availableSlots || [],
    workScheduleDays: doctor.workScheduleDays || []
  };
}
