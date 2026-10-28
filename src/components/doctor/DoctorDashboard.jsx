import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorReviewsBlock } from './DoctorReviewsBlock';
import { DoctorPendingReviewView } from './DoctorPendingReviewView';
import { DoctorNotificationPanel, DoctorNavBell } from './DoctorNotificationPanel';
import { DoctorAttendancePanel } from './DoctorAttendancePanel';
import { DoctorAvatarUpload, InitialsAvatar } from './DoctorAvatarUpload';
import { DoctorPanelTour } from './DoctorPanelTour';
import { getDoctorReviewStats, getDoctorComplaintCount } from '../../services/reviewService';
import { getDoctorUnreadCount, notifyScheduleChange } from '../../services/doctorNotificationService';
import { isMorningTime, getTodayAttendance, checkInDoctor, markAbsent } from '../../services/doctorAttendanceService';
import { 
  Clock, 
  Plus, 
  FilePlus, 
  CheckCircle2, 
  Star, 
  ShieldAlert, 
  MessageSquare, 
  Check, 
  X, 
  AlertCircle,
  Bell,
  CalendarClock,
  Camera,
  UserCircle
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { 
    t, 
    doctors, 
    appointments, 
    userProfile,
    currentRole,
    completeAppointment, 
    updateAppointmentStatus, 
    showToast, 
    getLocalized 
  } = useApp();
  
  const [selectedDocId, setSelectedDocId] = useState('doc-tash-1');
  
  const activeDoctor = (currentRole === 'doctor' && userProfile?.id)
    ? (doctors.find(d => d.id === userProfile.id || d.email === userProfile.email || d.name === userProfile.name) || userProfile)
    : (doctors.find(d => d.id === selectedDocId) || doctors[0]);

  const isPendingOrRejected = activeDoctor?.status === 'pending_verification' || 
                              activeDoctor?.status === 'rejected' || 
                              (activeDoctor?.licenseVerified === false && activeDoctor?.status !== 'approved');

  if (currentRole === 'doctor' && isPendingOrRejected) {
    return <DoctorPendingReviewView doctor={activeDoctor} />;
  }

  const docAppointments = appointments.filter(a => 
    (a.doctorId && a.doctorId === activeDoctor.id) || 
    (a.doctorName && activeDoctor.name && (
      a.doctorName.toLowerCase().includes(activeDoctor.name.toLowerCase()) ||
      activeDoctor.name.toLowerCase().includes(a.doctorName.toLowerCase())
    ))
  );

  // tabs: 'timeline' | 'notifications' | 'attendance' | 'reviews' | 'schedule' | 'prescription' | 'profile'
  const [activeTab, setActiveTab] = useState('timeline');
  const [newSlotInput, setNewSlotInput] = useState('');
  const [customSlots, setCustomSlots] = useState(activeDoctor.availableSlots || []);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxMedicines, setRxMedicines] = useState('');
  const [confirmingApp, setConfirmingApp] = useState(null);
  
  // Xabarlar soni (real-time)
  const [doctorUnreadCount, setDoctorUnreadCount] = useState(0);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  
  // Ertalabki savol modal
  const [showMorningModal, setShowMorningModal] = useState(false);

  const doctorId = activeDoctor?.id;

  // Bugungi davomat holati (absent bo'lsa panel yopiq)
  const [todayStatus, setTodayStatus] = useState(() => getTodayAttendance(doctorId));

  // Davomat o'zgarganda yangilansin
  useEffect(() => {
    const h = () => setTodayStatus(getTodayAttendance(doctorId));
    window.addEventListener('mednavbat_attendance_changed', h);
    return () => window.removeEventListener('mednavbat_attendance_changed', h);
  }, [doctorId]);

  // Xabarlar soni yangilanishi
  const refreshUnread = useCallback(() => {
    if (doctorId) setDoctorUnreadCount(getDoctorUnreadCount(doctorId));
  }, [doctorId]);

  useEffect(() => {
    refreshUnread();
    window.addEventListener('mednavbat_doctor_notifs_changed', refreshUnread);
    const interval = setInterval(refreshUnread, 10000);
    return () => {
      window.removeEventListener('mednavbat_doctor_notifs_changed', refreshUnread);
      clearInterval(interval);
    };
  }, [refreshUnread]);

  // Global drawer ochish hodisasi
  useEffect(() => {
    const openHandler = () => setIsNotifDrawerOpen(true);
    window.addEventListener('mednavbat_open_doctor_notif_drawer', openHandler);
    return () => window.removeEventListener('mednavbat_open_doctor_notif_drawer', openHandler);
  }, []);

  // Real-time yangi xabar kelganda toast ko'rsatish
  useEffect(() => {
    if (!doctorId) return;
    const toastHandler = (e) => {
      const notif = e.detail;
      if (notif && notif.doctor_id === doctorId) {
        showToast(`${notif.title}: ${notif.message}`, 'info', 4500);
      }
    };
    window.addEventListener('mednavbat_new_doctor_toast', toastHandler);
    return () => window.removeEventListener('mednavbat_new_doctor_toast', toastHandler);
  }, [doctorId, showToast]);

  // Ertalabki "Ishga keldingizmi?" modal
  useEffect(() => {
    if (!doctorId) return;
    if (!isMorningTime()) return;
    const todayAttn = getTodayAttendance(doctorId);
    if (!todayAttn.status) {
      const key = `mednavbat_morning_asked_${doctorId}_${new Date().toISOString().split('T')[0]}`;
      if (!localStorage.getItem(key)) {
        setTimeout(() => setShowMorningModal(true), 1200);
        localStorage.setItem(key, 'true');
      }
    }
  }, [doctorId]);

  const localizedSpec = getLocalized(activeDoctor, 'specialtyName');
  const localizedHosp = getLocalized(activeDoctor, 'hospitalName');

  const reviewStats = getDoctorReviewStats(activeDoctor.id);
  const complaintCount = getDoctorComplaintCount(activeDoctor.id);

  const completedCount = docAppointments.filter(
    a => a.status === 'Yakunlangan' || a.status === 'Yakunlandi'
  ).length;

  const pendingCount = docAppointments.filter(
    a => a.status === 'Tasdiqlangan' || a.status === 'Kutmoqda' || a.status === 'Qabulda'
  ).length;

  const handleAddSlot = () => {
    if (!newSlotInput.trim()) return;
    if (customSlots.includes(newSlotInput)) {
      showToast('Slot allaqachon mavjud', 'warning');
      return;
    }
    setCustomSlots([...customSlots, newSlotInput]);
    notifyScheduleChange(doctorId, `Yangi qabul vaqti qo'shildi (${newSlotInput})`);
    setNewSlotInput('');
    showToast(`Yangi qabul vaqti qo'shildi (${newSlotInput})`, 'success');
  };

  const handleRemoveSlot = (slot) => {
    setCustomSlots(customSlots.filter(s => s !== slot));
    notifyScheduleChange(doctorId, `Qabul vaqti olib tashlandi (${slot})`);
    showToast(`Qabul vaqti olib tashlandi (${slot})`, 'info');
  };

  const handleSaveRx = () => {
    if (!rxDiagnosis || !rxMedicines) {
      showToast('Tashxis va dori-darmonlar retseptini kiriting', 'warning');
      return;
    }
    showToast('Retsept bemor elektron kartasiga saqlandi', 'success');
    setRxDiagnosis('');
    setRxMedicines('');
  };

  const handleConfirmCheck = () => {
    if (!confirmingApp) return;
    completeAppointment(confirmingApp.id, activeDoctor);
    setConfirmingApp(null);
  };

  // Avatar storage key
  const avatarKey = `mednavbat_avatar_${activeDoctor?.id}`;
  const [avatarUrl, setAvatarUrl] = useState(() => 
    activeDoctor?.avatar || localStorage.getItem(avatarKey) || null
  );

  // Tab navigation helper (tour uchun)
  const handleTabChange = (tab) => setActiveTab(tab);

  return (
    <div className="py-8 bg-slate-100 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Doctor Panel Tour */}
        <DoctorPanelTour onTabChange={handleTabChange} />

        {/* Ertalabki savol modal */}
        {showMorningModal && (
          <MorningCheckModal
            doctorId={doctorId}
            onClose={() => setShowMorningModal(false)}
            onCheckedIn={() => setTodayStatus(getTodayAttendance(doctorId))}
            onMarkedAbsent={() => setTodayStatus(getTodayAttendance(doctorId))}
          />
        )}

        {/* Bugun kelmaganlik (absent) — panel yopiq ko'rinishi */}
        {todayStatus.status === 'absent' && currentRole === 'doctor' && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center">
            <div className="max-w-sm w-full bg-slate-900 rounded-3xl border border-slate-700 p-8 shadow-2xl space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mx-auto text-4xl">
                🏥
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Bugun dam olish kunida</h2>
                <p className="text-sm text-slate-400 mt-2">
                  Siz bugun ishga kelmaganligingizni belgiladingiz. Shifokor paneli bugun uchun yopiq.
                </p>
                {todayStatus.reason && (
                  <div className="mt-3 p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs text-slate-300">
                    <span className="font-bold text-slate-400">Sabab: </span>
                    {{
                      illness: '🤒 Kasallik',
                      emergency: '🚨 Favqulodda holat',
                      other: '📋 Boshqa sabab',
                    }[todayStatus.reason] || todayStatus.reason}
                    {todayStatus.note && <p className="mt-1 text-slate-400 italic">{todayStatus.note}</p>}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-3">
                  Agar xato bo'lsa, admin bilan bog'laning. Admin bu holatni o'zgartirishi mumkin.
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-sm font-bold transition"
              >
                Yangilash
              </button>
            </div>
          </div>
        )}

        {/* Doctor Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl}
                  alt={`Dr. ${activeDoctor.name}`}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-teal-500/30 shadow-lg"
                />
              ) : (
                <InitialsAvatar
                  name={activeDoctor.name || activeDoctor.fullName || ''}
                  doctorId={activeDoctor.id || ''}
                  size={80}
                  className="border-4 border-teal-500/30 shadow-lg rounded-2xl"
                />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {t('doctor.dashboard_title', 'Shifokor Boshqaruv Paneli')}
                </span>
                <span className="text-xs text-teal-300 font-semibold">{t('booking.room', 'Xona')} {activeDoctor.roomNumber}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{activeDoctor.name}</h1>
              <p className="text-xs text-slate-300 mt-1">{localizedSpec} — {localizedHosp}</p>
            </div>
          </div>

          {/* Right: Bell + Demo Switcher */}
          <div className="flex items-center gap-3">
            {/* Xabarlar bell */}
            <DoctorNavBell
              doctorId={doctorId}
              unreadCount={doctorUnreadCount}
              onOpen={() => setIsNotifDrawerOpen(true)}
            />

            <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold block">{t('nav.role_doctor')} (Demo almashish):</span>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full bg-slate-900 text-white text-xs font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-teal-500 cursor-pointer"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.fullName} ({getLocalized(d, 'specialtyName').split('(')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">Bugungi navbatlar</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{docAppointments.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">Kutilmoqda / Qabulda</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">Tekshirildi (Yakunlandi)</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</p>
          </div>

          <div 
            onClick={() => setActiveTab('reviews')}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-amber-400 transition group"
          >
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block flex items-center justify-between">
              <span>Shifokor Reytingi</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-500">{reviewStats.avg}</span>
              <span className="text-xs text-slate-400">({reviewStats.count} ta baho)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block flex items-center justify-between">
              <span>Shikoyatlar</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl sm:text-3xl font-black ${complaintCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {complaintCount}
              </span>
              <span className="text-xs text-slate-400">ta bildirilgan</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {/* Timeline */}
          <TabBtn label={`Navbatlar (${docAppointments.length})`} tab="timeline" active={activeTab} onClick={setActiveTab} />

          {/* Xabarlar — badge bilan */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`relative px-5 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'notifications' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Xabarlar</span>
            {doctorUnreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {doctorUnreadCount > 99 ? '99+' : doctorUnreadCount}
              </span>
            )}
          </button>

          {/* Davomat */}
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'attendance' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Davomat
          </button>

          {/* Reviews */}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reviews' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Sharhlar ({reviewStats.count})</span>
          </button>

          <TabBtn label={t('doctor.manage_schedule', 'Jadval')} tab="schedule" active={activeTab} onClick={setActiveTab} />
          <TabBtn label={t('doctor.btn_save_rx', 'Retsept')} tab="prescription" active={activeTab} onClick={setActiveTab} />

          {/* Profil */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'profile' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <UserCircle className="w-3.5 h-3.5" />
            Profil
          </button>
        </div>

        {/* ─── TAB CONTENT ──────────────────────────────────────────────────────── */}

        {/* TAB: timeline */}
        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Bugungi navbatlar ro'yxati
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Qabuldan so'ng "Tekshirildi" tugmasini bosing
              </span>
            </div>

            {docAppointments.length > 0 ? (
              <div className="space-y-3">
                {docAppointments.map((app) => {
                  const isCompleted = app.status === 'Yakunlangan' || app.status === 'Yakunlandi';
                  return (
                    <div 
                      key={app.id} 
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompleted
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">{app.patientName}</span>
                          <span className="text-xs bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            {app.ticketCode}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{app.patientPhone}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {app.date} ({app.timeSlot}) — <span className="italic">{app.symptoms || "Profilaktik ko'rik"}</span>
                        </p>
                        {app.completed_at && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Tekshirildi: {new Date(app.completed_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {isCompleted ? (
                          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Yakunlangan</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setConfirmingApp(app)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/25 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Tekshirildi</span>
                            </button>

                            <select
                              value={app.status}
                              onChange={(e) => updateAppointmentStatus(app.id, e.target.value)}
                              className="text-xs font-bold p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 cursor-pointer text-slate-800 dark:text-white"
                            >
                              <option value="Tasdiqlangan">Tasdiqlangan</option>
                              <option value="Qabulda">Qabulda</option>
                              <option value="Bekor qilingan">Bekor qilingan</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Bugun uchun navbatlar mavjud emas.</p>
            )}
          </div>
        )}

        {/* TAB: notifications */}
        {activeTab === 'notifications' && (
          <DoctorNotificationPanel
            doctorId={doctorId}
            onNavigate={handleTabChange}
          />
        )}

        {/* TAB: attendance */}
        {activeTab === 'attendance' && (
          <DoctorAttendancePanel doctor={activeDoctor} />
        )}

        {/* TAB: reviews */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>Mening Reytingim va Bemorlar Sharhlari</span>
                </h3>
              </div>
              <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-extrabold text-amber-700 dark:text-amber-400">
                O'rtacha: ★ {reviewStats.avg}
              </div>
            </div>
            <DoctorReviewsBlock doctorId={activeDoctor.id} isDoctorPanel={true} />
          </div>
        )}

        {/* TAB: schedule */}
        {activeTab === 'schedule' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('doctor.manage_schedule')}</h3>
            <div className="flex gap-3 max-w-md">
              <input
                type="text"
                placeholder="17:30"
                value={newSlotInput}
                onChange={(e) => setNewSlotInput(e.target.value)}
                className="flex-1 text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none"
              />
              <button
                onClick={handleAddSlot}
                className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Slot qo'shish</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customSlots.map((slot) => (
                <div key={slot} className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{slot}</span>
                  <button onClick={() => handleRemoveSlot(slot)} className="text-rose-500 hover:text-rose-700 font-black ml-1">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: prescription */}
        {activeTab === 'prescription' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-w-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <FilePlus className="w-5 h-5 text-teal-600" />
              <span>{t('doctor.btn_save_rx')}</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('doctor.diagnosis')}:</label>
                <input
                  type="text"
                  placeholder="Masalan: O'tkir bronxit, arterial gipertoniya"
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('doctor.prescription')}:</label>
                <textarea
                  rows={4}
                  placeholder="Dori-darmonlar va qabul qilish tartibi..."
                  value={rxMedicines}
                  onChange={(e) => setRxMedicines(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-white outline-none"
                />
              </div>
              <button
                onClick={handleSaveRx}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                {t('doctor.btn_save_rx')}
              </button>
            </div>
          </div>
        )}

        {/* TAB: profile */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <UserCircle className="w-5 h-5 text-teal-600" />
              Profil Sozlamalari
            </h3>
            <DoctorAvatarUpload
              doctor={activeDoctor}
              onAvatarChange={(url) => setAvatarUrl(url)}
            />
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Ism Familiya</label>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{activeDoctor.name || activeDoctor.fullName}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Mutaxassislik</label>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{localizedSpec}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Shifoxona</label>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{localizedHosp}</p>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                * Ma'lumotlarni o'zgartirish uchun admin bilan bog'laning yoki ro'yxatdan o'tish formasi orqali yangilang.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ── Tasdiqlash modal ── */}
      {confirmingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Bemor tekshirildimi?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Qabul tugallanganini tasdiqlaysizmi?</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Bemor:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{confirmingApp.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Chipta raqami:</span>
                <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{confirmingApp.ticketCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Vaqti:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{confirmingApp.date} ({confirmingApp.timeSlot})</span>
              </div>
            </div>

            <p className="text-[11px] text-teal-700 dark:text-teal-400/90 bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-200 dark:border-teal-800 leading-relaxed">
              ⭐ <strong>Muhim:</strong> Tasdiqlanganidan so'ng navbat holati <strong>"Yakunlangan"</strong> deb o'zgartiriladi va bemorga darhol shifokor xizmatini baholash uchun bildirishnoma yuboriladi.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingApp(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmCheck}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 transition transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ha, tekshirildi</span>
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Responsive Side-Drawer / Fullscreen Modal for Notifications */}
        {isNotifDrawerOpen && (
          <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsNotifDrawerOpen(false)}
            />
            {/* Drawer body: 100% on mobile, max-w-xl on sm+ */}
            <div className="relative w-full sm:max-w-xl h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300">
              <DoctorNotificationPanel
                doctorId={doctorId}
                onNavigate={(sec) => {
                  setActiveTab(sec);
                  setIsNotifDrawerOpen(false);
                }}
                isDrawer={true}
                onClose={() => setIsNotifDrawerOpen(false)}
                onOpenFull={() => {
                  setActiveTab('notifications');
                  setIsNotifDrawerOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
  );
};

// ── Helper components ──────────────────────────────────────────────────────────

function TabBtn({ label, tab, active, onClick }) {
  return (
    <button
      onClick={() => onClick(tab)}
      className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap ${
        active === tab 
          ? 'bg-teal-700 text-white shadow-md' 
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

// ── Ertalabki modal ──────────────────────────────────────────────────────────────
function MorningCheckModal({ doctorId, onClose, onCheckedIn, onMarkedAbsent }) {
  const { showToast } = useApp();
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [reason, setReason] = useState('kasallik'); // 'kasallik' | 'favqulodda' | 'boshqa'
  const [note, setNote] = useState('');

  const handleYes = () => {
    checkInDoctor(doctorId);
    showToast("Bugungi davomat belgilandi ✅ Yaxshi ish kuni bo'lsin!", 'success', 4000);
    if (onCheckedIn) onCheckedIn();
    onClose();
  };

  const handleConfirmAbsent = () => {
    markAbsent(doctorId, reason, note);
    showToast("Bugun kelmaganligingiz qayd etildi. Shifokor paneli bugun uchun yopiq qoladi.", 'warning', 5000);
    if (onMarkedAbsent) onMarkedAbsent();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
        <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto text-3xl">
          ☀️
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Xayrli tong!</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Bugun ishga keldingizmi?
          </p>
        </div>

        {!showReasonForm ? (
          <div className="space-y-3">
            <button
              onClick={handleYes}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-sm font-extrabold transition transform active:scale-95 shadow-md shadow-teal-500/20"
              style={{ minHeight: 48 }}
            >
              ✅ Ha, ishga keldim
            </button>
            <button
              onClick={() => setShowReasonForm(true)}
              className="w-full py-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-sm font-bold transition hover:bg-rose-100"
              style={{ minHeight: 48 }}
            >
              ❌ Yo'q, bugun kela olmayman
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-1 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kelolmaslik sababi:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="kasallik">🤒 Kasallik / Betoblik</option>
                <option value="favqulodda">🚨 Favqulodda holat</option>
                <option value="boshqa">📝 Boshqa uzrli sabab</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Qo'shimcha izoh (ixtiyoriy):
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Sabab haqida qisqacha ma'lumot..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReasonForm(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Ortga
              </button>
              <button
                type="button"
                onClick={handleConfirmAbsent}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-sm"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
