import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ChevronDown, 
  MessageSquare, 
  Star, 
  Search,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Send,
  UserCheck,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  getAllComplaints, 
  updateComplaintStatus, 
  getAllReviews, 
  toggleHideReview, 
  deleteReview, 
  getDoctorReviewStats, 
  getDoctorComplaintCount, 
  getLowRatedDoctorIds,
  getUnverifiedAppointments
} from '../../services/reviewService';

const STATUS_OPTIONS = ['new', 'reviewing', 'resolved', 'rejected'];

const statusCfg = (status, t) => ({
  new:       { cls: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',         label: t('complaint.status_new', 'Yangi') },
  reviewing: { cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',   label: t('complaint.status_reviewing', 'Ko\'rib chiqilmoqda') },
  resolved:  { cls: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', label: t('complaint.status_resolved', 'Hal qilindi') },
  rejected:  { cls: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',         label: t('complaint.status_rejected', 'Rad etildi') },
}[status] || { cls: '', label: status });

export const AdminComplaintsSection = () => {
  const { t, doctors, appointments, completeAppointment, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('complaints'); // 'complaints' | 'reviews' | 'unverified'
  const [complaints, setComplaints]     = useState(() => getAllComplaints());
  const [reviews, setReviews]           = useState(() => getAllReviews());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [searchQ, setSearchQ]           = useState('');
  const [expanded, setExpanded]         = useState(null);
  const [adminNote, setAdminNote]       = useState('');
  const [adminReply, setAdminReply]     = useState('');
  const [, forceUpdate]                 = useState(0);

  const reasonLabels = {
    negligence:      t('complaint.reason_negligence', 'Beparvolik'),
    rude_behavior:   t('complaint.reason_rude', 'Qo\'pol muomala'),
    late_reception:  t('complaint.reason_late', 'Kechikish'),
    wrong_diagnosis: t('complaint.reason_wrong_diagnosis', 'Noto\'g\'ri tashxis'),
    extra_payment:   t('complaint.reason_extra_payment', 'Ortiqcha pul talab qilish'),
    other:           t('complaint.reason_other', 'Boshqa sabab'),
  };

  const refresh = () => {
    setComplaints(getAllComplaints());
    setReviews(getAllReviews());
    forceUpdate(n => n + 1);
  };

  const handleStatusChange = (id, status) => {
    try {
      updateComplaintStatus(id, status, adminNote, adminReply);
      showToast(`Shikoyat holati '${status}' ga o'zgartirildi`, 'success');
      refresh();
      setExpanded(null);
      setAdminNote('');
      setAdminReply('');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleToggleHide = (revId) => {
    toggleHideReview(revId);
    refresh();
    showToast('Sharh ko\'rinishi o\'zgartirildi', 'info');
  };

  const handleDeleteReview = (revId) => {
    if (window.confirm('Haqiqatan ham bu sharhni o\'chirmoqchimisiz?')) {
      deleteReview(revId);
      refresh();
      showToast('Sharh butunlay o\'chirildi', 'success');
    }
  };

  // Filtrlar
  const filtered = complaints.filter(c => {
    const matchStatus = !filterStatus || c.status === filterStatus;
    const matchDoctor = !filterDoctor || c.doctor_id === filterDoctor;
    const matchSearch = !searchQ ||
      (c.description || '').toLowerCase().includes(searchQ.toLowerCase()) ||
      (c.patient_name || '').toLowerCase().includes(searchQ.toLowerCase()) ||
      (reasonLabels[c.reason] || '').toLowerCase().includes(searchQ.toLowerCase());
    return matchStatus && matchDoctor && matchSearch;
  });

  // Ko'p shikoyatli shifokorlar (5+)
  const warningDoctors = doctors.filter(d => getDoctorComplaintCount(d.id) >= 5);

  // Past reytingli shifokorlar (< 3.0)
  const lowRatedIds = getLowRatedDoctorIds(3.0, doctors);
  const lowRatedDocs = doctors.filter(d => lowRatedIds.includes(d.id)).map(d => ({
    ...d,
    stats: getDoctorReviewStats(d.id)
  }));

  // Shifokor "Tekshirildi" ni bosmagan, lekin vaqti o'tib ketgan navbatlar jurnali
  const unverifiedList = getUnverifiedAppointments(appointments);

  return (
    <div className="space-y-6">

      {/* ── Sub-tab Navigation ────────────────────────────────────── */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('complaints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'complaints'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Barcha Shikoyatlar ({complaints.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'reviews'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Sharhlar Moderatsiyasi ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('unverified')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'unverified'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Ko'rik Tekshiruv Jurnali ({unverifiedList.length})</span>
        </button>
      </div>

      {/* ── OGOHLANTIRISHLAR (5+ shikoyat yoki reyting < 3.0) ──────── */}
      {(warningDoctors.length > 0 || lowRatedDocs.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {warningDoctors.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2">
              <p className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>⚠️ {t('complaint.warning_many_complaints', 'Ko\'p shikoyat olgan shifokorlar (5+ ta)')}</span>
              </p>
              <ul className="space-y-1">
                {warningDoctors.map(d => (
                  <li key={d.id} className="text-xs text-amber-900 dark:text-amber-200 flex justify-between bg-white/70 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                    <span className="font-bold">{d.name || d.fullName}</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">{getDoctorComplaintCount(d.id)} ta shikoyat</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lowRatedDocs.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl space-y-2">
              <p className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>⚠️ {t('complaint.warning_low_rating', 'Past reytingli shifokorlar (< 3.0 ★)')}</span>
              </p>
              <ul className="space-y-1">
                {lowRatedDocs.map(d => (
                  <li key={d.id} className="text-xs text-rose-900 dark:text-rose-200 flex justify-between bg-white/70 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                    <span className="font-bold">{d.name || d.fullName}</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">★ {d.stats.avg} ({d.stats.count} ta baho)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 1: SHIKOYATLAR ─────────────────────────────────── */}
      {activeSubTab === 'complaints' && (
        <div className="space-y-4">
          {/* Filtrlar */}
          <div className="flex flex-wrap gap-2 items-center bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder={t('complaint.search_placeholder', 'Bemor ismi, shifokor yoki shikoyat matnidan qidirish...')}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-400 transition"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer font-bold"
            >
              <option value="">{t('complaint.filter_all_status', 'Barcha holatlar')}</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{statusCfg(s, t).label}</option>
              ))}
            </select>

            <select
              value={filterDoctor}
              onChange={e => setFilterDoctor(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer font-bold"
            >
              <option value="">{t('complaint.filter_all_doctors', 'Barcha shifokorlar')}</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name || d.fullName}</option>
              ))}
            </select>
          </div>

          {/* Ro'yxat */}
          {filtered.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('complaint.no_complaints', 'Shikoyatlar mavjud emas')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => {
                const sc = statusCfg(c.status, t);
                const isOpen = expanded === c.id;
                const doctor = doctors.find(d => d.id === c.doctor_id);

                return (
                  <div key={c.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                    {/* Qisqacha qator */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${sc.cls}`}>
                            {sc.label}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {reasonLabels[c.reason] || c.reason}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            • Bemor: <strong>{c.patient_name || 'Bemor'}</strong> ({c.patient_phone || 'Tel ko\'rsatilmagan'})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{c.description}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Shifokor: <strong>{doctor?.name || doctor?.fullName || c.doctor_name || c.doctor_id}</strong> • Sana: {new Date(c.created_at).toLocaleString('uz-UZ')}
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Tafsilotlar paneli */}
                    {isOpen && (
                      <div className="border-t border-slate-100 dark:border-slate-700 p-5 space-y-4 bg-slate-50/50 dark:bg-slate-850">
                        {/* To'liq matn */}
                        <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('complaint.full_description', 'To\'liq shikoyat matni')}:</p>
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{c.description}</p>
                        </div>

                        {/* Biriktirilgan fayllar */}
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Biriktirilgan dalillar:</span>
                            <div className="flex flex-wrap gap-2">
                              {c.attachments.map((att, idx) => (
                                <a 
                                  key={idx} 
                                  href={att.dataUrl || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono text-teal-600 dark:text-teal-400 hover:underline"
                                >
                                  📎 {att.name} ({att.size})
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Admin ichki izohi (faqat admin ko'radi) */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            {t('complaint.admin_note', 'Ichki izoh (faqat administratorlar uchun)')}:
                          </label>
                          <textarea
                            rows={2}
                            defaultValue={c.admin_note}
                            onChange={e => setAdminNote(e.target.value)}
                            placeholder={t('complaint.admin_note_placeholder', 'Ushbu shikoyat bo\'yicha ichki xulosangizni yozing...')}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-400 resize-none transition"
                          />
                        </div>

                        {/* Bemorga rasmiy javob (bemorga bildirishnoma boradi) */}
                        <div>
                          <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                            {t('complaint.admin_reply_to_patient', 'Bemorga javob xati (bemor profilida va bildirishnomada ko\'rinadi)')}:
                          </label>
                          <textarea
                            rows={2}
                            defaultValue={c.admin_reply}
                            onChange={e => setAdminReply(e.target.value)}
                            placeholder={t('complaint.admin_reply_placeholder', 'Bemorga yo\'llangan rasmiy tushuntirish yoki chora haqida yozing...')}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400 resize-none transition"
                          />
                        </div>

                        {/* Holatni o'zgartirish va saqlash */}
                        <div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">Holatni yangilash va javobni yuborish:</span>
                          <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map(s => {
                              const sc2 = statusCfg(s, t);
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(c.id, s)}
                                  className={`px-4 py-2 text-xs rounded-xl font-black border transition cursor-pointer flex items-center gap-1.5 ${
                                    c.status === s
                                      ? sc2.cls + ' ring-2 ring-offset-1 ring-teal-500'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                                  }`}
                                >
                                  <span>{sc2.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: SHARHLAR MODERATSIYASI ───────────────────────── */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Bemorlar qoldirgan barcha sharhlar</h4>
              <p className="text-[11px] text-slate-500">Soxta, noo'rin yoki haqoratli sharhlarni yashirish yoki o'chirish</p>
            </div>
            <span className="text-xs font-mono font-bold bg-white dark:bg-slate-700 px-3 py-1 rounded-lg border">
              Jami: {reviews.length} ta
            </span>
          </div>

          <div className="space-y-3">
            {reviews.map(r => {
              const doctor = doctors.find(d => d.id === r.doctor_id);

              return (
                <div 
                  key={r.id} 
                  className={`p-4 rounded-2xl border transition ${
                    r.hidden 
                      ? 'bg-slate-100/60 dark:bg-slate-850/60 border-dashed border-rose-300 dark:border-rose-900 opacity-60' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{r.patient_name || 'Bemor'}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-400">{doctor?.name || r.doctor_id}</span>
                        <span className="text-[11px] font-mono text-slate-400">({new Date(r.created_at).toLocaleDateString()})</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 mt-1">
                        {[1, 2, 3, 4, 5].map(st => (
                          <Star key={st} className={`w-3.5 h-3.5 ${r.rating >= st ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        ))}
                        <span className="text-xs font-black ml-1 text-slate-700 dark:text-slate-300">{r.rating}.0</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleHide(r.id)}
                        title={r.hidden ? "Sharhni ko'rsatish" : "Sharhni yashirish (soxta/haqoratli)"}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                          r.hidden 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700' 
                            : 'bg-slate-100 dark:bg-slate-700 border-slate-200 text-slate-600 hover:text-rose-600'
                        }`}
                      >
                        {r.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{r.hidden ? "Ko'rsatish" : "Yashirish"}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        title="O'chirish"
                        className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {r.comment && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-2.5 bg-slate-50 dark:bg-slate-750 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                      "{r.comment}"
                    </p>
                  )}

                  {r.reply && (
                    <div className="mt-2 text-[11px] p-2 bg-teal-50 dark:bg-teal-950/40 border-l-2 border-teal-500 rounded-r-lg text-teal-800 dark:text-teal-300">
                      <strong>Shifokor javobi:</strong> {r.reply.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: KO'RIK TEKSHIRUV JURNALI ─────────────────────── */}
      {activeSubTab === 'unverified' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
              Shifokor "Tekshirildi" deb belgilamagan navbatlar jurnali
            </h4>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300/80 mt-0.5">
              Qabul vaqti o'tib ketgan bo'lsa-da, shifokor tomonidan hali "Tekshirildi" tugmasi bosilmagan holatlar. Admin ko'rik natijasini surishtirib, qo'lda tasdiqlashi yoki navbatni yakunlashi mumkin.
            </p>
          </div>

          {unverifiedList.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Barcha o'tgan navbatlar shifokorlar tomonidan o'z vaqtida tekshirilgan!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unverifiedList.map(app => (
                <div key={app.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">{app.patientName}</span>
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{app.ticketCode}</span>
                      <span className="text-amber-600 font-bold font-mono">({app.patientPhone})</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Shifokor: <strong>{app.doctorName}</strong> ({app.specialtyName}) • Rejalashtirilgan vaqt: <strong>{app.date} ({app.timeSlot})</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const doc = doctors.find(d => d.id === app.doctorId) || { id: app.doctorId, name: app.doctorName };
                        completeAppointment(app.id, doc);
                        refresh();
                        showToast(`Navbat ${app.ticketCode} yakunlandi va bemorga baholash yuborildi`, 'success');
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tekshirildi deb yakunlash</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
