/**
 * MedNavbat — Real-time Availability Status Hook
 * ───────────────────────────────────────────────
 * Shifokorning O'Z IANA vaqt zonasi va ish jadvaliga asoslangan real-vaqt tizimi.
 * Har 30 soniyada sahifani yangilamasdan avtomatik yangilanadi.
 */

import { useState, useEffect } from 'react';
import { calculateDoctorAvailability, getLocalTimeInZone } from '../utils/availabilityEngine';

export { calculateDoctorAvailability, getLocalTimeInZone };

/**
 * Bitta shifokor uchun real-vaqt statusi
 */
export function useDoctorStatus(doctor) {
  const [availability, setAvailability] = useState(() => calculateDoctorAvailability(doctor));

  useEffect(() => {
    // Shifokor o'zgarganda darhol qayta hisoblash
    setAvailability(calculateDoctorAvailability(doctor));

    // Har 30 soniyada avtomatik yangilanish (sahifa yangilanishisiz)
    const interval = setInterval(() => {
      setAvailability(calculateDoctorAvailability(doctor));
    }, 30000);

    return () => clearInterval(interval);
  }, [doctor]);

  const { isOnline, statusLabel, nextOnlineText, waitHours, reason, localTimeStr } = availability;

  if (isOnline) {
    return {
      isOnline: true,
      statusLabel: 'ONLINE',
      statusColor: 'bg-emerald-500',
      dotClass: 'w-2 h-2 rounded-full bg-emerald-400 animate-ping',
      badgeClass: 'bg-emerald-500 text-white shadow-xs',
      pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      nextOnlineText,
      localTimeStr,
      offlineNote: null,
      reason
    };
  }

  return {
    isOnline: false,
    statusLabel: 'OFFLINE',
    statusColor: 'bg-slate-400',
    dotClass: 'w-2 h-2 rounded-full bg-slate-300',
    badgeClass: 'bg-slate-500 text-white shadow-xs',
    pillClass: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    nextOnlineText,
    localTimeStr,
    offlineNote: nextOnlineText,
    reason
  };
}

/**
 * Shifokorlar ro'yxati uchun universal hook
 */
export default function useAvailabilityStatus() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 30000); // 30 soniya
    return () => clearInterval(timer);
  }, []);

  const getDoctorStatus = (doctor) => {
    const availability = calculateDoctorAvailability(doctor);
    const { isOnline, nextOnlineText, localTimeStr, reason } = availability;

    return {
      isOnline,
      statusLabel: isOnline ? 'ONLINE' : 'OFFLINE',
      statusColor: isOnline ? 'bg-emerald-500' : 'bg-slate-400',
      dotClass: isOnline ? 'w-2 h-2 rounded-full bg-emerald-400 animate-ping' : 'w-2 h-2 rounded-full bg-slate-300',
      badgeClass: isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white',
      pillClass: isOnline
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300',
      nextOnlineText,
      localTimeStr,
      offlineNote: isOnline ? null : nextOnlineText,
      reason
    };
  };

  return { tick, getDoctorStatus };
}
