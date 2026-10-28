import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Video, 
  X, 
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  Activity,
  Heart
} from 'lucide-react';

export const PatientPortalView = ({ onNavigate }) => {
  const { 
    t,
    appointments, 
    userProfile, 
    updateUserProfile,
    cancelAppointment, 
    setActiveModal,
    setSelectedAppointment,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'history' | 'prescriptions' | 'profile'

  // Profil tahrirlash holati
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: userProfile?.fullName || userProfile?.name || 'Bemor',
    phone: userProfile?.phone || '',
    age: userProfile?.age || '28',
    gender: userProfile?.gender || 'Erkak',
    bloodGroup: userProfile?.bloodGroup || 'A (II) Rh+',
    address: userProfile?.address || 'Toshkent sh., Chilonzor tumani'
  });

  // Bemorning o'z navbatlari
  const myAppointments = (appointments || []).filter(a => {
    const patId = userProfile?.id;
    const patPhone = userProfile?.phone ? String(userProfile.phone).replace(/\D/g, '') : '';
    const appPhone = (a.patientPhone || a.phone || '').replace(/\D/g, '');
    return (
      (a.patientId && a.patientId === patId) ||
      (patPhone && appPhone && patPhone === appPhone) ||
      (a.patientName && userProfile?.name && a.patientName.toLowerCase() === userProfile.name.toLowerCase())
    );
  });

  // Tibbiy tarix
  const medicalHistory = userProfile?.medicalHistory || [
    {
      id: 'mh-1',
      date: '15.02.2026',
      doctor: 'Dr. Nilufar Karimova',
      specialty: 'Kardiologiya',
      diagnosis: 'Birlamchi arterial gipertenziya (engil shakl)',
      recommendations: 'Kuniga 2 litr suv, tuz iste’molini kamaytirish, muntazam kardio mashqlar'
    },
    {
      id: 'mh-2',
      date: '10.01.2026',
      doctor: 'Dr. Botir Rahimov',
      specialty: 'Nevrologiya',
      diagnosis: 'Miovaginal charchoq sindromi',
      recommendations: 'Uyqu gigiyenasiga rioya qilish, B guruhi vitaminlari kursi'
    }
  ];

  // Retseptlar
  const prescriptions = userProfile?.prescriptions || [
    {
      id: 'rx-1',
      date: '15.02.2026',
      doctor: 'Dr. Nilufar Karimova',
      medication: 'Kardipril 5mg',
      dosage: 'Kuniga 1 mahal ertalab, ovqatdan oldin',
      duration: '30 kun',
      status: 'Faol'
    },
    {
      id: 'rx-2',
      date: '15.02.2026',
      doctor: 'Dr. Nilufar Karimova',
      medication: 'Magnelis B6',
      dosage: 'Kuniga 2 mahal 1 tabletkadan, ovqat paytida',
      duration: '20 kun',
      status: 'Faol'
    },
    {
      id: 'rx-3',
      date: '10.01.2026',
      doctor: 'Dr. Botir Rahimov',
      medication: 'Nootropil 800mg',
      dosage: 'Kuniga 2 mahal ertalab va tushda',
      duration: '15 kun',
      status: 'Yakunlangan'
    }
  ];

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (typeof updateUserProfile === 'function') {
      updateUserProfile(profileForm);
    }
    setIsEditingProfile(false);
    showToast(t('patientPortal.profileUpdated'), 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 p-6 sm:p-8 border border-teal-500/20 shadow-2xl shadow-teal-950/40">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-teal-500/30 border border-teal-400/40 flex-shrink-0">
              {(userProfile?.fullName || userProfile?.name || 'B').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {userProfile?.fullName || userProfile?.name || 'Bemor'}
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{t('patientPortal.tabProfile')}</span>
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-1 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {userProfile?.phone || '+998 -- --- -- --'}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" /> {userProfile?.bloodGroup || 'A (II) Rh+'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate && onNavigate('/')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <span>{t('patientPortal.bookAppointmentBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 TA ASOSIY BO'LIM TABLARI ───────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shadow-xs ${
            activeTab === 'appointments'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('patientPortal.tabAppointments')}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            activeTab === 'appointments' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {myAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shadow-xs ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{t('patientPortal.tabHistory')}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            activeTab === 'history' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {medicalHistory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shadow-xs ${
            activeTab === 'prescriptions'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>{t('patientPortal.tabPrescriptions')}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            activeTab === 'prescriptions' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {prescriptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shadow-xs ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t('patientPortal.tabProfile')}</span>
        </button>
      </div>

      {/* ── 1. MENING NAVBATLARIM ─────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {myAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAppointments.map(app => (
                <div 
                  key={app.id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-mono text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                      {app.ticketCode || 'T-001'}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {app.status || 'Tasdiqlangan'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t('doctor_detail.title')}:</span>
                      <strong className="text-slate-900 dark:text-white">{app.doctorName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t('specialties.title')}:</span>
                      <span className="font-semibold text-teal-700 dark:text-teal-400">{app.specialtyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t('booking.date_time')}:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{app.date} • {app.timeSlot}</span>
                    </div>
                    {app.hospitalName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">{t('booking.hospital')}:</span>
                        <span className="text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">{app.hospitalName}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedAppointment(app);
                        setActiveModal('video-call');
                      }}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{t('patient.btn_video_call')}</span>
                    </button>

                    <button
                      onClick={() => cancelAppointment(app.id)}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      {t('patient.btn_cancel')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t('patientPortal.emptyAppointments')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {t('patientPortal.emptyAppointmentsDesc')}
                </p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('/')}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-500/20 transition active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <span>{t('patientPortal.bookAppointmentBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 2. TIBBIY TARIX ───────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {medicalHistory.length > 0 ? (
            <div className="space-y-3">
              {medicalHistory.map(item => (
                <div 
                  key={item.id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <strong className="text-sm font-black text-slate-900 dark:text-white">{item.doctor}</strong>
                      <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold">({item.specialty})</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{item.date}</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400 font-bold">{t('doctor.diagnosis')}: </span>
                      <strong className="text-slate-900 dark:text-white">{item.diagnosis}</strong>
                    </p>
                    {item.recommendations && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <span className="text-slate-400 font-bold">Tavsiyalar: </span>
                        <span>{item.recommendations}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {t('patientPortal.emptyHistory')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t('patientPortal.emptyHistoryDesc')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 3. RETSEPTLAR ─────────────────────────────────────────── */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map(rx => (
                <div 
                  key={rx.id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
                        <Pill className="w-4 h-4" />
                      </div>
                      <strong className="text-sm font-black text-slate-900 dark:text-white">{rx.medication}</strong>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      rx.status === 'Faol' 
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {rx.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('patientPortal.prescriptionDoctor')}:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{rx.doctor}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('patientPortal.prescriptionDate')}:</span>
                      <span className="font-mono">{rx.date}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{t('patientPortal.prescriptionDosage')}</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{rx.dosage} ({rx.duration})</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => showToast("Elektron retsept PDF nusxasi yuklab olinmoqda...", "info")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('patientPortal.downloadPdf')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
                <Pill className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {t('patientPortal.emptyPrescriptions')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t('patientPortal.emptyPrescriptionsDesc')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 4. PROFIL ─────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {t('patientPortal.tabProfile')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Shaxsiy kartochkangiz va kontakt ma'lumotlaringiz
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition cursor-pointer"
            >
              {isEditingProfile ? "Bekor qilish" : "Tahrirlash"}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('patientPortal.profileFullName')}
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('patientPortal.profilePhone')}
                </label>
                <input
                  type="text"
                  disabled
                  value={profileForm.phone}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('patientPortal.profileAge')}
                </label>
                <input
                  type="number"
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('patientPortal.profileBloodGroup')}
                </label>
                <input
                  type="text"
                  value={profileForm.bloodGroup}
                  onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('patientPortal.profileAddress')}
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition cursor-pointer"
                >
                  {t('patientPortal.saveChanges')}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">{t('patientPortal.profileFullName')}</span>
                <strong className="text-sm text-slate-800 dark:text-white">{userProfile?.fullName || userProfile?.name || 'Bemor'}</strong>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">{t('patientPortal.profilePhone')}</span>
                <strong className="text-sm font-mono text-slate-800 dark:text-white">{userProfile?.phone || '-'}</strong>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">{t('patientPortal.profileAge')} & {t('patientPortal.profileGender')}</span>
                <strong className="text-sm text-slate-800 dark:text-white">{userProfile?.age || '28'} yosh ({userProfile?.gender || 'Erkak'})</strong>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">{t('patientPortal.profileBloodGroup')}</span>
                <strong className="text-sm text-rose-600 dark:text-rose-400">{userProfile?.bloodGroup || 'A (II) Rh+'}</strong>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">{t('patientPortal.profileAddress')}</span>
                <strong className="text-sm text-slate-800 dark:text-white">{userProfile?.address || "Toshkent shahri"}</strong>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
