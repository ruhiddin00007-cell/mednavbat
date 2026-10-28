import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MyComplaintsSection } from './MyComplaintsSection';
import { isAppointmentReviewable, hasReviewed, getComplaintsByPatient } from '../../services/reviewService';
import { 
  Video, 
  FileText, 
  Download,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Trash2,
  ShieldAlert,
  Navigation
} from 'lucide-react';
import { ClinicLocationLink } from '../common/ClinicLocationLink';
import { getYandexMapUrl, openYandexMaps } from '../../utils/yandexMaps';

export const PatientDashboard = () => {
  const { 
    t,
    appointments, 
    userProfile, 
    isAuthenticated,
    cancelAppointment, 
    rescheduleAppointment,
    setActiveModal,
    setSelectedAppointment,
    openReviewModal,
    showToast,
    deletePatientAccount
  } = useApp();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'medical-card' | 'history' | 'complaints' | 'privacy'
  const [rescheduleAppId, setRescheduleAppId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Agar bemor tizimga kirmagan bo'lsa — shaxsiy ma'lumotlar va navbatlar yashirinadi
  if (!isAuthenticated || !userProfile) {
    return (
      <section id="my-appointments-section" className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-xl mx-auto px-4 text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Bemor Kabineti va Shaxsiy Navbatlar Himoyalangan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Shaxsiy navbatlaringiz, tibbiy tarixingiz va retseptlaringizni ko'rish uchun iltimos, telefon raqamingiz orqali tizimga kiring.
          </p>
          <button
            onClick={() => setActiveModal('auth')}
            className="px-6 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-teal-600/25 transition active:scale-95"
          >
            Kirish / Ro'yxatdan o'tish
          </button>
        </div>
      </section>
    );
  }

  // Bemor FAQAT o'z navbatlarini ko'radi! Boshqa bemor ma'lumotlari ko'rinmaydi
  const myAppointments = appointments.filter(a => {
    const patId = userProfile.id;
    const patPhone = userProfile.phone ? String(userProfile.phone).replace(/\D/g, '') : '';
    const appPhone = (a.patientPhone || a.phone || '').replace(/\D/g, '');
    return (
      (a.patientId && a.patientId === patId) ||
      (patPhone && appPhone && patPhone === appPhone) ||
      (a.patientName && userProfile.name && a.patientName.toLowerCase() === userProfile.name.toLowerCase())
    );
  });

  const activeAppointments = myAppointments.filter(a => 
    a.status === 'Tasdiqlangan' || a.status === 'Kutmoqda' || a.status === 'Qayta rejalashtirilgan' || a.status === 'Qabulda'
  );

  const pastAppointments = myAppointments.filter(a => 
    a.status === 'Bekor qilingan' || a.status === 'Yakunlangan' || a.status === 'Yakunlandi'
  );

  const patientComplaints = getComplaintsByPatient(userProfile?.id, userProfile?.phone);

  const handleRescheduleSubmit = (appId) => {
    if (!newDate) {
      showToast('Yangi sanani tanlang', 'warning');
      return;
    }
    rescheduleAppointment(appId, newDate, newTime);
    setRescheduleAppId(null);
  };

  return (
    <section id="my-appointments-section" className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Patient Section Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-extrabold text-2xl text-teal-300 border border-white/20 flex-shrink-0">
              {userProfile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-bold">
                  {t('patient.dashboard_title', 'Bemor Kabineti')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center space-x-3 flex-wrap">
                <span>Tel: {userProfile.phone}</span>
                <span>•</span>
                <span>{t('patient.blood_group')}: <strong className="text-rose-300">{userProfile.bloodGroup}</strong></span>
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'active' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('patient.active_appointments')} ({activeAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('medical-card')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'medical-card' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('patient.medical_card')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'history' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('patient.history')} ({pastAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'complaints' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Shikoyatlarim ({patientComplaints.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'privacy' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-300" />
              <span>Maxfiylik & Hisob</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Active Appointments */}
        {activeTab === 'active' && (
          <div>
            {activeAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeAppointments.map((app) => (
                  <div key={app.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition">
                    
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t('booking.ticket_code')}: <strong className="text-teal-700 dark:text-teal-400 font-mono">{app.ticketCode}</strong>
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {app.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('doctor_detail.title')}:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">{app.doctorName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('specialties.title')}:</span>
                        <span className="font-bold text-teal-700 dark:text-teal-400">{app.specialtyName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('booking.date_time')}:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                          {app.date} — {app.timeSlot}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('booking.hospital')} & {t('booking.room')}:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ClinicLocationLink
                            hospital={app}
                            name={app.hospitalName}
                            iconClassName="w-3.5 h-3.5 text-rose-500 mr-1 flex-shrink-0"
                            linkClassName="font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-600"
                          />
                          <span className="text-slate-500 dark:text-slate-400 text-xs">({app.roomNumber})</span>
                          <a
                            href={getYandexMapUrl(app)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Yandex Xaritalarda yo'l ko'rish"
                            className="min-h-[44px] inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline select-none active:scale-95 active:opacity-80 cursor-pointer bg-teal-50 dark:bg-teal-950/60 px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-800 transition-all"
                          >
                            <Navigation className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>Yo'l ko'rsatish</span>
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('booking.payment_title')}:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{app.paymentStatus}</span>
                      </div>
                    </div>

                    {/* Reschedule inline editor */}
                    {rescheduleAppId === app.id && (
                      <div className="bg-white dark:bg-slate-750 p-3 rounded-2xl border border-teal-300 dark:border-teal-700 space-y-2 animate-fade-in">
                        <p className="text-xs font-bold text-teal-800 dark:text-teal-300">Yangi sana va vaqtni tanlang:</p>
                        <div className="flex gap-2 flex-wrap">
                          <input 
                            type="date" 
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="text-xs p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white" 
                          />
                          <select 
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="text-xs p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-slate-900 dark:text-white"
                          >
                            <option value="09:30">09:30</option>
                            <option value="11:00">11:00</option>
                            <option value="14:30">14:30</option>
                            <option value="16:00">16:00</option>
                          </select>
                          <button 
                            onClick={() => handleRescheduleSubmit(app.id)}
                            className="px-3 py-1.5 bg-teal-600 text-white font-bold rounded-xl text-xs hover:bg-teal-700 transition"
                          >
                            Saqlash
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Interactive Action buttons */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedAppointment(app);
                          setActiveModal('video-call');
                        }}
                        className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{t('patient.btn_video_call')}</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setRescheduleAppId(rescheduleAppId === app.id ? null : app.id)}
                          className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition"
                        >
                          {t('patient.btn_reschedule')}
                        </button>
                        <button
                          onClick={() => cancelAppointment(app.id)}
                          className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition"
                        >
                          {t('patient.btn_cancel')}
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('patient.no_active')}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Electronic Medical Card */}
        {activeTab === 'medical-card' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>{t('patient.medical_card')} (E-Health ID)</span>
                </h3>
              </div>
              <span className="text-xs font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                ID-994812
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold block">{t('patient.address')}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">{userProfile.address}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold block">{t('patient.age')}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">{userProfile.age} ({userProfile.gender})</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold block">{t('patient.blood_group')}</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{userProfile.bloodGroup}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">{t('patient.diagnosis_history')}</h4>
              <div className="space-y-3">
                {userProfile.medicalHistory.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">{item.doctor}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded font-medium">{item.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('doctor.diagnosis')}: <strong className="text-slate-800 dark:text-slate-200">{item.diagnosis}</strong></p>
                      <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">{t('doctor.prescription')}: {item.prescription}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1 self-start sm:self-center transition">
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: History (Yakunlangan navbatlar va Baholash tugmasi) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.map((app) => {
                const isCompleted = app.status === 'Yakunlangan' || app.status === 'Yakunlandi';
                const reviewable = isAppointmentReviewable(app);
                const reviewed = hasReviewed(app.id);

                return (
                  <div 
                    key={app.id} 
                    className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition hover:border-slate-300"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{app.doctorName}</span>
                        <span className="font-mono text-[10px] bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                          {app.ticketCode}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Sana: {app.date} ({app.timeSlot}) • Mutaxassislik: {app.specialtyName}
                      </p>
                      {app.completed_at && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
                          Qabul yakunlandi: {new Date(app.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Navbat holati */}
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        app.status === 'Bekor qilingan' 
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200' 
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                      }`}>
                        {app.status}
                      </span>

                      {/* Baholash holati */}
                      {isCompleted && (
                        <>
                          {reviewed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-extrabold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span>Baholangan ✓</span>
                            </span>
                          ) : reviewable.eligible ? (
                            <button
                              onClick={() => openReviewModal(app)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 fill-white" />
                              <span>Baholash ⭐</span>
                            </button>
                          ) : reviewable.expired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 text-[11px] font-medium" title={reviewable.reason}>
                              <Clock className="w-3 h-3" />
                              <span>Muddati tugagan (7 kun)</span>
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">{t('patient.no_active')}</p>
            )}
          </div>
        )}

        {/* TAB 4: My Complaints */}
        {activeTab === 'complaints' && (
          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <MyComplaintsSection />
          </div>
        )}

        {/* TAB 5: Maxfiylik & Hisobni O'chirish */}
        {activeTab === 'privacy' && (
          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Maxfiylik va Shaxsiy Ma'lumotlarni Boshqarish</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi qonuniga muvofiq, siz istalgan vaqtda shaxsiy hisobingiz va barcha navbatlaringizni tizimdan o'chirish huquqiga egasiz.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Ism va Familiya:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{userProfile?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Telefon:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{userProfile?.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Tug'ilgan sana:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{userProfile?.birthDate || 'Kiritilmagan'}</span>
              </div>
            </div>

            {/* Xavfli Hudud: Hisobni o'chirish */}
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-extrabold text-xs">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hisobni va Barcha Shaxsiy Ma'lumotlarni O'chirish</span>
              </div>
              <p className="text-xs text-rose-700/80 dark:text-rose-400 leading-relaxed">
                Hisobingizni o'chirsangiz, barcha navbatlaringiz, shifokorlar bilan yozishmalaringiz va shaxsiy kartangiz tizimdan butunlay o'chiriladi. Ushbu amalni ortga qaytarib bo'lmaydi.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition active:scale-95 shadow-md shadow-rose-600/20"
              >
                Hisobimni o'chirishni so'rash
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Hisobni o'chirishni tasdiqlash modali */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm w-full border border-rose-300 dark:border-rose-900 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Hisobni o'chirishni tasdiqlang
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Barcha navbatlaringiz va shaxsiy ma'lumotlaringiz butunlay o'chiriladi. Rozimisiz?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  deletePatientAccount();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20"
              >
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
