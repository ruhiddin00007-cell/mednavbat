/**
 * MedNavbat — Dynamic TimeZone-Aware Doctor Availability Engine
 * ─────────────────────────────────────────────────────────────
 * Real-vaqt online/offline holati:
 *  1. Shifokorning O'Z IANA vaqt zonasi (masalan, "Asia/Tashkent", "America/New_York", "Europe/London")
 *     va uning haftalik ish jadvali bo'yicha hisoblanadi.
 *  2. Intl.DateTimeFormat yordamida DST (Daylight Saving Time) va soat zonalari hisoblanadi.
 *  3. Yarim tun ("24" / 24:00) va tuni bilan o'tadigan smenalar (masalan 20:00 - 04:00) to'g'ri tekshiriladi.
 *  4. onCall === true bo'lsa -> doim ONLINE.
 *  5. manualStatus === 'offline' bo'lsa -> jadvaldan qat'i nazar doim OFFLINE.
 *  6. Offline bo'lganda keyingi smenagacha qancha vaqt qolgani ("Yana X soatdan keyin online bo'ladi") hisoblanadi.
 */

const DAYS_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Vaqt stringini ("HH:mm" yoki "24:00") daqiqalarga aylantirish
 * @param {string} timeStr - Masalan "09:00", "18:30", "24:00", "24"
 * @returns {number} 0 dan 1440 gacha daqiqalar soni
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr && timeStr !== 0) return null;
  const s = String(timeStr).trim();
  if (s === '24' || s === '24:00') return 24 * 60; // 1440 daqiqa (yarim tun oxiri)

  const parts = s.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;

  if (isNaN(hours)) return null;
  return hours * 60 + (isNaN(minutes) ? 0 : minutes);
}

/**
 * Berilgan sananing shifokor IANA vaqt zonasidagi soat, daqiqa va kunini aniqlash
 * Intl.DateTimeFormat DST (yozgi/qishki vaqt) o'zgarishlarini tabiiy hisoblaydi.
 */
export function getLocalTimeInZone(date = new Date(), timeZone = 'Asia/Tashkent') {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(date);
    const partMap = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }

    const hour = parseInt(partMap.hour, 10);
    const minute = parseInt(partMap.minute, 10);
    const weekdayStr = (partMap.weekday || '').toLowerCase(); // 'sun', 'mon', ...
    const dayKey = DAYS_SHORT.find(d => weekdayStr.startsWith(d)) || 'mon';
    const dayIndex = DAYS_SHORT.indexOf(dayKey);

    return {
      hour,
      minute,
      totalMinutes: hour * 60 + minute,
      dayKey,
      dayIndex,
      timeZone
    };
  } catch (_e) {
    // Agar noto'g'ri timeZone berilsa, UTC yoki Asia/Tashkent fallback
    const utcHour = date.getUTCHours();
    const utcMin = date.getUTCMinutes();
    const utcDay = date.getUTCDay();
    return {
      hour: utcHour,
      minute: utcMin,
      totalMinutes: utcHour * 60 + utcMin,
      dayKey: DAYS_SHORT[utcDay],
      dayIndex: utcDay,
      timeZone: 'UTC'
    };
  }
}

/**
 * Standart schedule obyektini normalizatsiya qilish
 * Agar shifokorda schedule yo'q bo'lsa, availableSlots yoki default 09:00-18:00 dan hosil qilinadi.
 */
export function normalizeSchedule(doctor) {
  if (doctor?.schedule && typeof doctor.schedule === 'object') {
    return doctor.schedule;
  }

  // Agar slots bo'lsa
  if (Array.isArray(doctor?.availableSlots) && doctor.availableSlots.length > 0) {
    const mins = doctor.availableSlots.map(timeStringToMinutes).filter(m => m !== null);
    if (mins.length > 0) {
      const minVal = Math.min(...mins);
      const maxVal = Math.max(...mins) + 30; // 30 min buffer
      const startH = String(Math.floor(minVal / 60)).padStart(2, '0');
      const startM = String(minVal % 60).padStart(2, '0');
      const endH = String(Math.floor(maxVal / 60)).padStart(2, '0');
      const endM = String(maxVal % 60).padStart(2, '0');
      const slotRange = [`${startH}:${startM}`, `${endH}:${endM}`];

      return {
        mon: slotRange,
        tue: slotRange,
        wed: slotRange,
        thu: slotRange,
        fri: slotRange,
        sat: slotRange,
        sun: null
      };
    }
  }

  // Standart ish jadvali: Dushanba-Juma 09:00 - 18:00
  const defaultShift = ['09:00', '18:00'];
  return {
    mon: defaultShift,
    tue: defaultShift,
    wed: defaultShift,
    thu: defaultShift,
    fri: defaultShift,
    sat: ['09:00', '15:00'],
    sun: null
  };
}

/**
 * Shifokorning real-vaqt online/offline holatini hisoblash
 *
 * @param {Object} doctor - Shifokor obyekti
 * @param {Date} [referenceDate] - Hisoblash o'lchov sanasi (default: hozirgi vaqt)
 * @returns {Object} { isOnline, statusLabel, nextOnlineText, waitHours, reason, localTimeStr }
 */
export function calculateDoctorAvailability(doctor, referenceDate = new Date()) {
  if (!doctor) {
    return {
      isOnline: false,
      statusLabel: 'OFFLINE',
      nextOnlineText: "Ma'lumot mavjud emas",
      waitHours: null,
      reason: 'no_doctor_data',
      localTimeStr: ''
    };
  }

  // 1. Qo'lda o'rnatilgan "offline" holati har qanday jadvalni bekor qiladi
  if (doctor.manualStatus === 'offline') {
    return {
      isOnline: false,
      statusLabel: 'OFFLINE',
      nextOnlineText: 'Shifokor offline rejimida',
      waitHours: null,
      reason: 'manual_offline',
      localTimeStr: ''
    };
  }

  // 2. onCall (shoshilinch chaqiruvdagi shifokor) doimo online
  if (doctor.onCall === true || doctor.available24_7 === true) {
    return {
      isOnline: true,
      statusLabel: 'ONLINE (24/7)',
      nextOnlineText: 'Hozir qabulda (Navbatchi)',
      waitHours: 0,
      reason: 'on_call',
      localTimeStr: ''
    };
  }

  const timeZone = doctor.timeZone || 'Asia/Tashkent';
  const local = getLocalTimeInZone(referenceDate, timeZone);
  const schedule = normalizeSchedule(doctor);
  const todayShift = schedule[local.dayKey];

  const localTimeStr = `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`;

  // Kechagi kundan o'tgan tungi smena tekshiruvi (masalan, kecha 20:00 dan bugun 04:00 gacha)
  const prevDayIndex = (local.dayIndex + 6) % 7;
  const prevDayKey = DAYS_SHORT[prevDayIndex];
  const prevShift = schedule[prevDayKey];

  if (Array.isArray(prevShift) && prevShift.length >= 2) {
    const prevStart = timeStringToMinutes(prevShift[0]);
    const prevEnd = timeStringToMinutes(prevShift[1]);

    if (prevStart !== null && prevEnd !== null && prevEnd < prevStart) {
      // Kechagi smena yarim tundan o'tgan
      if (local.totalMinutes < prevEnd) {
        return {
          isOnline: true,
          statusLabel: 'ONLINE',
          nextOnlineText: `Tungi smena ${prevShift[1]} gacha`,
          waitHours: 0,
          reason: 'overnight_shift_active',
          localTimeStr
        };
      }
    }
  }

  // Bugungi kun smenasi
  if (Array.isArray(todayShift) && todayShift.length >= 2) {
    const startMin = timeStringToMinutes(todayShift[0]);
    const endMin = timeStringToMinutes(todayShift[1]);

    if (startMin !== null && endMin !== null) {
      // Oddiy smena (masalan 09:00 dan 18:00 gacha yoki 09:00 dan 24:00 gacha)
      if (endMin >= startMin) {
        if (local.totalMinutes >= startMin && local.totalMinutes < endMin) {
          return {
            isOnline: true,
            statusLabel: 'ONLINE',
            nextOnlineText: `Qabul ${todayShift[1]} gacha`,
            waitHours: 0,
            reason: 'regular_shift_active',
            localTimeStr
          };
        }
      } else {
        // Tungi smena bugun boshlandi (masalan 20:00 dan ertasi 04:00 gacha)
        if (local.totalMinutes >= startMin) {
          return {
            isOnline: true,
            statusLabel: 'ONLINE',
            nextOnlineText: `Tungi qabul boshlangan (${todayShift[1]} gacha)`,
            waitHours: 0,
            reason: 'overnight_start_active',
            localTimeStr
          };
        }
      }
    }
  }

  // Agar shifokor hozir OFFLINE bo'lsa -> Keyingi online bo'lish vaqtini hisoblaymiz
  const nextInfo = findNextOnlineSlot(schedule, local);

  let nextOnlineText = '';
  if (nextInfo.hoursDiff <= 1) {
    nextOnlineText = `Yana ${Math.max(1, nextInfo.minutesDiff)} daqiqadan keyin online bo'ladi`;
  } else if (nextInfo.hoursDiff <= 24) {
    nextOnlineText = `Yana ${nextInfo.hoursDiff} soatdan keyin online bo'ladi (${nextInfo.targetTime})`;
  } else {
    nextOnlineText = `${nextInfo.dayNameUz} kuni ${nextInfo.targetTime} da online bo'ladi`;
  }

  return {
    isOnline: false,
    statusLabel: 'OFFLINE',
    nextOnlineText,
    waitHours: nextInfo.hoursDiff,
    reason: 'outside_schedule',
    localTimeStr
  };
}

/**
 * Keyingi ish smenasigacha qancha vaqt qolganini hisoblash
 */
function findNextOnlineSlot(schedule, local) {
  const UZ_DAYS = {
    mon: 'Dushanba',
    tue: 'Seshanba',
    wed: 'Chorshanba',
    thu: 'Payshanba',
    fri: 'Juma',
    sat: 'Shanba',
    sun: 'Yakshanba'
  };

  // Bugun kechqurun boshlanadimi?
  const todayShift = schedule[local.dayKey];
  if (Array.isArray(todayShift) && todayShift.length >= 2) {
    const startMin = timeStringToMinutes(todayShift[0]);
    if (startMin !== null && startMin > local.totalMinutes) {
      const diffMins = startMin - local.totalMinutes;
      const hoursDiff = Math.ceil(diffMins / 60);
      return {
        hoursDiff,
        minutesDiff: diffMins,
        targetTime: todayShift[0],
        dayNameUz: 'Bugun'
      };
    }
  }

  // Keyingi 7 kun bo'ylab qidirish
  for (let offset = 1; offset <= 7; offset++) {
    const nextDayIndex = (local.dayIndex + offset) % 7;
    const nextDayKey = DAYS_SHORT[nextDayIndex];
    const shift = schedule[nextDayKey];

    if (Array.isArray(shift) && shift.length >= 2) {
      const startMin = timeStringToMinutes(shift[0]);
      if (startMin !== null) {
        const totalMinutesUntil = (offset * 24 * 60) - local.totalMinutes + startMin;
        const hoursDiff = Math.ceil(totalMinutesUntil / 60);
        return {
          hoursDiff,
          minutesDiff: totalMinutesUntil,
          targetTime: shift[0],
          dayNameUz: offset === 1 ? 'Ertaga' : UZ_DAYS[nextDayKey]
        };
      }
    }
  }

  return {
    hoursDiff: 48,
    minutesDiff: 48 * 60,
    targetTime: '09:00',
    dayNameUz: 'Yaqin kunlarda'
  };
}
