/**
 * MedNavbat — Review & Complaint Service
 * ────────────────────────────────────────
 * reviews    : id, appointment_id (unique), patient_id, patient_name, doctor_id,
 *              rating, criteria, comment, reply, hidden, created_at
 * complaints : id, appointment_id, patient_id, patient_name, doctor_id, doctor_name,
 *              reason, description, attachments, status, admin_note, admin_reply,
 *              created_at, updated_at
 */

import { getAllStructuredDoctors, saveStructuredDoctors } from '../data/doctorsRepository';
import { addNotification } from './notificationService';

const REVIEWS_KEY    = 'mednavbat_reviews';
const COMPLAINTS_KEY = 'mednavbat_complaints';

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReviews(data) {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('mednavbat_reviews_changed', { detail: data }));
  } catch (e) {
    console.error('Failed to save reviews:', e);
  }
}

function loadComplaints() {
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveComplaints(data) {
  try {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('mednavbat_complaints_changed', { detail: data }));
  } catch (e) {
    console.error('Failed to save complaints:', e);
  }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── REVIEWS ──────────────────────────────────────────────────────────────────

/** Berilgan appointment uchun baho allaqachon berilganmi? */
export function hasReviewed(appointmentId) {
  if (!appointmentId) return false;
  return loadReviews().some(r => r.appointment_id === appointmentId);
}

/** Navbat baholashga yaroqlimi (faqat "Yakunlangan" va 7 kun ichida) */
export function isAppointmentReviewable(appointment) {
  if (!appointment) {
    return { eligible: false, reason: 'Navbat topilmadi' };
  }

  // Faqat "Yakunlangan" holatida bo'lishi kerak
  const isCompleted = appointment.status === 'Yakunlangan' || appointment.status === 'Yakunlandi';
  if (!isCompleted) {
    return { 
      eligible: false, 
      reason: 'Navbat hali yakunlanmagan (shifokor tekshiruvidan so\'ng baholash ochiladi)' 
    };
  }

  // Allaqachon baholanganmi
  if (hasReviewed(appointment.id)) {
    const existing = loadReviews().find(r => r.appointment_id === appointment.id);
    return { 
      eligible: false, 
      alreadyReviewed: true, 
      rating: existing?.rating,
      reason: 'Bu navbat uchun allaqachon baho berilgan' 
    };
  }

  // 7 kunlik muddat tekshiruvi
  const completedDate = appointment.completed_at 
    ? new Date(appointment.completed_at) 
    : (appointment.date ? new Date(appointment.date) : null);

  if (completedDate && !isNaN(completedDate.getTime())) {
    const diffDays = (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return { 
        eligible: false, 
        expired: true, 
        reason: 'Baholash muddati tugagan (qabuldan so\'ng 7 kun ichida baholash mumkin)' 
      };
    }
  }

  return { eligible: true };
}

/** Yangi baho qo'shish */
export function addReview({ appointmentId, patientId, patientName, doctorId, rating, criteria, comment }) {
  if (hasReviewed(appointmentId)) {
    throw new Error('Bu navbat uchun allaqachon baho berilgan.');
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new Error('Baho 1 dan 5 gacha bo\'lishi shart.');
  }

  const review = {
    id: `rev-${uid()}`,
    appointment_id: appointmentId,
    patient_id: patientId || 'guest',
    patient_name: patientName || 'Bemor',
    doctor_id: doctorId,
    rating: numRating,
    criteria: criteria || { kindness: 0, professionalism: 0, punctuality: 0, explanation: 0 },
    comment: (comment || '').trim(),
    reply: null,
    hidden: false,
    created_at: new Date().toISOString()
  };

  const reviews = loadReviews();
  reviews.unshift(review);
  saveReviews(reviews);

  // Shifokorning o'rtacha reytingini darhol qayta hisoblash
  recalculateDoctorRating(doctorId);

  return review;
}

/** Shifokor IDsi bo'yicha barcha ko'rinadigan baholar */
export function getReviewsByDoctor(doctorId) {
  return loadReviews().filter(r => r.doctor_id === doctorId && !r.hidden);
}

/** Barcha baholar (admin uchun) */
export function getAllReviews() {
  return loadReviews();
}

/** Shifokor statistikasi: avg, count, distribution, criteria_avg */
export function getDoctorReviewStats(doctorId) {
  const reviews = loadReviews().filter(r => r.doctor_id === doctorId && !r.hidden);
  const count = reviews.length;
  if (!count) {
    return { 
      avg: 5.0, 
      count: 0, 
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, 
      criteria_avg: { kindness: 5.0, professionalism: 5.0, punctuality: 5.0, explanation: 5.0 } 
    };
  }

  const avg = +(reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { 
    if (distribution[r.rating] !== undefined) {
      distribution[r.rating] += 1;
    }
  });

  const criteriaKeys = ['kindness', 'professionalism', 'punctuality', 'explanation'];
  const criteria_avg = {};
  criteriaKeys.forEach(k => {
    const vals = reviews.map(r => r.criteria?.[k]).filter(Boolean);
    criteria_avg[k] = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
  });

  return { avg, count, distribution, criteria_avg };
}

/** Shifokor reytingini ma'lumotlar bazasida qayta hisoblash */
export function recalculateDoctorRating(doctorId) {
  if (!doctorId) return;
  const stats = getDoctorReviewStats(doctorId);
  try {
    const doctors = getAllStructuredDoctors();
    const idx = doctors.findIndex(d => d.id === doctorId);
    if (idx !== -1) {
      doctors[idx].rating = stats.avg;
      doctors[idx].reviewCount = stats.count;
      doctors[idx].reviewsCount = stats.count;
      saveStructuredDoctors(doctors);
      window.dispatchEvent(new CustomEvent('mednavbat_doctor_rating_updated', {
        detail: { doctorId, rating: stats.avg, count: stats.count }
      }));
    }
  } catch (e) {
    console.error('Error recalculating doctor rating:', e);
  }
}

/** Shifokor sharhiga javob yozish */
export function replyToReview(reviewId, replyText) {
  const reviews = loadReviews();
  const idx = reviews.findIndex(r => r.id === reviewId);
  if (idx === -1) throw new Error('Sharh topilmadi');
  reviews[idx].reply = { 
    text: replyText.trim(), 
    created_at: new Date().toISOString() 
  };
  saveReviews(reviews);
  return reviews[idx];
}

/** Admin: sharhni yashirish/ko'rsatish */
export function toggleHideReview(reviewId) {
  const reviews = loadReviews();
  const idx = reviews.findIndex(r => r.id === reviewId);
  if (idx === -1) return null;
  reviews[idx].hidden = !reviews[idx].hidden;
  saveReviews(reviews);
  recalculateDoctorRating(reviews[idx].doctor_id);
  return reviews[idx];
}

/** Admin: sharhni o'chirish */
export function deleteReview(reviewId) {
  const reviews = loadReviews();
  const target = reviews.find(r => r.id === reviewId);
  const filtered = reviews.filter(r => r.id !== reviewId);
  saveReviews(filtered);
  if (target) {
    recalculateDoctorRating(target.doctor_id);
  }
}

// ── COMPLAINTS ────────────────────────────────────────────────────────────────

export const COMPLAINT_REASONS = [
  'negligence',      // Beparvolik
  'rude_behavior',   // Qo'pol muomala
  'late_reception',  // Kechikish
  'wrong_diagnosis', // Noto'g'ri tashxis
  'extra_payment',   // Qo'shimcha pul talab qilish
  'other'            // Boshqa
];

export const COMPLAINT_STATUSES = {
  new:         'new',
  reviewing:   'reviewing',
  resolved:    'resolved',
  rejected:    'rejected'
};

/** Yangi shikoyat qo'shish */
export function addComplaint({
  appointmentId,
  patientId,
  patientName,
  patientPhone,
  doctorId,
  doctorName,
  reason,
  description,
  attachments
}) {
  const complaint = {
    id: `cmp-${uid()}`,
    appointment_id: appointmentId,
    patient_id: patientId || 'guest',
    patient_name: patientName || 'Bemor',
    patient_phone: patientPhone || '',
    doctor_id: doctorId,
    doctor_name: doctorName || 'Shifokor',
    reason: reason || 'other',
    description: (description || '').trim(),
    attachments: attachments || [],
    status: COMPLAINT_STATUSES.new,
    admin_note: '',
    admin_reply: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const complaints = loadComplaints();
  complaints.unshift(complaint);
  saveComplaints(complaints);
  return complaint;
}

/** Bemor o'z shikoyatlarini ko'radi */
export function getComplaintsByPatient(patientId, patientPhone) {
  return loadComplaints().filter(c => {
    if (patientId && c.patient_id === patientId) return true;
    if (patientPhone && c.patient_phone && c.patient_phone.replace(/\s+/g, '') === patientPhone.replace(/\s+/g, '')) return true;
    return false;
  });
}

/** Admin: barcha shikoyatlar */
export function getAllComplaints() {
  return loadComplaints();
}

/** Admin: shikoyat holatini o'zgartirish va javob yozish */
export function updateComplaintStatus(complaintId, status, adminNote, adminReply) {
  const complaints = loadComplaints();
  const idx = complaints.findIndex(c => c.id === complaintId);
  if (idx === -1) throw new Error('Shikoyat topilmadi');

  const oldReply = complaints[idx].admin_reply;
  complaints[idx].status = status || complaints[idx].status;
  if (adminNote !== undefined) complaints[idx].admin_note = adminNote;
  if (adminReply !== undefined) complaints[idx].admin_reply = adminReply;
  complaints[idx].updated_at = new Date().toISOString();

  saveComplaints(complaints);

  // Agar bemorga yangi javob berilgan bo'lsa, unga bildirishnoma yuborish
  if (adminReply && adminReply.trim() && adminReply !== oldReply) {
    addNotification({
      userId: complaints[idx].patient_id,
      userPhone: complaints[idx].patient_phone,
      type: 'complaint_reply',
      appointmentId: complaints[idx].appointment_id,
      doctorId: complaints[idx].doctor_id,
      doctorName: complaints[idx].doctor_name,
      title: 'Shikoyatingizga javob berildi 💬',
      message: `Administrator shikoyatingiz bo'yicha javob qoldirdi: "${adminReply.slice(0, 90)}${adminReply.length > 90 ? '...' : ''}"`
    });
  }

  return complaints[idx];
}

/** Bir shifokorga kelgan shikoyatlar soni */
export function getDoctorComplaintCount(doctorId) {
  if (!doctorId) return 0;
  return loadComplaints().filter(c => c.doctor_id === doctorId).length;
}

/** Reytingi past shifokorlar ro'yxati (avg_rating < threshold) */
export function getLowRatedDoctorIds(threshold = 3.0, doctors = []) {
  return doctors
    .map(d => ({ id: d.id, avg: getDoctorReviewStats(d.id).avg }))
    .filter(d => d.avg > 0 && d.avg < threshold)
    .map(d => d.id);
}

/**
 * Ko'rik tekshiruv jurnali:
 * Shifokor "Tekshirildi" ni bosmagan, lekin muddati o'tgan navbatlar
 */
export function getUnverifiedAppointments(appointments = []) {
  const now = new Date();
  return appointments.filter(app => {
    // Agar allaqachon yakunlangan yoki bekor qilingan bo'lsa, chiqarmaymiz
    if (app.status === 'Yakunlangan' || app.status === 'Yakunlandi' || app.status === 'Bekor qilingan') {
      return false;
    }

    // Rejalashtirilgan vaqti o'tib ketganmi
    if (app.date) {
      const appDateTime = new Date(`${app.date}T${app.timeSlot || '23:59'}:00`);
      if (!isNaN(appDateTime.getTime()) && appDateTime < now) {
        return true;
      }
    }
    return false;
  });
}
