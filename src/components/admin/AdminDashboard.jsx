import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminFinanceSection } from './AdminFinanceSection';
import { AdminComplaintsSection } from './AdminComplaintsSection';
import { AdminAuditSection } from './AdminAuditSection';
import { AdminDoctorApplicationsSection } from './AdminDoctorApplicationsSection';
import { AdminDoctorMessaging } from './AdminDoctorMessaging';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  UserPlus, 
  Trash2, 
  Search, 
  Download,
  CreditCard,
  ArrowDownLeft,
  Lock,
  Wallet,
  Layers,
  AlertTriangle,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';

export const AdminDashboard = () => {
  const { 
    t,
    doctors, 
    deleteDoctor, 
    appointments, 
    specialties, 
    setActiveModal, 
    updateAppointmentStatus,
    showToast,
    getLocalized,
    logoutAdmin,
    availableBalance,
    doctorApplications
  } = useApp();

  const pendingApplicationsCount = (doctorApplications || []).filter(a => a.status === 'pending_verification').length;

  const [activeTab, setActiveTab] = useState('finance'); // 'finance' | 'doctors' | 'appointments' | 'departments' | 'applications' | 'complaints' | 'audit'
  const [adminSearch, setAdminSearch] = useState('');

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
    getLocalized(d, 'specialtyName').toLowerCase().includes(adminSearch.toLowerCase()) ||
    d.specialtyName.toLowerCase().includes(adminSearch.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a => 
    a.patientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
    a.doctorName.toLowerCase().includes(adminSearch.toLowerCase()) ||
    a.ticketCode.toLowerCase().includes(adminSearch.toLowerCase())
  );

  const exportCSV = () => {
    showToast('Navbatlar ro\'yxati CSV formatida eksport qilindi', 'success');
  };

  return (
    <div className="py-8 bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Tizim Administratori Paneli</span>
            </div>
            <h1 className="text-3xl font-black text-white mt-2">
              MedNavbat Boshqaruv & Moliya
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Faqat administrator uchun: bemorlar to'lovlari, sof balans va shaxsiy kartaga pul chiqarish
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Withdraw Button */}
            <button
              onClick={() => setActiveModal('admin-withdraw')}
              disabled={availableBalance <= 0}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition transform active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Pul Yechish ({availableBalance.toLocaleString()} UZS)</span>
            </button>

            {/* My Card Button */}
            <button
              onClick={() => setActiveModal('admin-card')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-2xl text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Mening Kartam</span>
            </button>

            {/* Add Doctor Button */}
            <button
              onClick={() => setActiveModal('add-doctor')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Shifokor Qo'shish</span>
            </button>

            {/* Logout Admin Session */}
            <button
              onClick={logoutAdmin}
              className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition"
              title="Admin panelini qulflash va chiqish"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'finance' 
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Moliya, To'lovlar & Mening Kartam</span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'doctors' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('admin.tab_doctors')} ({doctors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'appointments' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('admin.tab_appointments')} ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'departments' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('specialties.title')} ({specialties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 relative ${
              activeTab === 'applications' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Shifokor Arizalari</span>
            {pendingApplicationsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-rose-500/50 animate-pulse">
                {pendingApplicationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'complaints' 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Shikoyatlar & Nazorat</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'audit' 
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>Xavfsizlik Audit Jurnali</span>
          </button>

          <button
            onClick={() => setActiveTab('messaging')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'messaging' 
                ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Shifokorlarga Xabar</span>
          </button>
        </div>

        {/* TAB 1: MOLIYA, TO'LOVLAR & PUL YECHIB OLISH */}
        {activeTab === 'finance' && (
          <AdminFinanceSection />
        )}

        {/* TAB 2: SHIFOKORLAR BOSHQARUVI */}
        {activeTab === 'doctors' && (
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('nav.search_placeholder')}
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={() => setActiveModal('add-doctor')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ {t('admin.add_doctor_btn')}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">{t('doctor_detail.title')}</th>
                    <th className="p-3">{t('specialties.title')}</th>
                    <th className="p-3">{t('doctor_detail.experience')}</th>
                    <th className="p-3">{t('booking.hospital')}</th>
                    <th className="p-3">{t('doctors.consultation_fee')}</th>
                    <th className="p-3">{t('doctor_detail.rating')}</th>
                    <th className="p-3 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-750">
                      <td className="p-3 flex items-center space-x-3">
                        <img src={doc.avatar} alt={doc.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-bold text-white">{doc.name}</span>
                      </td>
                      <td className="p-3 text-teal-300 font-semibold">{getLocalized(doc, 'specialtyName').split('(')[0]}</td>
                      <td className="p-3 font-bold">{doc.experienceYears} {t('doctors.years_suffix')}</td>
                      <td className="p-3 text-slate-300">{getLocalized(doc, 'hospitalName')} ({doc.roomNumber})</td>
                      <td className="p-3 font-extrabold text-emerald-400">{doc.price.toLocaleString()} UZS</td>
                      <td className="p-3 font-bold text-amber-400">★ {doc.rating}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteDoctor(doc.id)}
                          className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: NAVBATLAR BOSHQARUVI */}
        {activeTab === 'appointments' && (
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('nav.search_placeholder')}
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={exportCSV}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">{t('booking.ticket_code')}</th>
                    <th className="p-3">{t('booking.patient_name')}</th>
                    <th className="p-3">{t('doctor_detail.title')}</th>
                    <th className="p-3">{t('booking.date_time')}</th>
                    <th className="p-3">{t('booking.payment_title')}</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Tahrirlash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-750">
                      <td className="p-3 font-mono font-bold text-teal-400">{app.ticketCode}</td>
                      <td className="p-3 font-bold text-white">{app.patientName} ({app.patientPhone})</td>
                      <td className="p-3 text-slate-300">{app.doctorName}</td>
                      <td className="p-3 font-semibold">{app.date} — {app.timeSlot}</td>
                      <td className="p-3 text-emerald-400 font-bold">{app.paymentStatus}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-900 text-teal-200 border border-teal-700">
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={app.status}
                          onChange={(e) => updateAppointmentStatus(app.id, e.target.value)}
                          className="bg-slate-900 text-white text-xs p-1.5 rounded-lg border border-slate-700 font-bold"
                        >
                          <option value="Tasdiqlangan">Tasdiqlangan</option>
                          <option value="Qabulda">Qabulda</option>
                          <option value="Yakunlandi">Yakunlandi</option>
                          <option value="Bekor qilingan">Bekor qilingan</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TIBBIY YO'NALISHLAR */}
        {activeTab === 'departments' && (
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('specialties.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {specialties.map((s) => (
                <div key={s.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-teal-400 text-sm">{getLocalized(s, 'name')}</h4>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">{s.badge}</span>
                  </div>
                  <p className="text-xs text-slate-400">{getLocalized(s, 'description')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SHIFOKOR ARIZALARI */}
        {activeTab === 'applications' && (
          <AdminDoctorApplicationsSection />
        )}

        {/* TAB 6: SHIKOYATLAR VA NAZORAT */}
        {activeTab === 'complaints' && (
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-6">
            <div className="border-b border-slate-700 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Bemorlar Shikoyatlari, Sharhlar Moderatsiyasi va Nazorat</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Shikoyatlarni ko'rib chiqish, bemorga rasmiy javob yo'llash, soxta sharhlarni moderatsiya qilish va shifokorlar qabul intizomini tekshirish
              </p>
            </div>
            <AdminComplaintsSection />
          </div>
        )}

        {/* TAB 7: XAVFSIZLIK AUDIT JURNALI */}
        {activeTab === 'audit' && (
          <AdminAuditSection />
        )}

        {/* TAB 8: SHIFOKORLARGA XABAR YUBORISH */}
        {activeTab === 'messaging' && (
          <AdminDoctorMessaging />
        )}

      </div>
    </div>
  );
};
