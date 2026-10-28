/**
 * MedNavbat — CSV & Clinic Bulk Import Service
 * ─────────────────────────────────────────────
 * Klinikalar va tibbiy markazlar uchun shifokorlar tarkibini
 * CSV yoki JSON formatida tizimga xavfsiz va tekshirilgan holda yuklash moduli.
 */

import { WORLD_COUNTRIES } from '../../data/countriesData';
import { sanitizeDoctorPublicProfile, calculateTransparentDoctorScore } from '../../utils/ratingFormula';

/**
 * CSV matnini parse qilish
 */
export function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CSV faylida kamida bitta sarlavha va bitta ma'lumot qatori bo'lishi kerak.");
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Oddiy CSV parser (vergul bilan ajratilgan)
    const values = rawLine.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const rowObj = {};
    headers.forEach((header, idx) => {
      rowObj[header] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * CSV qatorlarini tekshirish va import qilish
 */
export function importDoctorsFromCSV(csvText, clinicName = 'Hamkor Klinika') {
  const { rows } = parseCSV(csvText);

  const results = {
    total: rows.length,
    successful: [],
    failed: [],
    errors: []
  };

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Sarlavhadan keyingi 1-qator = 2-qator
    try {
      const fullName = row.fullName || row.name;
      const specialty = row.specialty;
      const countryId = (row.countryId || 'UZ').toUpperCase();
      const regionId = row.regionId || null;
      const licenseNumber = row.licenseNumber;
      const experienceYears = Number(row.experienceYears) || 0;
      const timeZone = row.timeZone || (countryId === 'US' ? 'America/New_York' : 'Asia/Tashkent');
      const licenseVerified = row.licenseVerified === 'true' || row.licenseVerified === true;

      if (!fullName) {
        throw new Error(`${rowNum}-qator: Shifokor ismi (fullName) ko'rsatilmagan`);
      }
      if (!licenseNumber) {
        throw new Error(`${rowNum}-qator: Litsenziya raqami (licenseNumber) talab qilinadi`);
      }
      if (!WORLD_COUNTRIES.some(c => c.iso2 === countryId)) {
        throw new Error(`${rowNum}-qator: Noma'lum davlat ISO2 kodi: ${countryId}`);
      }

      // Ochiq reytingni hisoblash
      const score = calculateTransparentDoctorScore({
        avgRating: 4.8,
        reviewCount: 0,
        experienceYears,
        licenseVerified
      });

      const doctor = sanitizeDoctorPublicProfile({
        id: `doc-${countryId.toLowerCase()}-csv-${Date.now().toString(36)}-${index}`,
        fullName,
        name: fullName,
        specialty,
        specialtyId: specialty.toLowerCase().replace(/\s+/g, '_'),
        specialtyName: specialty,
        countryId,
        regionId,
        timeZone,
        licenseNumber,
        licenseVerified,
        experienceYears,
        rating: score.displayRating,
        reviewCount: 0,
        reviewsCount: 0,
        hospitalName: clinicName,
        source: 'clinic_csv',
        onCall: false,
        manualStatus: 'auto',
        schedule: {
          mon: ['09:00', '18:00'],
          tue: ['09:00', '18:00'],
          wed: ['09:00', '18:00'],
          thu: ['09:00', '18:00'],
          fri: ['09:00', '18:00']
        }
      });

      results.successful.push(doctor);
    } catch (err) {
      results.failed.push({ rowNum, error: err.message, data: row });
      results.errors.push(err.message);
    }
  });

  return results;
}
