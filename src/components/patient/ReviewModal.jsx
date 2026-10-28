import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Send, 
  ChevronDown, 
  ChevronUp,
  Paperclip,
  Image as ImageIcon,
  Clock,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import {
  addReview, 
  hasReviewed,
  addComplaint, 
  COMPLAINT_REASONS,
  isAppointmentReviewable
} from '../../services/reviewService';

// ── Yulduzcha komponenti (Hover & Yellow #FACC15) ──────────────────────────────
const StarRating = ({ value, onChange, readonly = false, size = 'md' }) => {
  const [hovered, setHovered] = useState(0);
  const szCls = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const isFilled = (hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange && onChange(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-all duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125 active:scale-95'}`}
          >
            <Star
              className={`${szCls} transition-colors ${
                isFilled
                  ? 'fill-[#FACC15] text-[#FACC15] drop-shadow-xs'
                  : 'fill-slate-200 text-slate-300 dark:fill-slate-700 dark:text-slate-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

// ── Mezon bahosi ─────────────────────────────────────────────────────────────
const CriteriaRow = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">{label}</span>
    <StarRating value={value} onChange={onChange} size="sm" />
  </div>
);

// ── Asosiy modal ─────────────────────────────────────────────────────────────
export const ReviewModal = ({ appointment, onClose }) => {
  const { t, userProfile, showToast } = useApp();

  // Baho holati
  const [rating, setRating] = useState(0);
  const [criteria, setCriteria] = useState({ kindness: 5, professionalism: 5, punctuality: 5, explanation: 5 });
  const [comment, setComment] = useState('');

  // Shikoyat holati
  const [showComplaint, setShowComplaint] = useState(false);
  const [reason, setReason] = useState('negligence');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);

  // UI
  const [step, setStep] = useState('review'); // 'review' | 'done'
  const [submitting, setSubmitting] = useState(false);

  // Navbat baholashga yaroqliligi
  const reviewEligibility = isAppointmentReviewable(appointment);
  const alreadyReviewed = hasReviewed(appointment?.id);

  // Baho 3 dan past bo'lsa shikoyat oynasini avtomatik ochish
  useEffect(() => {
    if (rating > 0 && rating < 3) {
      setShowComplaint(true);
    }
  }, [rating]);

  const criteriaLabels = {
    kindness:        t('review.criteria_kind', 'Xushmuomalalik'),
    professionalism: t('review.criteria_prof', 'Professionallik'),
    punctuality:     t('review.criteria_punct', 'Vaqtida qabul'),
    explanation:     t('review.criteria_expl', 'Tushuntirish sifati'),
  };

  const reasonLabels = {
    negligence:      t('complaint.reason_negligence', 'Beparvolik'),
    rude_behavior:   t('complaint.reason_rude', 'Qo\'pol muomala'),
    late_reception:  t('complaint.reason_late', 'Kechikish'),
    wrong_diagnosis: t('complaint.reason_wrong_diagnosis', 'Noto\'g\'ri tashxis'),
    extra_payment:   t('complaint.reason_extra_payment', 'Ortiqcha pul talab qilish'),
    other:           t('complaint.reason_other', 'Boshqa sabab'),
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Fayl hajmi 5MB dan oshmasligi kerak', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        dataUrl: reader.result
      });
      showToast(`Fayl biriktirildi: ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!rating) {
      showToast(t('review.err_no_rating', 'Iltimos, avval umumiy bahoni yulduzchalar bilan belgilang!'), 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Sharh va bahoni saqlash
      addReview({
        appointmentId: appointment.id,
        patientId:     userProfile?.id || appointment.patientPhone || 'patient',
        patientName:   userProfile?.name || appointment.patientName || 'Bemor',
        doctorId:      appointment.doctorId,
        rating,
        criteria,
        comment
      });

      // 2. Agar shikoyat yozilgan bo'lsa, shikoyatni saqlash
      if (showComplaint && reason && description.trim()) {
        addComplaint({
          appointmentId: appointment.id,
          patientId:     userProfile?.id || 'patient',
          patientName:   userProfile?.name || appointment.patientName || 'Bemor',
          patientPhone:  userProfile?.phone || appointment.patientPhone || '',
          doctorId:      appointment.doctorId,
          doctorName:    appointment.doctorName,
          reason,
          description,
          attachments:   attachment ? [attachment] : []
        });
      }

      // Katta baho bo'lsa bayramona confetti otish
      if (rating >= 4) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {}
      }

      setStep('done');
      showToast(t('review.success_toast', 'Bahoyingiz qabul qilindi, rahmat!'), 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
    setSubmitting(false);
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                {t('review.modal_title', 'Shifokorni Baholash')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {appointment.doctorName} • {appointment.specialtyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Holat tekshiruvlari */}
        {!reviewEligibility.eligible && !alreadyReviewed ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">
              {reviewEligibility.expired ? "Baholash muddati tugagan" : "Navbat hali yakunlanmagan"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {reviewEligibility.reason}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Yopish
            </button>
          </div>
        ) : alreadyReviewed ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">
              {t('review.already_reviewed', 'Bu navbat uchun allaqachon baho bergansiz')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Qabul qilingan fikringiz shifokor profilida saqlandi. Rahmat!
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
            >
              Yopish
            </button>
          </div>
        ) : step === 'done' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">
                {t('review.thank_you', 'Katta rahmat!')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t('review.thank_you_sub', 'Sizning xolis bahoyingiz boshqa bemorlarga to\'g\'ri shifokor tanlashda yordam beradi.')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition"
            >
              {t('review.close', 'Yopish')}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Qabul qilingan sana va navbat kodi */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Chipta: <strong className="text-teal-700 dark:text-teal-400 font-mono">{appointment.ticketCode}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Sana: <strong>{appointment.date} ({appointment.timeSlot})</strong>
              </span>
            </div>

            {/* Umumiy reyting (1 dan 5 gacha) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 via-amber-50/20 to-white dark:from-amber-950/20 dark:via-slate-800 dark:to-slate-800 border border-amber-200/80 dark:border-amber-900/40 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                {t('review.overall_rating', 'Umumiy baho')}
              </p>
              <div className="flex justify-center py-1">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              <p className="text-xs font-extrabold text-amber-700 dark:text-amber-400 h-4">
                {rating === 1 ? `⭐ ${t('review.label_1', 'Juda yomon')}` :
                 rating === 2 ? `⭐⭐ ${t('review.label_2', 'Qoniqarsiz')}` :
                 rating === 3 ? `⭐⭐⭐ ${t('review.label_3', 'O\'rtacha')}` :
                 rating === 4 ? `⭐⭐⭐⭐ ${t('review.label_4', 'Yaxshi')}` :
                 rating === 5 ? `⭐⭐⭐⭐⭐ ${t('review.label_5', 'A\'lo darajada!')}` :
                 t('review.tap_to_rate', 'Baholash uchun yulduzchalarni bosing')}
              </p>
            </div>

            {/* Mezonlar bo'yicha alohida baholar */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800">
              <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                {t('review.criteria_title', 'Qo\'shimcha mezonlar')}
              </p>
              {Object.keys(criteriaLabels).map(key => (
                <CriteriaRow
                  key={key}
                  label={criteriaLabels[key]}
                  value={criteria[key]}
                  onChange={v => setCriteria(prev => ({ ...prev, [key]: v }))}
                />
              ))}
            </div>

            {/* Ixtiyoriy izoh maydoni */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {t('review.comment_label', 'Izoh va fikrlaringiz (ixtiyoriy)')}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t('review.comment_placeholder', 'Shifokor muomalasi, ko\'rsatilgan yordam haqida fikringizni yozing...')}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none resize-none transition"
              />
            </div>

            {/* Shikoyat bo'limi */}
            <div className={`rounded-2xl border transition-all overflow-hidden ${
              rating > 0 && rating < 3
                ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              <button
                type="button"
                onClick={() => setShowComplaint(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition ${
                  rating > 0 && rating < 3
                    ? 'bg-rose-100/70 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${rating > 0 && rating < 3 ? 'text-rose-600' : 'text-slate-500'}`} />
                  <span>{t('complaint.write_complaint', 'Shifokor ustidan shikoyat yozish')}</span>
                  {rating > 0 && rating < 3 && (
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                      Tavsiya etiladi (Past baho)
                    </span>
                  )}
                </div>
                {showComplaint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showComplaint && (
                <div className="p-4 space-y-3.5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Sizning shikoyatingiz bevosita klinika ma'muriyatiga yetkaziladi va qat'iy nazorat ostida ko'rib chiqiladi.
                  </p>

                  {/* Sabab tanlash */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      {t('complaint.reason_label', 'Shikoyat sababini tanlang')}:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {COMPLAINT_REASONS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReason(r)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition text-left ${
                            reason === r
                              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 text-rose-700 dark:text-rose-300 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          {reasonLabels[r]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Batafsil shikoyat matni */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      {t('complaint.description_label', 'Batafsil ma\'lumot')}:
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={t('complaint.description_placeholder', 'Nima yuz berganini batafsil tushuntirib bering...')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-400 outline-none resize-none transition"
                    />
                  </div>

                  {/* Rasm yoki Fayl biriktirish */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Rasm yoki dalil fayl biriktirish (ixtiyoriy):
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Fayl tanlash</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {attachment && (
                        <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{attachment.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachment(null)}
                            className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Yuborish tugmasi */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !rating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-lg shadow-teal-600/25 transition transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{t('review.submit', 'Bahoni Yuborish')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
