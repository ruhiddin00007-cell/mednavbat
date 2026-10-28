/**
 * MedNavbat — Universal Backend API Client & Real-time Subscription
 * ─────────────────────────────────────────────────────────────────
 * Foydalanuvchi so'ragan endpoints:
 *  - POST /api/auth/send-otp
 *  - POST /api/auth/verify-otp
 *  - GET /api/tickets/:id
 *  - GET /api/tickets/verify/:token
 *  - GET /api/countries
 *  - GET /api/countries/:iso2/regions
 *  - GET /api/doctors
 *  - GET /api/doctors/:id
 *  - Stream /api/doctors/status
 */

import {
  getActiveCountriesWithDoctorStats,
  getRegionsByCountryWithStats,
  queryDoctors,
  getDoctorById,
  getAllStructuredDoctors
} from '../data/doctorsRepository.js';

import {
  sendOtpToUser,
  verifyUserOtp
} from '../services/auth/otp.service.js';

import {
  generateUserTicket,
  getTicketById,
  verifyTicketToken
} from '../services/auth/ticket.service.js';

/**
 * 1. POST /api/auth/send-otp
 */
export async function sendRegistrationOtp(phone, fullName = '') {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, fullName })
    });
    const data = await res.json();
    return data;
  } catch (_e) {
    // Local / Capacitor fallback
    return await sendOtpToUser(phone, fullName);
  }
}

/**
 * 2. POST /api/auth/verify-otp
 */
export async function verifyRegistrationOtp(phone, code, fullName = '') {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, fullName })
    });
    const data = await res.json();
    return data;
  } catch (_e) {
    // Local / Capacitor fallback
    const verifyResult = verifyUserOtp(phone, code);
    if (!verifyResult.success) {
      return verifyResult;
    }
    const ticket = generateUserTicket({
      phone: verifyResult.phone,
      fullName: fullName || verifyResult.fullName,
      formattedPhone: verifyResult.formattedPhone
    });
    return {
      success: true,
      user: {
        phone: verifyResult.phone,
        formattedPhone: verifyResult.formattedPhone,
        fullName: ticket.fullName,
        verifiedAt: verifyResult.verifiedAt
      },
      ticket
    };
  }
}

/**
 * 3. GET /api/tickets/:id
 */
export async function fetchTicketById(id) {
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {
    // Local fallback
  }
  return getTicketById(id);
}

/**
 * 4. GET /api/tickets/verify/:token
 */
export async function verifyTicketByToken(token) {
  try {
    const res = await fetch(`/api/tickets/verify/${encodeURIComponent(token)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {
    // Local fallback
  }
  return verifyTicketToken(token);
}

/**
 * 5. GET /countries
 */
export async function fetchCountries() {
  try {
    const res = await fetch('/api/countries');
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {
    // Local / Capacitor fallback
  }
  return getActiveCountriesWithDoctorStats();
}

/**
 * 6. GET /countries/:iso2/regions
 */
export async function fetchCountryRegions(iso2) {
  try {
    const res = await fetch(`/api/countries/${encodeURIComponent(iso2)}/regions`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {
    // Local fallback
  }
  return getRegionsByCountryWithStats(iso2);
}

/**
 * 7. GET /doctors?country=&region=&specialty=&online=true&sort=rating
 */
export async function fetchDoctors(params = {}) {
  const query = new URLSearchParams();
  if (params.country) query.set('country', params.country);
  if (params.region) query.set('region', params.region);
  if (params.specialty) query.set('specialty', params.specialty);
  if (params.online !== undefined && params.online !== null) query.set('online', String(params.online));
  if (params.sort) query.set('sort', params.sort);

  try {
    const res = await fetch(`/api/doctors?${query.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {
    // Local fallback
  }
  return queryDoctors(params);
}

/**
 * 8. GET /doctors/:id
 */
export async function fetchDoctorById(id) {
  try {
    const res = await fetch(`/api/doctors/${encodeURIComponent(id)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {
    // Local fallback
  }
  return getDoctorById(id);
}

/**
 * 9. Real-time Status Stream / Subscription
 */
export function subscribeToDoctorStatusStream(onUpdate, intervalMs = 30000) {
  const runUpdate = () => {
    try {
      const activeCountries = getActiveCountriesWithDoctorStats();
      const doctors = queryDoctors({ includeUnverified: true });
      onUpdate({
        timestamp: new Date().toISOString(),
        activeCountries,
        doctors
      });
    } catch (err) {
      console.error('Doctor status stream error:', err);
    }
  };

  runUpdate();
  const timer = setInterval(runUpdate, intervalMs);

  return () => clearInterval(timer);
}

/**
 * 10. POST /api/doctor/register
 */
export async function registerDoctorApi(doctorData) {
  try {
    const res = await fetch('/api/doctor/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Server xatosi (${res.status})`,
        status: res.status
      };
    }
    return data;
  } catch (err) {
    console.error('registerDoctorApi network error:', err);
    return {
      success: false,
      error: "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring yoki keyinroq urinib ko'ring."
    };
  }
}

/**
 * 11. POST/GET /api/doctor/verify-email
 */
export async function verifyDoctorEmailApi({ token, code, email }) {
  try {
    const res = await fetch('/api/doctor/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, code, email })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Tasdiqlashda xatolik (${res.status})`,
        status: res.status
      };
    }
    return data;
  } catch (err) {
    console.error('verifyDoctorEmailApi error:', err);
    return {
      success: false,
      error: "Serverga ulanib bo'lmadi."
    };
  }
}

/**
 * 12. POST /api/doctor/resend-verification
 */
export async function resendDoctorVerificationApi(email) {
  try {
    const res = await fetch('/api/doctor/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Xabarni qayta yuborib bo'lmadi",
        waitSeconds: data.waitSeconds,
        status: res.status
      };
    }
    return data;
  } catch (err) {
    console.error('resendDoctorVerificationApi error:', err);
    return {
      success: false,
      error: "Serverga ulanib bo'lmadi."
    };
  }
}

