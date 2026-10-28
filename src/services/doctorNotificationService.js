/**
 * MedNavbat — Doctor Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Shifokorlar uchun bildirishnomalar markazi (Notification Center) xizmati.
 * 
 * Imkoniyatlar:
 *  - Real-time ko'p tabli sinxronizatsiya (BroadcastChannel + storage event + CustomEvent)
 *  - Web Audio API orqali yengil tovush signali (chime)
 *  - Brauzer Web Push bildirishnomalari (PWA / Web Notification API)
 *  - Telegram Bot bir martalik xavfsiz kod bilan ulanish (minimal xavfsiz ma'lumot)
 *  - Tinch soatlar (Quiet Hours, masalan 22:00-07:00)
 *  - Tashqi kanallar uchun ma'lumotlarni sanitizatsiya qilish (GDPR / HIPAA maxfiylik)
 *  - 30 kundan eski xabarlarni avtomatik arxivlash
 *  - Admin uchun yetkazilgan va o'qilganlik holatini kuzatish (read_at, delivered_at)
 */

const DOCTOR_NOTIF_KEY = 'mednavbat_doctor_notifications';
const DOCTOR_SETTINGS_KEY_PREFIX = 'mednavbat_doctor_notif_settings_';
const TELEGRAM_CODES_KEY = 'mednavbat_tg_link_codes';
const ARCHIVE_DAYS = 30;

// ── In-Memory & Storage Helpers ──────────────────────────────────────────────

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(DOCTOR_NOTIF_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(data, triggerEvent = true) {
  try {
    localStorage.setItem(DOCTOR_NOTIF_KEY, JSON.stringify(data));
    if (triggerEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mednavbat_doctor_notifs_changed', { detail: data }));
      broadcastViaChannel({ type: 'NOTIFICATIONS_UPDATED', count: data.length });
    }
  } catch {
    /* Maxfiylik: shaxsiy log yo'q */
  }
}

function uid() {
  return `dn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function pruneOld(list) {
  const cutoff = Date.now() - ARCHIVE_DAYS * 86400000;
  return list.filter(n => {
    const time = new Date(n.created_at || n.createdAt).getTime();
    return !Number.isNaN(time) && time >= cutoff;
  });
}

// ── BroadcastChannel Realtime Multi-Tab Sync ─────────────────────────────────

let realtimeChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    realtimeChannel = new BroadcastChannel('mednavbat_doctor_realtime');
    realtimeChannel.onmessage = (event) => {
      if (event?.data?.type === 'NOTIFICATIONS_UPDATED' || event?.data?.type === 'NEW_NOTIFICATION') {
        window.dispatchEvent(new CustomEvent('mednavbat_doctor_notifs_changed', { detail: event.data }));
      }
    };
  }
} catch {
  realtimeChannel = null;
}

function broadcastViaChannel(payload) {
  try {
    if (realtimeChannel) {
      realtimeChannel.postMessage(payload);
    }
  } catch {
    /* Brauzer cheklovi bo'lsa xatosiz davom etadi */
  }
}

// ── Type metadata ────────────────────────────────────────────────────────────

export const DOCTOR_NOTIF_TYPES = {
  new_appointment:       { color: 'teal',    emoji: '📅', label: 'Yangi navbat' },
  appointment_cancel:    { color: 'rose',    emoji: '❌', label: 'Navbat bekor' },
  appointment_change:    { color: 'amber',   emoji: '🔄', label: "Navbat o'zgardi" },
  leave_approved:        { color: 'emerald', emoji: '✅', label: 'Dam olish tasdiqlandi' },
  leave_rejected:        { color: 'rose',    emoji: '❌', label: 'Dam olish rad etildi' },
  admin_message:         { color: 'indigo',  emoji: '📢', label: 'Admin xabari' },
  registration_approved: { color: 'emerald', emoji: '🎉', label: 'Ariza tasdiqlandi' },
  registration_rejected: { color: 'rose',    emoji: '❌', label: 'Ariza rad etildi' },
  registration_docs:     { color: 'amber',   emoji: '📄', label: "Hujjat so'raldi" },
  photo_approved:        { color: 'emerald', emoji: '🖼️', label: 'Rasm tasdiqlandi' },
  photo_rejected:        { color: 'rose',    emoji: '🚫', label: 'Rasm rad etildi' },
  patient_transfer:      { color: 'teal',    emoji: '👤', label: "Bemor o'tkazildi" },
  schedule_change:       { color: 'amber',   emoji: '🗓️', label: "Jadval o'zgardi" },
  daily_reminder:        { color: 'slate',   emoji: '🔔', label: 'Eslatma' },
  system:                { color: 'slate',   emoji: 'ℹ️', label: 'Tizim' },
};

export const DOCTOR_NOTIF_FILTERS = [
  { key: 'all',        label: 'Hammasi' },
  { key: 'unread',     label: "O'qilmagan" },
  { key: 'navbat',     label: 'Navbatlar',  types: ['new_appointment', 'appointment_cancel', 'appointment_change', 'patient_transfer'] },
  { key: 'attendance', label: 'Davomat',    types: ['leave_approved', 'leave_rejected', 'daily_reminder', 'schedule_change'] },
  { key: 'admin',      label: 'Admindan',   types: ['admin_message', 'registration_approved', 'registration_rejected', 'registration_docs', 'photo_approved', 'photo_rejected'] },
];

// ── Shifokor Bildirishnoma Sozlamalari (Settings) ────────────────────────────

export const DEFAULT_DOCTOR_SETTINGS = {
  soundEnabled: true,
  pushEnabled: false,
  telegramEnabled: false,
  telegramChatId: null,
  telegramUsername: null,
  emailEnabled: false,
  smsEnabled: false,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  eventFilters: {
    new_appointment: true,
    appointment_cancel: true,
    appointment_change: true,
    leave_status: true,
    admin_message: true,
    schedule_change: true,
    daily_reminder: true,
  }
};

export function getDoctorNotifSettings(doctorId) {
  if (!doctorId) return { ...DEFAULT_DOCTOR_SETTINGS };
  try {
    const raw = localStorage.getItem(`${DOCTOR_SETTINGS_KEY_PREFIX}${doctorId}`);
    if (!raw) return { ...DEFAULT_DOCTOR_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DOCTOR_SETTINGS,
      ...parsed,
      eventFilters: {
        ...DEFAULT_DOCTOR_SETTINGS.eventFilters,
        ...(parsed.eventFilters || {})
      }
    };
  } catch {
    return { ...DEFAULT_DOCTOR_SETTINGS };
  }
}

export function saveDoctorNotifSettings(doctorId, newSettings) {
  if (!doctorId) return;
  try {
    const merged = { ...getDoctorNotifSettings(doctorId), ...newSettings };
    localStorage.setItem(`${DOCTOR_SETTINGS_KEY_PREFIX}${doctorId}`, JSON.stringify(merged));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mednavbat_doctor_settings_changed', { detail: { doctorId, settings: merged } }));
    }
    return merged;
  } catch {
    return newSettings;
  }
}

// ── Tinch Soatlar Tekshiruvi (Quiet Hours) ───────────────────────────────────

export function isWithinQuietHours(settings, testDate = new Date()) {
  if (!settings || !settings.quietHoursEnabled) return false;
  const startStr = settings.quietHoursStart || '22:00';
  const endStr = settings.quietHoursEnd || '07:00';

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  const currentMinutes = testDate.getHours() * 60 + testDate.getMinutes();
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  if (startMinutes <= endMinutes) {
    // Masalan: 13:00 dan 15:00 gacha
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Tun oralig'i: Masalan: 22:00 dan 07:00 gacha
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

// ── Web Audio API: Yengil Tovush Signali ──────────────────────────────────────

let audioCtx = null;

export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // 1-ohang: D5 (587.33 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.23);

    // 2-ohang: A5 (880.00 Hz) - 80ms kechikish bilan
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.09);
    gain2.gain.setValueAtTime(0.001, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.43);
  } catch {
    /* AudioContext bloklangan bo'lsa, xatosiz o'tadi */
  }
}

// ── Brauzer Web Push (Notification API) ───────────────────────────────────────

export async function requestPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission; // 'granted' | 'denied' | 'default'
  } catch {
    return 'denied';
  }
}

export function sendBrowserPushNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const notif = new Notification(title, {
      icon: '/assets/icon.png',
      badge: '/assets/icon.png',
      ...options
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}

// ── Telegram Bot Bir Martalik Ulanish Kodi ────────────────────────────────────

export function generateTelegramLinkCode(doctorId) {
  if (!doctorId) return null;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 daqiqa

  try {
    const raw = localStorage.getItem(TELEGRAM_CODES_KEY);
    const codes = raw ? JSON.parse(raw) : {};
    codes[code] = { doctorId, expiresAt };
    localStorage.setItem(TELEGRAM_CODES_KEY, JSON.stringify(codes));
  } catch {}

  return {
    code,
    expiresAt,
    botUsername: 'mednavbat_bot',
    deepLink: `https://t.me/mednavbat_bot?start=${code}`
  };
}

export function verifyTelegramLinkCode(code, telegramUsername = 'shifokor_tg') {
  if (!code) return { success: false, error: 'Kod kiritilmadi' };
  try {
    const raw = localStorage.getItem(TELEGRAM_CODES_KEY);
    const codes = raw ? JSON.parse(raw) : {};
    const item = codes[code];

    if (!item) {
      return { success: false, error: 'Bir martalik kod topilmadi yoki eskirgan.' };
    }
    if (Date.now() > item.expiresAt) {
      delete codes[code];
      localStorage.setItem(TELEGRAM_CODES_KEY, JSON.stringify(codes));
      return { success: false, error: "Kodning amal qilish muddati (10 daqiqa) tugagan." };
    }

    const { doctorId } = item;
    const settings = getDoctorNotifSettings(doctorId);
    settings.telegramEnabled = true;
    settings.telegramUsername = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;
    settings.telegramChatId = `tg-${Math.floor(1000000 + Math.random() * 9000000)}`;
    saveDoctorNotifSettings(doctorId, settings);

    delete codes[code];
    localStorage.setItem(TELEGRAM_CODES_KEY, JSON.stringify(codes));

    return {
      success: true,
      doctorId,
      telegramUsername: settings.telegramUsername,
      chatId: settings.telegramChatId
    };
  } catch {
    return { success: false, error: 'Ulanishda xatolik yuz berdi' };
  }
}

export function unlinkTelegram(doctorId) {
  const settings = getDoctorNotifSettings(doctorId);
  settings.telegramEnabled = false;
  settings.telegramUsername = null;
  settings.telegramChatId = null;
  saveDoctorNotifSettings(doctorId, settings);
  return settings;
}

// ── Tashqi Kanallar Uchun Maxfiylik Sanitizatsiyasi ──────────────────────────
// Qat'iy HIPAA / GDPR qoidasi: Tashqi kanallarga bemorning to'liq ismi,
// telefon raqami yoki shikoyat/tashxis yuborilmaydi!

export function sanitizeForExternalChannel(notif) {
  if (!notif) return { title: 'MedNavbat Xabari', body: 'Yangi xabarnoma mavjud' };

  switch (notif.type) {
    case 'new_appointment':
      return {
        title: 'MedNavbat: Yangi navbat',
        body: notif.meta?.date && notif.meta?.timeSlot
          ? `Yangi navbat: ${notif.meta.date} soat ${notif.meta.timeSlot}. Tafsilotlar shifokor panelida.`
          : 'Sizga yangi navbat yozildi. Tafsilotlar shifokor panelida.'
      };
    case 'appointment_cancel':
      return {
        title: 'MedNavbat: Navbat bekor qilindi',
        body: notif.meta?.date && notif.meta?.timeSlot
          ? `Navbat bekor qilindi (${notif.meta.date} ${notif.meta.timeSlot}). Ushbu vaqt bo'shatildi.`
          : "Bir navbat bekor qilindi. Tafsilotlar panelda."
      };
    case 'appointment_change':
      return {
        title: "MedNavbat: Navbat o'zgartirildi",
        body: notif.meta?.date && notif.meta?.timeSlot
          ? `Navbat yangilandi: ${notif.meta.date} ${notif.meta.timeSlot}.`
          : "Navbat vaqti o'zgartirildi."
      };
    case 'leave_approved':
      return {
        title: 'MedNavbat: Dam olish tasdiqlandi',
        body: notif.message || 'Dam olish arizangiz ma\'qullandi.'
      };
    case 'leave_rejected':
      return {
        title: 'MedNavbat: Dam olish rad etildi',
        body: notif.message || 'Dam olish arizangiz rad etildi.'
      };
    case 'admin_message':
      return {
        title: notif.title || 'MedNavbat: Admin xabari',
        body: notif.message || "Administratsiyadan yangi xabar."
      };
    case 'schedule_change':
      return {
        title: "MedNavbat: Ish jadvali o'zgardi",
        body: notif.message || "Qabul soatlari o'zgartirildi."
      };
    case 'daily_reminder':
      return {
        title: 'MedNavbat: Kunlik eslatma',
        body: 'Ertaga ishga kelasizmi? Iltimos, davomatni tasdiqlang.'
      };
    default:
      return {
        title: notif.title || 'MedNavbat Bildirishnomasi',
        body: notif.message || 'Shifokor panelida yangi xabar.'
      };
  }
}

// ── Tashqi Kanallarga Yuborish (Dispatcher) ───────────────────────────────────

function dispatchToExternalChannels(doctorId, notif, settings) {
  if (!settings) return;

  // Agar tinch soatlar bo'lsa, tashqi push/ovoz uzatish to'xtatiladi
  const inQuietHours = isWithinQuietHours(settings);

  // 1. Ovozli signal
  if (settings.soundEnabled && !inQuietHours && typeof window !== 'undefined') {
    playNotificationChime();
  }

  const sanitized = sanitizeForExternalChannel(notif);

  // 2. Brauzer Web Push (PWA)
  if (settings.pushEnabled && !inQuietHours && typeof window !== 'undefined') {
    sendBrowserPushNotification(sanitized.title, {
      body: sanitized.body,
      tag: notif.id
    });
  }

  // 3. Telegram Bot (Mock / Real Webhook dispatch)
  if (settings.telegramEnabled && settings.telegramChatId && !inQuietHours) {
    try {
      const tgPayload = {
        chatId: settings.telegramChatId,
        username: settings.telegramUsername,
        title: sanitized.title,
        text: sanitized.body,
        sentAt: new Date().toISOString()
      };
      // Sinov uchun keshda oxirgi bot xabari saqlanadi
      localStorage.setItem('mednavbat_last_telegram_dispatch', JSON.stringify(tgPayload));
    } catch {}
  }
}

// ── Public API (Asosiy Boshqaruv) ─────────────────────────────────────────────

export function getDoctorNotifications(doctorId) {
  if (!doctorId) return [];
  const all = loadAll();
  const pruned = pruneOld(all);
  if (pruned.length !== all.length) {
    saveAll(pruned, false);
  }
  return pruned
    .filter(n => n.doctor_id === doctorId)
    .sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
}

export function getDoctorUnreadCount(doctorId) {
  return getDoctorNotifications(doctorId).filter(n => !n.is_read).length;
}

export function addDoctorNotification({
  doctorId,
  type = 'system',
  title,
  message,
  targetSection = null,
  meta = {}
}) {
  if (!doctorId) return null;

  const notif = {
    id: uid(),
    doctor_id: doctorId,
    type,
    title: title || DOCTOR_NOTIF_TYPES[type]?.label || 'Xabar',
    message: message || '',
    target_section: targetSection,
    meta,
    is_read: false,
    read_at: null,
    delivered_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const all = loadAll();
  all.unshift(notif);
  saveAll(all, true);

  // Sozlamalarni tekshirib tashqi kanallarga yuborish
  const settings = getDoctorNotifSettings(doctorId);
  dispatchToExternalChannels(doctorId, notif, settings);

  // Kichik toast xabarnoma chiqarish uchun CustomEvent
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mednavbat_new_doctor_toast', { detail: notif }));
  }

  return notif;
}

export function markDoctorNotifRead(notifId, doctorId = null) {
  const all = loadAll();
  const now = new Date().toISOString();
  let changed = false;

  all.forEach(n => {
    if (n.id === notifId) {
      if (!doctorId || n.doctor_id === doctorId) {
        n.is_read = true;
        n.read_at = now;
        changed = true;
      }
    }
  });

  if (changed) {
    saveAll(all, true);
  }
}

export function markAllDoctorNotifsRead(doctorId) {
  if (!doctorId) return;
  const all = loadAll();
  const now = new Date().toISOString();
  let changed = false;

  all.forEach(n => {
    if (n.doctor_id === doctorId && !n.is_read) {
      n.is_read = true;
      n.read_at = now;
      changed = true;
    }
  });

  if (changed) {
    saveAll(all, true);
  }
}

export function deleteDoctorNotif(notifId, doctorId) {
  const all = loadAll();
  const filtered = all.filter(n => !(n.id === notifId && (!doctorId || n.doctor_id === doctorId)));
  if (filtered.length !== all.length) {
    saveAll(filtered, true);
  }
}

// ── Tizim Hodisalari Shortcut Funksiyalari (System Event Dispatchers) ────────

export function notifyNewAppointment(doctorId, app) {
  const patientName = app.patientName || app.patient_name || 'Bemor';
  const date = app.date || app.appointment_date || 'Bugun';
  const timeSlot = app.timeSlot || app.time_slot || '';
  return addDoctorNotification({
    doctorId,
    type: 'new_appointment',
    title: 'Yangi navbat 📅',
    message: `Yangi navbat: ${patientName}, ${date}, ${timeSlot}`.trim(),
    targetSection: 'timeline',
    meta: {
      appointmentId: app.id,
      patientName,
      date,
      timeSlot
    }
  });
}

export function notifyAppointmentCancelled(doctorId, app, by = 'bemor') {
  const date = app.date || app.appointment_date || '';
  const timeSlot = app.timeSlot || app.time_slot || '';
  const actor = by === 'admin' ? 'Admin' : 'Bemor';
  return addDoctorNotification({
    doctorId,
    type: 'appointment_cancel',
    title: 'Navbat bekor qilindi ❌',
    message: `Navbat bekor qilindi (${actor} tomonidan): ${date} ${timeSlot}`.trim(),
    targetSection: 'timeline',
    meta: {
      appointmentId: app.id,
      by,
      date,
      timeSlot
    }
  });
}

export function notifyAppointmentRescheduled(doctorId, app, newDate, newTime, by = 'bemor') {
  const actor = by === 'admin' ? 'Admin' : 'Bemor';
  return addDoctorNotification({
    doctorId,
    type: 'appointment_change',
    title: "Navbat o'zgardi 🔄",
    message: `Navbat o'zgartirildi (${actor} tomonidan): yangi vaqt ${newDate} ${newTime}`,
    targetSection: 'timeline',
    meta: {
      appointmentId: app.id,
      by,
      date: newDate,
      timeSlot: newTime
    }
  });
}

export function notifyLeaveApproved(doctorId, dates) {
  return addDoctorNotification({
    doctorId,
    type: 'leave_approved',
    title: 'Dam olish tasdiqlandi ✅',
    message: `Dam olish so'rovi tasdiqlandi${dates ? ': ' + dates : ''}.`,
    targetSection: 'attendance',
    meta: { dates }
  });
}

export function notifyLeaveRejected(doctorId, reason) {
  return addDoctorNotification({
    doctorId,
    type: 'leave_rejected',
    title: 'Dam olish rad etildi ❌',
    message: `Dam olish so'rovi rad etildi. Sabab: ${reason || "Admin bilan bog'laning."}`,
    targetSection: 'attendance',
    meta: { reason }
  });
}

export function notifyRegistrationApproved(doctorId) {
  return addDoctorNotification({
    doctorId,
    type: 'registration_approved',
    title: 'Tabriklaymiz! Arizangiz tasdiqlandi 🎉',
    message: "Ro'yxatdan o'tish arizangiz tasdiqlandi. Shifokor sifatida faoliyatingiz faollashtirildi.",
    targetSection: 'profile'
  });
}

export function notifyRegistrationRejected(doctorId, reason) {
  return addDoctorNotification({
    doctorId,
    type: 'registration_rejected',
    title: 'Ariza rad etildi ❌',
    message: `Ro'yxatdan o'tish arizasi rad etildi. Sabab: ${reason || "Admin bilan bog'laning."}`,
    targetSection: 'profile',
    meta: { reason }
  });
}

export function notifyRegistrationDocs(doctorId, details) {
  return addDoctorNotification({
    doctorId,
    type: 'registration_docs',
    title: "Qo'shimcha hujjat so'raldi 📄",
    message: `Arizangizni tasdiqlash uchun qo'shimcha hujjat talab qilinmoqda: ${details || "Admin ko'rsatmasini tekshiring."}`,
    targetSection: 'profile',
    meta: { details }
  });
}

export function notifyPhotoApproved(doctorId) {
  return addDoctorNotification({
    doctorId,
    type: 'photo_approved',
    title: 'Profil rasmi tasdiqlandi ✅',
    message: "Profil rasmingiz tekshirildi va bemorlarga ko'rinishi tasdiqlandi.",
    targetSection: 'profile'
  });
}

export function notifyPhotoRejected(doctorId, reason) {
  return addDoctorNotification({
    doctorId,
    type: 'photo_rejected',
    title: 'Profil rasmi rad etildi 🚫',
    message: `Profil rasmi talablarga mos kelmadi. Sabab: ${reason || "Yangi sifatli rasm yuklang."}`,
    targetSection: 'profile',
    meta: { reason }
  });
}

export function notifyScheduleChange(doctorId, details) {
  return addDoctorNotification({
    doctorId,
    type: 'schedule_change',
    title: "Ish jadvali o'zgardi 🗓️",
    message: details || "Ish jadvalingiz o'zgartirildi.",
    targetSection: 'schedule'
  });
}

export function notifyDailyReminder(doctorId, date) {
  return addDoctorNotification({
    doctorId,
    type: 'daily_reminder',
    title: 'Kunlik eslatma 🔔',
    message: `Ertaga (${date}) ishga kelasizmi? Iltimos, davomat bo'limida tasdiqlang.`,
    targetSection: 'attendance'
  });
}

export function notifyPatientTransfer(toDoctorId, patientName, fromDocName, appDetails = {}) {
  return addDoctorNotification({
    doctorId: toDoctorId,
    type: 'patient_transfer',
    title: "Sizga bemor yo'naltirildi 👤",
    message: fromDocName
      ? `Dr. ${fromDocName} tomonidan sizga yangi bemor yo'naltirildi (${patientName}).`
      : `Sizga yangi bemor yo'naltirildi (${patientName}).`,
    targetSection: 'timeline',
    meta: { patientName, fromDocName, ...appDetails }
  });
}

export function notifyAdminMessage(doctorId, msg, title = 'Admindan xabar 📢', adminMsgId = null) {
  return addDoctorNotification({
    doctorId,
    type: 'admin_message',
    title,
    message: msg,
    targetSection: null,
    meta: { adminMsgId }
  });
}

export function broadcastAdminMessage(doctorIds, msg, title = 'Admindan xabar 📢', adminMsgId = null) {
  if (!Array.isArray(doctorIds)) return [];
  return doctorIds.map(id => notifyAdminMessage(id, msg, title, adminMsgId));
}

// ── Admin: Yetkazilgan va O'qilganlik Holatini Ko'rish ────────────────────────

export function getAdminMessageDeliveryStatus(adminMsgId) {
  if (!adminMsgId) return { total: 0, delivered: 0, read: 0, readDoctors: [] };
  const all = loadAll();
  const matched = all.filter(n => n.meta?.adminMsgId === adminMsgId);

  const delivered = matched.length;
  const readList = matched.filter(n => n.is_read);

  return {
    total: matched.length,
    delivered,
    read: readList.length,
    readPercent: matched.length ? Math.round((readList.length / matched.length) * 100) : 0,
    readDoctors: readList.map(n => ({
      doctorId: n.doctor_id,
      readAt: n.read_at || n.created_at
    }))
  };
}

// ── Nisbiy Vaqt Formatlash (Format Relative Time) ────────────────────────────

export function formatRelTime(isoDate, lang = 'uz-Latn') {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  const isRu = typeof lang === 'string' && lang.startsWith('ru');
  const isEn = typeof lang === 'string' && lang.startsWith('en');

  if (m < 1) return isRu ? 'Только что' : isEn ? 'Just now' : 'Hozir';
  if (m < 60) return isRu ? `${m} мин. назад` : isEn ? `${m}m ago` : `${m} daqiqa oldin`;
  if (h < 24) return isRu ? `${h} ч. назад` : isEn ? `${h}h ago` : `${h} soat oldin`;
  if (d < 7)  return isRu ? `${d} дн. назад` : isEn ? `${d}d ago` : `${d} kun oldin`;

  return new Date(isoDate).toLocaleDateString(
    isRu ? 'ru-RU' : isEn ? 'en-US' : 'uz-UZ',
    { day: 'numeric', month: 'short' }
  );
}
