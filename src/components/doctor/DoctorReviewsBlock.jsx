import React, { useState } from 'react';
import { Star, ThumbsUp, MessageSquare, Eye, EyeOff, Trash2, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getReviewsByDoctor, getDoctorReviewStats, replyToReview, toggleHideReview, deleteReview, getAllReviews } from '../../services/reviewService';
import { getDoctorComplaintCount } from '../../services/reviewService';

// ── Yulduzcha (readonly) ──────────────────────────────────────────────────────
const StarDisplay = ({ value, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${value >= s ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-300 dark:fill-slate-700 dark:text-slate-600'}`} />
      ))}
    </div>
  );
};

// ── Progress bar ──────────────────────────────────────────────────────────────
const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right font-semibold text-slate-600 dark:text-slate-400">{star}</span>
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-slate-400">{count}</span>
    </div>
  );
};

// ── Sharh kartasi ─────────────────────────────────────────────────────────────
const ReviewCard = ({ review, isAdmin = false, isDoctorPanel = false, onReply, onToggleHide, onDelete }) => {
  const { t } = useApp();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText]       = useState('');

  // Bemor ismi qisman yashirish: "Alisher Karimov" → "Al*** K."
  const maskName = (name = '') => {
    const parts = name.trim().split(' ');
    if (!parts[0]) return 'Noma\'lum';
    const first = parts[0].slice(0, 2) + '***';
    const last  = parts[1] ? parts[1][0] + '.' : '';
    return `${first} ${last}`.trim();
  };

  return (
    <div className={`p-4 rounded-2xl border ${review.hidden ? 'opacity-50 border-dashed border-slate-300 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs">
              {(review.patient_name || 'B')[0].toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-white">
              {isAdmin ? (review.patient_name || t('review.anonymous')) : maskName(review.patient_name || '')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 ml-9 mt-0.5">{new Date(review.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StarDisplay value={review.rating} size="sm" />
          {isAdmin && (
            <div className="flex gap-1">
              <button onClick={() => onToggleHide?.(review.id)} title={review.hidden ? t('review.show') : t('review.hide')}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition">
                {review.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => onDelete?.(review.id)} title={t('review.delete')}
                className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comment */}
      {review.comment && <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{review.comment}</p>}

      {/* Criteria */}
      {review.criteria && Object.values(review.criteria).some(v => v > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(review.criteria).filter(([, v]) => v > 0).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] rounded-full border border-slate-200 dark:border-slate-600">
              {t(`review.criteria_${k.slice(0,4)}`)} <StarDisplay value={v} size="sm" />
            </span>
          ))}
        </div>
      )}

      {/* Doctor reply */}
      {review.reply && (
        <div className="mt-2 ml-4 p-3 bg-teal-50 dark:bg-teal-950/40 border-l-2 border-teal-400 rounded-r-xl">
          <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400 mb-0.5">{t('review.doctor_reply')}:</p>
          <p className="text-xs text-teal-800 dark:text-teal-300">{review.reply.text}</p>
        </div>
      )}

      {/* Reply button (doctor panel) */}
      {isDoctorPanel && !review.reply && (
        <div className="mt-2">
          {showReplyBox ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={t('review.reply_placeholder')}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-400 resize-none transition"
              />
              <div className="flex gap-2">
                <button onClick={() => { onReply?.(review.id, replyText); setShowReplyBox(false); setReplyText(''); }}
                  disabled={!replyText.trim()}
                  className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg font-bold disabled:opacity-50 hover:bg-teal-700 transition">
                  {t('review.send_reply')}
                </button>
                <button onClick={() => setShowReplyBox(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                  {t('review.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowReplyBox(true)}
              className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold">
              <MessageSquare className="w-3.5 h-3.5" /> {t('review.write_reply')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Shifokor Profili uchun Reyting Bloki ─────────────────────────────────────
export const DoctorReviewsBlock = ({ doctorId, isAdmin = false, isDoctorPanel = false }) => {
  const { t } = useApp();
  const [showAll, setShowAll] = useState(false);
  const [, forceUpdate] = useState(0);

  const stats   = getDoctorReviewStats(doctorId);
  const reviews = isAdmin ? getAllReviews().filter(r => r.doctor_id === doctorId) : getReviewsByDoctor(doctorId);
  const visible = showAll ? reviews : reviews.slice(0, 3);

  const criteriaLabels = {
    kindness: t('review.criteria_kind'), professionalism: t('review.criteria_prof'),
    punctuality: t('review.criteria_punct'), explanation: t('review.criteria_expl'),
  };

  const handleReply = (reviewId, text) => {
    replyToReview(reviewId, text);
    forceUpdate(n => n + 1);
  };
  const handleToggleHide = (reviewId) => {
    toggleHideReview(reviewId);
    forceUpdate(n => n + 1);
  };
  const handleDelete = (reviewId) => {
    if (window.confirm(t('review.confirm_delete'))) {
      deleteReview(reviewId);
      forceUpdate(n => n + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistika header */}
      <div className="flex flex-col sm:flex-row gap-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        {/* O'rtacha reyting */}
        <div className="flex flex-col items-center justify-center gap-1 min-w-[100px]">
          <span className="text-4xl font-black text-slate-900 dark:text-white">{stats.avg || '—'}</span>
          <StarDisplay value={stats.avg} size="md" />
          <span className="text-xs text-slate-400">{stats.count} {t('review.ratings')}</span>
        </div>

        {/* Taqsimot */}
        <div className="flex-1 space-y-1.5">
          {[5,4,3,2,1].map(s => (
            <RatingBar key={s} star={s} count={stats.distribution[s] || 0} total={stats.count} />
          ))}
        </div>

        {/* Mezonlar */}
        {stats.count > 0 && (
          <div className="space-y-2 min-w-[160px]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{t('review.criteria_title')}</p>
            {Object.entries(criteriaLabels).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{label}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{stats.criteria_avg[k] || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sharhlar ro'yxati */}
      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">{t('review.no_reviews')}</p>
      ) : (
        <div className="space-y-3">
          {visible.map(r => (
            <ReviewCard
              key={r.id}
              review={r}
              isAdmin={isAdmin}
              isDoctorPanel={isDoctorPanel}
              onReply={handleReply}
              onToggleHide={handleToggleHide}
              onDelete={handleDelete}
            />
          ))}
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
            >
              {showAll ? t('review.show_less') : `${t('review.show_all')} (${reviews.length})`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
