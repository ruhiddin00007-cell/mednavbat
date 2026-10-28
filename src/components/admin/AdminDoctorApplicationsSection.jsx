import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Eye, 
  FileText, 
  Award, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  Check, 
  X, 
  AlertTriangle, 
  Download,
  Filter,
  ShieldCheck,
  UserCheck,
  Home,
  MapPin
} from 'lucide-react';
import { LocationPickerMap } from '../common/LocationPickerMap';

export const AdminDoctorApplicationsSection = () => {
  const { 
    t, 
    doctorApplications, 
    approveDoctorApplication, 
    rejectDoctorApplication,
    approveCabinetLocation,
    showToast 
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('pending_verification'); // 'all' | 'pending_verification' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ko'rib chiqish modali
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Tasdiqlash modali (Ish kunlari va vaqtlarini belgilash)
  const [approvingApp, setApprovingApp] = useState(null);
  const [selectedDays, setSelectedDays] = useState(['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma']);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('18:00');
  const [roomNumber, setRoomNumber] = useState('204-xona');
  const [consultationPrice, setConsultationPrice] = useState(150000);

  // Rad etish modali (Sabab yozish)
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Hujjatni to'liq ekranda ko'rish
  const [previewDoc, setPreviewDoc] = useState(null);

  const ALL_DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

  const filteredApps = (doctorApplications || []).filter(app => {
    if (activeFilter === 'pending_verification') {
      if (app.status !== 'pending_verification' && app.status !== 'pending') return false;
    } else if (activeFilter !== 'all' && app.status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.fullName?.toLowerCase().includes(q) || app.name?.toLowerCase().includes(q);
      const matchPhone = app.phone?.toLowerCase().includes(q);
      const matchEmail = app.email?.toLowerCase().includes(q);
      const matchSpec = app.specialtyName?.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchSpec;
    }
    return true;
  });

  const pendingCount = (doctorApplications || []).filter(a => a.status === 'pending_verification' || a.status === 'pending').length;
  const reviewCount = (doctorApplications || []).filter(a => a.status === 'needs_review').length;
  const approvedCount = (doctorApplications || []).filter(a => a.status === 'approved').length;
  const rejectedCount = (doctorApplications || []).filter(a => a.status === 'rejected').length;

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) {
        showToast("Kamida bitta ish kuni belgilanishi shart.", "warning");
        return;
      }
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleConfirmApproval = () => {
    if (!approvingApp) return;

    // Slotlarni hosil qilish
    const slots = [];
    const startInt = parseInt(startHour.split(':')[0], 10);
    const endInt = parseInt(endHour.split(':')[0], 10);
    for (let h = startInt; h < endInt; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }

    const res = approveDoctorApplication(approvingApp.id, {
      workScheduleDays: selectedDays,
      availableSlots: slots.length > 0 ? slots : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      roomNumber: roomNumber.trim() || '101-xona',
      consultationPrice: Number(consultationPrice) || 150000
    });

    if (res.success) {
      showToast(res.message, "success");
      setApprovingApp(null);
      setSelectedApp(null);
    } else {
      showToast(res.error || "Xatolik yuz berdi.", "error");
    }
  };

  const handleConfirmRejection = () => {
    if (!rejectingApp) return;
    if (!rejectionReason.trim()) {
      showToast("Iltimos, rad etish sababini aniq yozing.", "warning");
      return;
    }

    const res = rejectDoctorApplication(rejectingApp.id, rejectionReason);
    if (res.success) {
      showToast(res.message, "info");
      setRejectingApp(null);
      setSelectedApp(null);
      setRejectionReason('');
    } else {
      showToast(res.error || "Xatolik yuz berdi.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <span className="text-xs text-slate-400 font-bold block">Jami Arizalar</span>
          <p className="text-2xl font-black text-white mt-1">{(doctorApplications || []).length}</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-2xl border border-amber-600/40 bg-amber-950/20">
          <span className="text-xs text-amber-400 font-bold block">Kutilayotganlar</span>
          <p className="text-2xl font-black text-amber-300 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-2xl border border-purple-600/40 bg-purple-950/20">
          <span className="text-xs text-purple-400 font-bold block">AI / Shubhali</span>
          <p className="text-2xl font-black text-purple-300 mt-1">{reviewCount}</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-2xl border border-emerald-600/40 bg-emerald-950/20">
          <span className="text-xs text-emerald-400 font-bold block">Tasdiqlangan</span>
          <p className="text-2xl font-black text-emerald-300 mt-1">{approvedCount}</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-2xl border border-rose-600/40 bg-rose-950/20">
          <span className="text-xs text-rose-400 font-bold block">Rad etilgan</span>
          <p className="text-2xl font-black text-rose-300 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1 rounded-2xl">
          <button
            onClick={() => setActiveFilter('pending_verification')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'pending_verification'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kutilmoqda ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('needs_review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'needs_review'
                ? 'bg-purple-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Tekshiruv ({reviewCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'approved'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasdiqlangan ({approvedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'rejected'
                ? 'bg-rose-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rad etilgan ({rejectedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'all'
                ? 'bg-slate-700 text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Barchasi
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Shifokor ismi, mutaxassisligi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {filteredApps.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Ushbu toifada shifokor arizalari mavjud emas.</p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-700 hover:border-slate-600 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <img
                  src={app.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'}
                  alt={app.fullName || app.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700 flex-shrink-0"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white">
                      {app.fullName || app.name}
                    </h3>

                    {/* Status Badge */}
                    {app.status === 'pending_verification' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Kutilmoqda
                      </span>
                    )}
                    {app.status === 'approved' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Tasdiqlangan
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Rad etilgan
                      </span>
                    )}

                    {/* Xususiy shifokor belgisi */}
                    {(app.isPrivateDoctor || app.practiceType === 'private_practice' || app.practiceType === 'both' || app.privateCabinet) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Home className="w-3 h-3 text-purple-400" />
                        <span>Xususiy shifokor</span>
                      </span>
                    )}

                    {/* Joylashuv tekshiruvi kutilmoqda */}
                    {app.cabinetLocationNeedsReview && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>Joylashuv o'zgardi</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-teal-400 font-bold mt-0.5">
                    {app.specialtyName || app.specialty} • {app.experienceYears || 0} yil staj
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>{app.hospitalName}</span>
                    <span>•</span>
                    <span>{app.phone}</span>
                    <span>•</span>
                    <span>{app.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => setSelectedApp(app)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ko'rib chiqish</span>
                </button>

                {app.status === 'pending_verification' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setApprovingApp(app)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1 transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tasdiqlash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setRejectingApp(app); setRejectionReason(''); }}
                      className="px-3 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/40 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Rad etish</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ARIZA TAFSILOTLARI MODALI (DETAILS MODAL)
         ══════════════════════════════════════════════════════════════════════ */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 text-white shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedApp.avatar}
                  alt={selectedApp.fullName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500"
                />
                <div>
                  <h2 className="text-lg font-black">{selectedApp.fullName || selectedApp.name}</h2>
                  <p className="text-xs text-teal-400 font-bold">{selectedApp.specialtyName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Application Data Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl">
                <span className="text-slate-400 block font-bold">Telefon:</span>
                <span className="text-white font-bold">{selectedApp.phone}</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl">
                <span className="text-slate-400 block font-bold">Email:</span>
                <span className="text-white font-bold">{selectedApp.email}</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl">
                <span className="text-slate-400 block font-bold">Tug'ilgan sana:</span>
                <span className="text-white font-bold">{selectedApp.birthDate || "Ko'rsatilmagan"}</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl">
                <span className="text-slate-400 block font-bold">Ish staji:</span>
                <span className="text-white font-bold">{selectedApp.experienceYears || 0} yil</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl">
                <span className="text-slate-400 block font-bold">Diplom raqami:</span>
                <span className="text-white font-bold">{selectedApp.diplomaNumber}</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl">
                <span className="text-slate-400 block font-bold">Litsenziya № va Muddati:</span>
                <span className="text-white font-bold">{selectedApp.licenseNumber} ({selectedApp.licenseExpiry})</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl col-span-2">
                <span className="text-slate-400 block font-bold">Ishlayotgan shifoxonasi:</span>
                <span className="text-white font-bold">
                  {selectedApp.hospitalName} {selectedApp.hospitalRegion ? `(${selectedApp.hospitalRegion})` : ''} - {selectedApp.hospitalAddress}
                </span>
              </div>
            </div>

            {/* XUSUSIY KABINET JOYLASHUVI VA XARITASI (Talab 4) */}
            {(selectedApp.isPrivateDoctor || selectedApp.privateCabinet || selectedApp.practiceType !== 'hospital') && (
              <div className="p-4 bg-purple-950/30 border border-purple-800/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black uppercase text-purple-200">
                      Xususiy Kabinet Joylashuvi va Xaritasi (Admin Tekshiruvi)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedApp.privateCabinet?.privacyType === 'public'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {selectedApp.privateCabinet?.privacyType === 'public' ? 'Ochiq manzil' : 'Faqat navbat tasdiqlangach (Maxfiy)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px] font-bold">Kabinet nomi:</span>
                    <span className="text-white font-bold">{selectedApp.privateCabinet?.cabinetName || selectedApp.cabinetName || "Xususiy kabinet"}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px] font-bold">Hudud va Tuman:</span>
                    <span className="text-white font-bold">{selectedApp.privateCabinet?.regionName || selectedApp.hospitalRegion}, {selectedApp.privateCabinet?.district || selectedApp.district}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold">Aniq manzil va Mo'ljal:</span>
                    <span className="text-white font-bold">{selectedApp.privateCabinet?.address || selectedApp.hospitalAddress} {selectedApp.privateCabinet?.landmark ? `(${selectedApp.privateCabinet.landmark})` : ''}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px] font-bold">Kabinet telefoni:</span>
                    <span className="text-white font-bold">{selectedApp.privateCabinet?.phone || selectedApp.phone}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px] font-bold">Xususiy faoliyat litsenziyasi №:</span>
                    <span className="text-purple-300 font-bold">{selectedApp.privateLicenseNumber || selectedApp.licenseNumber}</span>
                  </div>
                </div>

                {/* Leaflet Xaritada ko'rsatish */}
                {(selectedApp.privateCabinet?.lat || selectedApp.lat) && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">Xaritada belgilangan joylashuv:</span>
                    <LocationPickerMap
                      initialCoords={{
                        lat: Number(selectedApp.privateCabinet?.lat || selectedApp.lat),
                        lng: Number(selectedApp.privateCabinet?.lng || selectedApp.lng)
                      }}
                      regionId={selectedApp.privateCabinet?.regionId || 'tashkent_city'}
                      district={selectedApp.privateCabinet?.district}
                      address={selectedApp.privateCabinet?.address}
                      privacyType={selectedApp.privateCabinet?.privacyType || 'after_confirmed'}
                      readOnly={true}
                      showPrivacySelector={false}
                    />
                  </div>
                )}

                {/* Joylashuv tekshiruvi kutilayotgan bo'lsa */}
                {selectedApp.cabinetLocationNeedsReview && (
                  <div className="pt-2 flex items-center justify-between bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-xl">
                    <span className="text-xs text-amber-200 font-bold">
                      ⚠️ Shifokor kabinet joylashuvini yangilagan.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const res = approveCabinetLocation(selectedApp.id);
                        if (res.success) {
                          showToast(res.message, 'success');
                          setSelectedApp({
                            ...selectedApp,
                            cabinetLocationNeedsReview: false,
                            privateCabinet: { ...selectedApp.privateCabinet, status: 'approved' }
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
                    >
                      Joylashuvni tasdiqlash
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Rad etilgan bo'lsa sabab */}
            {selectedApp.status === 'rejected' && selectedApp.rejectionReason && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-2xl text-xs space-y-1">
                <span className="text-rose-300 font-extrabold uppercase text-[10px] block">Rad etish sababi:</span>
                <p className="text-white font-bold">"{selectedApp.rejectionReason}"</p>
              </div>
            )}

            {/* AI LITSENZIYA VA HUJJAT TEKSHIRUVI NATIJASI (Talab 4) */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              (selectedApp.aiVerification?.isSuspicious || selectedApp.status === 'needs_review')
                ? 'bg-amber-950/30 border-amber-600/50'
                : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    (selectedApp.aiVerification?.isSuspicious || selectedApp.status === 'needs_review')
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-xs block">AI Tekshiruv & Hujjat Bahosi</span>
                    <span className="text-[10px] text-slate-400">Avtomatik OCR va tahrirlash tekshiruvi</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
                    (selectedApp.aiVerification?.confidenceScore ?? (selectedApp.status === 'needs_review' ? 62 : 94)) >= 80
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-amber-950/80 text-amber-300 border-amber-700'
                  }`}>
                    Ishonch bali: {selectedApp.aiVerification?.confidenceScore ?? (selectedApp.status === 'needs_review' ? 62 : 94)}%
                  </span>
                  {(selectedApp.aiVerification?.isSuspicious || selectedApp.status === 'needs_review') ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      ⚠️ Shubhali (needs_review)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ✓ Tasdiqlashga tayyor
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Ism-familiya mosligi:</span>
                  <span className="font-bold text-white">
                    {selectedApp.aiVerification?.ocrMatches?.nameMatch !== false ? "✓ Ro'yxatdagi ism bilan mos" : "⚠️ Mos kelmadi"}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Hujjat tahriri / soxtalik:</span>
                  <span className="font-bold text-white">
                    {selectedApp.aiVerification?.tamperAnalysis?.tamperRisk === 'high' ? "⚠️ Tahrir izlari topildi" : "✓ Asl nusxa (soxtalik belgisi yo'q)"}
                  </span>
                </div>
              </div>

              {selectedApp.aiVerification?.reasons?.length > 0 && (
                <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-xl border border-amber-800/60">
                  <span className="font-bold block text-[10px] uppercase text-amber-400">AI Xulosasi:</span>
                  {selectedApp.aiVerification.reasons.join(', ')}
                </div>
              )}
            </div>

            {/* YUKLANGAN HUJJATLARNI KO'RISH */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Yuklangan Hujjatlar:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedApp.diplomaFile ? (
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-400" />
                      <div className="truncate">
                        <span className="font-bold block truncate">{selectedApp.diplomaFile.name}</span>
                        <span className="text-[10px] text-slate-400">Diplom nusxasi</span>
                      </div>
                    </div>
                    {selectedApp.diplomaFile.dataUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ title: "Diplom nusxasi", dataUrl: selectedApp.diplomaFile.dataUrl, type: selectedApp.diplomaFile.type })}
                        className="py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-[11px] font-bold text-teal-300 flex items-center justify-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Hujjatni Ko'rish</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 text-xs text-slate-500">
                    Diplom fayli biriktirilmagan
                  </div>
                )}

                {selectedApp.licenseFile ? (
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      <div className="truncate">
                        <span className="font-bold block truncate">{selectedApp.licenseFile.name}</span>
                        <span className="text-[10px] text-slate-400">Tibbiy litsenziya nusxasi</span>
                      </div>
                    </div>
                    {selectedApp.licenseFile.dataUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ title: "Tibbiy litsenziya nusxasi", dataUrl: selectedApp.licenseFile.dataUrl, type: selectedApp.licenseFile.type })}
                        className="py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Hujjatni Ko'rish</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 text-xs text-slate-500">
                    Litsenziya fayli biriktirilmagan
                  </div>
                )}

                {/* Pasport yoki Selfie rasmi */}
                {selectedApp.passportFile ? (
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-400" />
                      <div className="truncate">
                        <span className="font-bold block truncate">{selectedApp.passportFile.name}</span>
                        <span className="text-[10px] text-slate-400">Pasport / Selfie surati</span>
                      </div>
                    </div>
                    {selectedApp.passportFile.dataUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ title: "Pasport / Selfie surati", dataUrl: selectedApp.passportFile.dataUrl, type: selectedApp.passportFile.type })}
                        className="py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-[11px] font-bold text-blue-300 flex items-center justify-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Rasmni Ko'rish</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 text-xs text-slate-500">
                    Pasport surati biriktirilmagan
                  </div>
                )}

                {/* Xususiy faoliyat litsenziyasi */}
                {selectedApp.privateLicenseFile && (
                  <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-800 flex flex-col justify-between gap-2 text-xs col-span-2 sm:col-span-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-400" />
                      <div className="truncate">
                        <span className="font-bold block truncate text-purple-200">{selectedApp.privateLicenseFile.name}</span>
                        <span className="text-[10px] text-purple-400">Xususiy tibbiy faoliyat litsenziyasi / ruxsatnomasi</span>
                      </div>
                    </div>
                    {selectedApp.privateLicenseFile.dataUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ title: "Xususiy tibbiy faoliyat litsenziyasi", dataUrl: selectedApp.privateLicenseFile.dataUrl, type: selectedApp.privateLicenseFile.type })}
                        className="py-1.5 px-3 bg-purple-800 hover:bg-purple-700 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Litsenziyani Ko'rish</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Yopish
              </button>

              {(selectedApp.status === 'pending_verification' || selectedApp.status === 'pending' || selectedApp.status === 'needs_review') && (
                <>
                  <button
                    type="button"
                    onClick={() => { setRejectingApp(selectedApp); setRejectionReason(''); }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Rad etish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovingApp(selectedApp)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Tasdiqlash & Ish Jadvalini Belgilash</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TASDIQLASH VA ISH JADVALINI BELGILASH MODALI
         ══════════════════════════════════════════════════════════════════════ */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Admin Tasdiqlashi
                </span>
                <h3 className="text-lg font-black mt-1">
                  {approvingApp.fullName || approvingApp.name} arizasini tasdiqlash
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingApp(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Shifokor qabullarini boshlashi uchun ish kunlari va ish soatlarini tasdiqlang:
            </p>

            {/* Ish kunlari tanlash */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Ish Kunlari:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedDays.includes(day)
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Ish soatlari va Xona */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Boshlanishi:</label>
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tugashi:</label>
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Xona №:</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="204-xona"
                  className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Konsultatsiya narxi (UZS):</label>
              <input
                type="number"
                step="10000"
                value={consultationPrice}
                onChange={(e) => setConsultationPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setApprovingApp(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Tasdiqlash va Faollashtirish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RAD ETISH SABABI MODALI
         ══════════════════════════════════════════════════════════════════════ */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-black">Arizani Rad Etish</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {rejectingApp.fullName || rejectingApp.name} arizasini nima sababdan rad etayotganingizni yozing. Ushbu sabab shifokorga SMS va email orqali yuboriladi:
            </p>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Masalan: Litsenziya nusxasi sifatsiz yuklangan yoki diplom raqami mos kelmadi..."
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Rad Etishni Tasdiqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HUJJATNI PREVIEW QILISH (RASM YOKI PDF MODALI)
         ══════════════════════════════════════════════════════════════════════ */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl p-5 text-white space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-black text-teal-400">{previewDoc.title}</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950 p-2 rounded-2xl min-h-[300px]">
              {previewDoc.type?.includes('pdf') ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.title}
                  className="w-full h-[500px] rounded-xl border border-slate-800"
                />
              ) : (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.title}
                  className="max-h-[500px] object-contain rounded-xl"
                />
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDoctorApplicationsSection;
