/**
 * MedNavbat — Doctor Attendance Service
 * Shifokor davomati, dam olish so'rovlari va kunlik eslatmalar
 */
import { notifyLeaveApproved, notifyLeaveRejected } from './doctorNotificationService.js';

const ATTENDANCE_KEY = 'mednavbat_doctor_attendance';
const LEAVE_KEY = 'mednavbat_doctor_leaves';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ── Attendance (daily check-in / check-out) ───────────────────────────────────

function loadAttendance() {
  try { return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '{}'); }
  catch { return {}; }
}

function saveAttendance(data) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('mednavbat_attendance_changed'));
}

/**
 * Bugungi davomat holati
 * @param {string} doctorId
 * @returns {{ status: 'present'|'absent'|'leave'|null, checkedInAt: string|null }}
 */
export function getTodayAttendance(doctorId) {
  const all = loadAttendance();
  const key = `${doctorId}_${todayStr()}`;
  return all[key] || { status: null, checkedInAt: null };
}

/**
 * Ertangi kun holatini olish
 */
export function getTomorrowAttendance(doctorId) {
  const all = loadAttendance();
  const key = `${doctorId}_${tomorrowStr()}`;
  return all[key] || { status: null };
}

/**
 * Shifokor "Ishga keldim" tugmasini bosdi
 */
export function checkInDoctor(doctorId) {
  const all = loadAttendance();
  const key = `${doctorId}_${todayStr()}`;
  all[key] = {
    status: 'present',
    checkedInAt: new Date().toISOString(),
    date: todayStr(),
  };
  saveAttendance(all);
  return all[key];
}

/**
 * Shifokor "Kelmadim" deb belgiladi (ertalabki savol — Yo'q variant)
 * @param {string} doctorId
 * @param {'illness'|'emergency'|'other'} reason
 * @param {string} [note]
 */
export function markAbsent(doctorId, reason = 'other', note = '') {
  const all = loadAttendance();
  const key = `${doctorId}_${todayStr()}`;
  all[key] = {
    status: 'absent',
    reason,
    note: note || '',
    markedAt: new Date().toISOString(),
    date: todayStr(),
  };
  saveAttendance(all);
  return all[key];
}

/**
 * Ertangi kun uchun javob berish ("kelaman" / "kelmayman")
 * @param {string} doctorId
 * @param {'will_come'|'will_not_come'} answer
 */
export function answerTomorrowQuestion(doctorId, answer) {
  const all = loadAttendance();
  const key = `${doctorId}_${tomorrowStr()}`;
  all[key] = {
    status: answer === 'will_come' ? 'expected' : 'day_off_self',
    answeredAt: new Date().toISOString(),
    date: tomorrowStr(),
  };
  saveAttendance(all);
  return all[key];
}

/**
 * O'tgan N kunlik davomat tarixi
 */
export function getAttendanceHistory(doctorId, days = 30) {
  const all = loadAttendance();
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const key = `${doctorId}_${dateStr}`;
    result.push({
      date: dateStr,
      ...(all[key] || { status: null }),
    });
  }
  return result;
}

// ── Leave Requests (dam olish so'rovlari) ─────────────────────────────────────

function loadLeaves() {
  try { return JSON.parse(localStorage.getItem(LEAVE_KEY) || '[]'); }
  catch { return []; }
}

function saveLeaves(data) {
  localStorage.setItem(LEAVE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('mednavbat_leaves_changed'));
}

/**
 * Shifokorning barcha dam olish so'rovlari
 */
export function getDoctorLeaves(doctorId) {
  return loadLeaves()
    .filter(l => l.doctorId === doctorId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

/**
 * Barcha dam olish so'rovlari (admin uchun)
 */
export function getAllLeaveRequests() {
  return loadLeaves().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

/**
 * Yangi dam olish so'rovi yuborish
 */
export function submitLeaveRequest({ doctorId, doctorName, startDate, endDate, reason }) {
  const all = loadLeaves();
  const req = {
    id: `leave-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    doctorId,
    doctorName: doctorName || 'Shifokor',
    startDate,
    endDate,
    reason: reason || '',
    status: 'pending', // pending | approved | rejected
    submittedAt: new Date().toISOString(),
    adminComment: '',
    reviewedAt: null,
  };
  all.unshift(req);
  saveLeaves(all);
  return req;
}

/**
 * Dam olish so'rovini tasdiqlash (admin)
 */
export function approveLeaveRequest(leaveId, adminComment = '') {
  const all = loadLeaves();
  const idx = all.findIndex(l => l.id === leaveId);
  if (idx !== -1) {
    all[idx].status = 'approved';
    all[idx].adminComment = adminComment;
    all[idx].reviewedAt = new Date().toISOString();
    saveLeaves(all);
    const leave = all[idx];
    notifyLeaveApproved(leave.doctorId, `${leave.startDate} - ${leave.endDate}`);
    return leave;
  }
  return null;
}

/**
 * Dam olish so'rovini rad etish (admin)
 */
export function rejectLeaveRequest(leaveId, adminComment) {
  const all = loadLeaves();
  const idx = all.findIndex(l => l.id === leaveId);
  if (idx !== -1) {
    all[idx].status = 'rejected';
    all[idx].adminComment = adminComment || '';
    all[idx].reviewedAt = new Date().toISOString();
    saveLeaves(all);
    const leave = all[idx];
    notifyLeaveRejected(leave.doctorId, adminComment);
    return leave;
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isMorningTime() {
  const h = new Date().getHours();
  return h >= 7 && h < 11;
}

export function isEveningTime() {
  const h = new Date().getHours();
  return h >= 17 && h < 22;
}

export { todayStr, tomorrowStr };
