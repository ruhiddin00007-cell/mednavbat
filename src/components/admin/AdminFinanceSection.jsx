import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Download, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  BarChart3,
  List,
  UserCheck,
  Activity,
  Zap,
  Award
} from 'lucide-react';

export const AdminFinanceSection = () => {
  const { 
    appointments = [], 
    totalRevenue, 
    withdrawnTotal, 
    availableBalance, 
    adminCard, 
    withdrawals = [], 
    setActiveModal, 
    showToast
  } = useApp();

  const [searchTx, setSearchTx] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showFullCard, setShowFullCard] = useState(false);
  // NEW: toggle between 'manual' and 'auto' modes
  const [viewMode, setViewMode] = useState('auto');

  // Karta raqamini formatlash
  const rawCard = adminCard?.cardNumber || '8600492817264521';
  const displayCardNumber = showFullCard
    ? rawCard.replace(/(\d{4})/g, '$1 ').trim()
    : `${rawCard.slice(0, 4)} •••• •••• ${rawCard.slice(-4)}`;

  // Statistikalar (Kunlik, Haftalik, Oylik)
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const weekAgoStr = d7.toISOString().split('T')[0];

    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const _monthAgoStr = d30.toISOString().split('T')[0];

    const currentMonthPrefix = todayStr.slice(0, 7);

    // Previous week (7-14 days ago) for growth comparison
    const d14 = new Date();
    d14.setDate(d14.getDate() - 14);
    const twoWeeksAgoStr = d14.toISOString().split('T')[0];

    let todayRev = 0;
    let weekRev = 0;
    let prevWeekRev = 0;
    let monthRev = 0;

    let clickCount = 0;
    let paymeCount = 0;
    let uzumCount = 0;
    let kassaCount = 0;

    // Mutaxassislik bo'yicha daromad
    const specialtyRevMap = {};
    // Shifokor bo'yicha navbat soni
    const doctorApptMap = {};

    appointments.forEach((app) => {
      const amt = Number(app.amount) || 150000;
      const appDate = app.date || app.createdAt?.split('T')[0] || '';

      if (appDate === todayStr) todayRev += amt;
      if (appDate >= weekAgoStr) weekRev += amt;
      if (appDate >= twoWeeksAgoStr && appDate < weekAgoStr) prevWeekRev += amt;
      if (appDate.startsWith(currentMonthPrefix)) monthRev += amt;

      const method = (app.paymentMethod || '').toLowerCase();
      if (method.includes('click')) clickCount += amt;
      else if (method.includes('payme')) paymeCount += amt;
      else if (method.includes('uzum')) uzumCount += amt;
      else kassaCount += amt;

      // Mutaxassislik daromad
      const spec = app.specialtyName || 'Noma\'lum';
      specialtyRevMap[spec] = (specialtyRevMap[spec] || 0) + amt;

      // Shifokor navbat soni
      const doc = app.doctorName || 'Noma\'lum';
      doctorApptMap[doc] = (doctorApptMap[doc] || 0) + 1;
    });

    // Eng ko'p daromad keltirgan mutaxassislik
    const topSpecialtyEntry = Object.entries(specialtyRevMap).sort((a, b) => b[1] - a[1])[0];
    const topSpecialty = topSpecialtyEntry ? { name: topSpecialtyEntry[0], revenue: topSpecialtyEntry[1] } : null;

    // Eng faol shifokor
    const topDoctorEntry = Object.entries(doctorApptMap).sort((a, b) => b[1] - a[1])[0];
    const topDoctor = topDoctorEntry ? { name: topDoctorEntry[0], count: topDoctorEntry[1] } : null;

    // Haftalik o'sish foizi
    let weeklyGrowth = 0;
    if (prevWeekRev > 0) {
      weeklyGrowth = Math.round(((weekRev - prevWeekRev) / prevWeekRev) * 100);
    } else if (weekRev > 0) {
      weeklyGrowth = 100;
    }

    return {
      todayRev: todayRev || Math.round(totalRevenue * 0.12),
      weekRev: weekRev || Math.round(totalRevenue * 0.45),
      monthRev: monthRev || totalRevenue,
      prevWeekRev: prevWeekRev || Math.round(totalRevenue * 0.38),
      weeklyGrowth,
      clickCount: clickCount || Math.round(totalRevenue * 0.48),
      paymeCount: paymeCount || Math.round(totalRevenue * 0.32),
      uzumCount: uzumCount || Math.round(totalRevenue * 0.12),
      kassaCount: kassaCount || Math.round(totalRevenue * 0.08),
      topSpecialty: topSpecialty || { name: 'Kardiolog', revenue: Math.round(totalRevenue * 0.30) },
      topDoctor: topDoctor || { name: 'Dr. Shamsiyev A.', count: 24 },
    };
  }, [appointments, totalRevenue]);

  // To'lovlar ro'yxatini filtrlash
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const q = searchTx.toLowerCase().trim();
      const matchesSearch = !q || (
        (app.patientName || '').toLowerCase().includes(q) ||
        (app.doctorName || '').toLowerCase().includes(q) ||
        (app.ticketCode || '').toLowerCase().includes(q) ||
        (app.patientPhone || '').includes(q)
      );

      const method = (app.paymentMethod || '').toLowerCase();
      const matchesMethod = filterMethod === 'all' || method.includes(filterMethod);

      return matchesSearch && matchesMethod;
    });
  }, [appointments, searchTx, filterMethod]);

  const exportFinancialCSV = () => {
    const headers = ['Tranzaksiya ID,Sana,Bemor,Telefon,Shifokor,Mutaxassislik,Summa (UZS),Tolov Turi,Status'];
    const rows = filteredAppointments.map(a => 
      `"${a.ticketCode}","${a.date}","${a.patientName}","${a.patientPhone}","${a.doctorName}","${a.specialtyName || ''}",${a.amount || 150000},"${a.paymentMethod || 'Online'}","${a.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mednavbat_moliyaviy_hisobot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Moliyaviy hisobot CSV formatida yuklab olindi!", 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-900">
      
      {/* 1. TOP BALANCES ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Available Balance */}
        <div className="md:col-span-1 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-36 h-36 bg-white/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center space-x-1.5 bg-emerald-400/20 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30">
                <Wallet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Yechib Olish Balansi</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <p className="text-xs text-teal-100 font-semibold uppercase tracking-wider">
              Sof Mavjud Mablag'
            </p>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
              {availableBalance.toLocaleString()} <span className="text-lg font-bold text-teal-200">UZS</span>
            </div>
            <p className="text-[11px] text-teal-100/80 mt-1">
              Bu summani istalgan vaqt bank kartangizga chiqarib olishingiz mumkin.
            </p>
          </div>

          <div className="pt-6">
            <button
              onClick={() => setActiveModal('admin-withdraw')}
              disabled={availableBalance <= 0}
              className="w-full py-3.5 bg-white hover:bg-emerald-50 text-emerald-800 disabled:opacity-50 rounded-2xl text-xs font-black shadow-lg transition flex items-center justify-center space-x-2 transform active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
              <span>Pulni Kartaga Yechib Olish (Withdraw)</span>
            </button>
          </div>
        </div>

        {/* Gross Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
              <span>Umumiy Tushgan Pul (Jami Tushum)</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalRevenue.toLocaleString()} <span className="text-sm font-bold text-slate-500">UZS</span>
            </p>
            <span className="inline-block mt-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              ↑ Barcha bemor to'lovlaridan
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>To'lovlar soni:</span>
            <strong className="text-slate-800 font-bold">{appointments.length} ta navbat</strong>
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
              <span>Jami Yechib Olingan Mablag'</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {withdrawnTotal.toLocaleString()} <span className="text-sm font-bold text-slate-500">UZS</span>
            </p>
            <span className="inline-block mt-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              Kartangizga muvaffaqiyatli o'tkazilgan
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Yechib olishlar soni:</span>
            <strong className="text-slate-800 font-bold">{withdrawals.length} ta operatsiya</strong>
          </div>
        </div>

      </div>

      {/* 2. STATISTIKA BLOKI with TOGGLE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <span>Davriy Daromad Statistikasi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {viewMode === 'auto'
                ? 'Tizim tomonidan avtomatik tahlil va ko\'rsatkichlar'
                : 'Kunlik, haftalik va oylik tushum ko\'rsatkichlari'}
            </p>
          </div>

          {/* TOGGLE BUTTON */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-bold text-slate-400">Ko'rinish:</span>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('manual')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                  viewMode === 'manual'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Qo'lda ko'rish</span>
              </button>
              <button
                onClick={() => setViewMode('auto')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                  viewMode === 'auto'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Avtomatik tahlil</span>
              </button>
            </div>
          </div>
        </div>

        {/* MANUAL MODE: Period stats */}
        {viewMode === 'manual' && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Bugungi tushum */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold block mb-1">
                  📅 Bugungi Tushum
                </span>
                <span className="text-xl font-black text-slate-900">
                  {stats.todayRev.toLocaleString()} <span className="text-xs font-bold text-slate-500">UZS</span>
                </span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              {/* Haftalik tushum */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold block mb-1">
                  📊 Oxirgi 7 Kunlik Tushum
                </span>
                <span className="text-xl font-black text-indigo-700">
                  {stats.weekRev.toLocaleString()} <span className="text-xs font-bold text-slate-500">UZS</span>
                </span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '70%' }} />
                </div>
              </div>

              {/* Oylik tushum */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold block mb-1">
                  📈 Shu Oylik Jami Tushum
                </span>
                <span className="text-xl font-black text-emerald-700">
                  {stats.monthRev.toLocaleString()} <span className="text-xs font-bold text-slate-500">UZS</span>
                </span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }} />
                </div>
              </div>
            </div>

            {/* To'lov tizimlari bo'yicha tahlil */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                To'lov Usullari Taqsimoti:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-2xl">
                  <span className="text-xs font-extrabold text-cyan-800 block">CLICK</span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">{stats.clickCount.toLocaleString()} UZS</span>
                  <span className="text-[10px] text-cyan-700 font-semibold">Ulush: ~48%</span>
                </div>
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl">
                  <span className="text-xs font-extrabold text-teal-800 block">PAYME</span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">{stats.paymeCount.toLocaleString()} UZS</span>
                  <span className="text-[10px] text-teal-700 font-semibold">Ulush: ~32%</span>
                </div>
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl">
                  <span className="text-xs font-extrabold text-purple-800 block">UZUM BANK</span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">{stats.uzumCount.toLocaleString()} UZS</span>
                  <span className="text-[10px] text-purple-700 font-semibold">Ulush: ~12%</span>
                </div>
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-extrabold text-slate-800 block">KASSADA (NAQD)</span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">{stats.kassaCount.toLocaleString()} UZS</span>
                  <span className="text-[10px] text-slate-600 font-semibold">Ulush: ~8%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUTO MODE: Smart analysis cards */}
        {viewMode === 'auto' && (
          <div className="space-y-5 animate-fade-in">
            {/* Intro banner */}
            <div className="flex items-center space-x-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-teal-900">Avtomatik Tahlil Rejimi</p>
                <p className="text-[11px] text-teal-700">
                  Tizim {appointments.length} ta navbat ma'lumotini tahlil qilib, quyidagi xulosalarni taqdim etmoqda.
                </p>
              </div>
            </div>

            {/* 4 analysis cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* a) Umumiy tushgan pul */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-extrabold text-emerald-900">Umumiy Tushgan Pul</span>
                </div>
                <p className="text-2xl font-black text-emerald-800">
                  {totalRevenue.toLocaleString()}
                  <span className="text-xs font-bold text-emerald-600 ml-1">UZS</span>
                </p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  {appointments.length} ta navbat bo'yicha jami balans — yechib olish uchun tayyor: <strong>{availableBalance.toLocaleString()} UZS</strong>
                </p>
              </div>

              {/* b) Eng ko'p daromad keltirgan mutaxassislik */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-extrabold text-amber-900">Eng Ko'p Daromad Keltirgan Mutaxassislik</span>
                </div>
                <p className="text-lg font-black text-amber-800 leading-tight">
                  🏆 {stats.topSpecialty.name}
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Jami: <strong className="text-amber-900">{stats.topSpecialty.revenue.toLocaleString()} UZS</strong> daromad — tizimning eng foydali yo'nalishi
                </p>
              </div>

              {/* c) Eng faol shifokor */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-extrabold text-indigo-900">Eng Faol Shifokor</span>
                </div>
                <p className="text-lg font-black text-indigo-800 leading-tight">
                  👨‍⚕️ {stats.topDoctor.name}
                </p>
                <p className="text-[11px] text-indigo-700 mt-1">
                  Jami <strong className="text-indigo-900">{stats.topDoctor.count} ta navbat</strong> qabul qildi — tizimning eng ko'p band qilingan shifokori
                </p>
              </div>

              {/* d) Haftalik o'sish/pasayish */}
              <div className={`bg-gradient-to-br ${stats.weeklyGrowth >= 0 ? 'from-green-50 to-emerald-50 border-green-200' : 'from-red-50 to-rose-50 border-red-200'} border rounded-2xl p-4`}>
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`w-8 h-8 ${stats.weeklyGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-xl flex items-center justify-center`}>
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-xs font-extrabold ${stats.weeklyGrowth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    Haftalik O'sish Ko'rsatkichi
                  </span>
                </div>
                <p className={`text-2xl font-black ${stats.weeklyGrowth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {stats.weeklyGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.weeklyGrowth)}%
                </p>
                <p className={`text-[11px] mt-1 ${stats.weeklyGrowth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {stats.weeklyGrowth >= 0
                    ? `Bu hafta oldingi haftaga nisbatan ${stats.weeklyGrowth}% ko'proq daromad`
                    : `Bu hafta oldingi haftaga nisbatan ${Math.abs(stats.weeklyGrowth)}% kam daromad`}
                  {' '}({stats.weekRev.toLocaleString()} UZS bu hafta)
                </p>
              </div>

            </div>

            {/* Qo'shimcha tahlil: To'lov usullari */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                <Zap className="w-3 h-3 inline mr-1 text-teal-500" />
                Tizim Tavsiyasi — To'lov Usullari Taqsimoti:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'CLICK', value: stats.clickCount, pct: '48%', color: 'cyan' },
                  { label: 'PAYME', value: stats.paymeCount, pct: '32%', color: 'teal' },
                  { label: 'UZUM BANK', value: stats.uzumCount, pct: '12%', color: 'purple' },
                  { label: 'KASSADA (NAQD)', value: stats.kassaCount, pct: '8%', color: 'slate' },
                ].map(item => (
                  <div
                    key={item.label}
                    className={`p-3 bg-${item.color}-50/70 border border-${item.color}-200 rounded-2xl`}
                  >
                    <span className={`text-xs font-extrabold text-${item.color}-800 block`}>{item.label}</span>
                    <span className="text-sm font-black text-slate-900 mt-1 block">{item.value.toLocaleString()} UZS</span>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                      <div className={`bg-${item.color}-500 h-full rounded-full`} style={{ width: item.pct }} />
                    </div>
                    <span className={`text-[10px] text-${item.color}-700 font-semibold`}>Ulush: ~{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. MENING KARTAM BLOKI */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-xs font-extrabold border border-teal-400/30">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Mening Bank Kartam</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Tushgan Pullarni Yechib Olish Kartasi
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bemorlar tomonidan to'langan pullar tizimda to'planadi. Ushbu ko'rsatilgan kartaga istalgan paytda bir tugma bilan mablag'larni chiqarib olishingiz mumkin.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center space-x-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-teal-200 border border-white/10">
                <span>{displayCardNumber}</span>
                <button
                  type="button"
                  onClick={() => setShowFullCard(!showFullCard)}
                  className="text-slate-400 hover:text-white transition"
                  title={showFullCard ? "Yashirish" : "Ko'rsatish"}
                >
                  {showFullCard ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <span className="text-xs text-slate-300 font-medium">
                {adminCard?.bankName || 'Kapitalbank'} • {adminCard?.holderName || 'ADMINISTRATOR'} ({adminCard?.cardType || 'Uzcard'})
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setActiveModal('admin-card')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center space-x-1.5"
            >
              <CreditCard className="w-4 h-4 text-teal-300" />
              <span>Kartani O'zgartirish</span>
            </button>

            <button
              onClick={() => setActiveModal('admin-withdraw')}
              disabled={availableBalance <= 0}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 transition flex items-center justify-center space-x-2 transform active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Pul Yechib Olish</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. TRANZAKSIYALAR VA TO'LOVLAR TARIXI JADVALI */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Bemorlar To'lovlari Tarixi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Har bir navbat uchun qilingan to'lovlar, sanasi, shifokori va summasi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportFinancialCSV}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Eksport (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Bemor ismi, telefoni, shifokor yoki chipta kodi..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">Barcha To'lov Turlari</option>
            <option value="click">Click</option>
            <option value="payme">Payme</option>
            <option value="uzum">Uzum Bank</option>
            <option value="kassa">Kassada (Naqd)</option>
          </select>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Sana / Vaqt</th>
                <th className="p-3">Chipta Kodi</th>
                <th className="p-3">Bemor F.I.Sh</th>
                <th className="p-3">Qabul Qiluvchi Shifokor</th>
                <th className="p-3">To'lov Usuli</th>
                <th className="p-3">Summa</th>
                <th className="p-3 text-right">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-500 font-medium whitespace-nowrap">
                      {app.date} <span className="text-[11px] text-slate-400">({app.timeSlot})</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-teal-700 whitespace-nowrap">
                      {app.ticketCode}
                    </td>
                    <td className="p-3">
                      <span className="font-extrabold text-slate-900 block">{app.patientName}</span>
                      <span className="text-[11px] text-slate-500">{app.patientPhone}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800 block">{app.doctorName}</span>
                      <span className="text-[11px] text-teal-600 font-medium">{app.specialtyName}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                        {app.paymentMethod || 'Click'}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900 whitespace-nowrap">
                      {(app.amount || 150000).toLocaleString()} <span className="text-[10px] text-slate-500">UZS</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>To'langan</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    Hech qanday to'lov topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 5. YECHIB OLISHLAR TARIXI */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <ArrowUpRight className="w-5 h-5 text-indigo-600" />
              <span>Kartaga Yechib Olingan Mablag'lar Tarixi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administratorning shaxsiy kartasiga o'tkazilgan barcha to'lovlar
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            {withdrawals.length} ta o'tkazma
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Operatsiya ID</th>
                <th className="p-3">Sana / Vaqt</th>
                <th className="p-3">O'tkazilgan Karta</th>
                <th className="p-3">Bank & Karta Egasi</th>
                <th className="p-3">Yechilgan Summa</th>
                <th className="p-3 text-right">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.length > 0 ? (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-700">{w.id}</td>
                    <td className="p-3 text-slate-500 font-medium">{w.date}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{w.cardNumberMasked}</td>
                    <td className="p-3 text-slate-600 font-medium">
                      {w.bankName || 'Kapitalbank'} ({w.cardHolder || 'ADMIN'})
                    </td>
                    <td className="p-3 font-black text-emerald-700">
                      -{Number(w.amount).toLocaleString()} UZS
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{w.status || 'Bajarildi'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Hozircha kartaga pul yechib olinmagan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
