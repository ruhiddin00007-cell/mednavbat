import { UZBEKISTAN_MEDICAL_DATA } from './uzbekistanMedicalData.js';

export const medicalData = UZBEKISTAN_MEDICAL_DATA;

/**
 * 30 daqiqalik vaqt slotlarini hosil qilish (09:00 dan 17:00 gacha, 13:00-14:00 tushlik hisobga olingan)
 */
export const STANDARD_TIME_SLOTS = [
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  // 13:00 - 14:00 Tushlik tanaffusi
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00'
];

export const LUNCH_BREAK = '13:00 - 14:00';

export const getRegions = () => {
  return medicalData.regions.map(r => ({
    id: r.id,
    name: r.name,
    shortName: r.shortName,
    hospitalsCount: r.hospitals.length,
    doctorsCount: r.hospitals.reduce((acc, h) => acc + h.doctors.length, 0)
  }));
};

export const getRegionById = (regionId) => {
  return medicalData.regions.find(r => r.id === regionId) || null;
};

export const getHospitalsByRegion = (regionId) => {
  const reg = getRegionById(regionId);
  return reg ? reg.hospitals : [];
};

export const getHospitalById = (hospitalId) => {
  for (const reg of medicalData.regions) {
    const hosp = reg.hospitals.find(h => h.id === hospitalId);
    if (hosp) return { ...hosp, regionId: reg.id, regionName: reg.name };
  }
  return null;
};

export const getAllHospitals = () => {
  const list = [];
  for (const reg of medicalData.regions) {
    for (const hosp of reg.hospitals) {
      list.push({ ...hosp, regionId: reg.id, regionName: reg.name });
    }
  }
  return list;
};

export const getAllDoctorsFromData = () => {
  const list = [];
  for (const reg of medicalData.regions) {
    for (const hosp of reg.hospitals) {
      for (const doc of hosp.doctors) {
        list.push({
          ...doc,
          fullName: doc.name,
          regionId: reg.id,
          regionName: reg.name,
          hospitalId: hosp.id,
          hospitalName: hosp.name,
          hospitalAddress: hosp.address,
          hospitalPhone: hosp.phone,
          availableSlots: STANDARD_TIME_SLOTS,
          workScheduleDays: doc.workDays || ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma']
        });
      }
    }
  }
  return list;
};

export const getSpecialtiesByHospital = (hospitalId) => {
  const hosp = getHospitalById(hospitalId);
  if (!hosp) return [];
  const map = new Map();
  for (const doc of hosp.doctors) {
    if (!map.has(doc.specialtyId)) {
      map.set(doc.specialtyId, {
        id: doc.specialtyId,
        name: doc.specialtyName
      });
    }
  }
  return Array.from(map.values());
};
