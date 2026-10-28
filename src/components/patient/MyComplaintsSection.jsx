import React, { useState } from 'react';
import { Star, MessageCircle, AlertTriangle, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getComplaintsByPatient } from '../../services/reviewService';
import { ReviewModal } from './ReviewModal';

// Yulduzcha ko'rsatuvchi (faqat o'qish uchun)
const StarDisplay = ({ value, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${value >= s ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-300 dark:fill-slate-700 dark:text-slate-600'}`} />
      ))}
    </div>
  );
};

// Shikoyat holati badge
const StatusBadge = ({ status, t }) => {
  const cfg = {
    new:       { cls: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',       icon: <RotateCcw className="w-3 h-3" />,      label: t('complaint.status_new') },
    reviewing: { cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: <Clock className="w-3 h-3" />,         label: t('complaint.status_reviewing') },
    resolved:  { cls: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" />, label: t('complaint.status_resolved') },
    rejected:  { cls: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',      icon: <XCircle className="w-3 h-3" />,       label: t('complaint.status_rejected') },
  };
  const c = cfg[status] || cfg.new;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
};

export const MyComplaintsSection = () => {
  const { t, userProfile, appointments } = useApp();
  const [reviewTarget, setReviewTarget] = useState(null); // appointment

  // Yakunlangan navbatlar (baho berish mumkin)
  const completedApps = appointments.filter(a => a.status === 'Yakunlandi');

  // Bemor shikoyatlari
  const complaints = getComplaintsByPatient(userProfile?.id || '');

  const reasonLabels = {
    negligence:      t('complaint.reason_negligence'),
    rude_behavior:   t('complaint.reason_rude'),
    late_reception:  t('complaint.reason_late'),
    wrong_diagnosis: t('complaint.reason_wrong_diagnosis'),
    extra_payment:   t('complaint.reason_extra_payment'),
    other:           t('complaint.reason_other'),
  };

  return (
    <div className="space-y-6">
      {/* ── Yakunlangan navbatlar — baho berish ─────────────────────── */}
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          {t('review.completed_appointments')}
        </h3>

        {completedApps.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">{t('review.no_completed')}</p>
        ) : (
          <div className="space-y-2">
            {completedApps.map(app => {
              const { hasReviewed: reviewed } = (() => {
                try {
                  const all = JSON.parse(localStorage.getItem('mednavbat_reviews')) || [];
                  return { hasReviewed: all.some(r => r.appointment_id === app.id) };
                } catch { return { hasReviewed: false }; }
              })();

              return (
                <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{app.doctorName}</p>
                    <p className="text-xs text-slate-400">{app.date} · {app.specialtyName || app.specialty}</p>
                  </div>
                  {reviewed ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                      <CheckCircle2 className="w-4 h-4" /> {t('review.reviewed')}
                    </span>
                  ) : (
                    <button
                      onClick={() => setReviewTarget(app)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 rounded-xl text-xs font-bold transition"
                    >
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {t('review.give_rating')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Mening shikoyatlarim ─────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          {t('complaint.my_complaints')}
        </h3>

        {complaints.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">{t('complaint.no_complaints')}</p>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <div key={c.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{reasonLabels[c.reason] || c.reason}</span>
                  <StatusBadge status={c.status} t={t} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{c.description}</p>
                <p className="text-[11px] text-slate-400">{new Date(c.created_at).toLocaleDateString()}</p>
                {c.admin_reply && (
                  <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">{t('complaint.admin_reply')}:</p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">{c.admin_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal appointment={reviewTarget} onClose={() => setReviewTarget(null)} />
      )}
    </div>
  );
};
