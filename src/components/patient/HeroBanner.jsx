import React from 'react';
import { useApp } from '../../context/AppContext';
import { BannerCard } from '../registration/BannerCard';
import tabib24Hero from '../../assets/tabib24-hero.svg';
import { 
  Clock, 
  ShieldCheck, 
  Search, 
  Sparkles, 
  PhoneCall, 
  Building2,
  Users
} from 'lucide-react';

export const HeroBanner = () => {
  const { 
    t, 
    searchQuery, 
    setSearchQuery, 
    selectedSpecialty, 
    setSelectedSpecialty, 
    specialties, 
    getLocalized,
    openFastRegistration 
  } = useApp();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-teal-50/80 via-emerald-50/40 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 pt-8 pb-12 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      
      {/* Background Glow Orbs — overflow:hidden parent ichida, position:absolute,
          lekin right-10 + w-96 mobilda viewport'dan chiqmasligi uchun
          max-w-full va clamp bilan chekladik */}
      <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" style={{zIndex: -1, transform: 'translateX(30%)'}} />
      <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" style={{zIndex: -1, transform: 'translateX(-30%)'}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center space-x-2 bg-teal-100/80 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t('hero.badge')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {t('hero.title_part1')} <br />
              <span className="gradient-text">{t('hero.title_highlight')}</span> {t('hero.title_part2')}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-normal">
              {t('hero.subtitle')}
            </p>

            {/* Quick Interactive Search Box */}
            <div className="bg-white dark:bg-slate-800/95 p-3 sm:p-4 rounded-3xl shadow-xl shadow-teal-900/5 dark:shadow-black/40 border border-slate-200 dark:border-slate-700 max-w-xl transition-all">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <input
                    type="text"
                    placeholder={t('hero.search_doctor_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                  />
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('doctors-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-teal-600/30 transition flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('doctors.search_results')}</span>
                </button>
              </div>

              {/* Sub-pills */}
              <div className="mt-3 flex items-center flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mr-1">{t('specialties.all')}:</span>
                {specialties.slice(0, 5).map((spec) => {
                  const specName = getLocalized(spec, 'name');
                  return (
                    <button
                      key={spec.id}
                      onClick={() => {
                        setSelectedSpecialty(spec.id);
                        const el = document.getElementById('doctors-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                        selectedSpecialty === spec.id
                          ? 'bg-teal-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-600 hover:text-teal-700 dark:hover:text-white'
                      }`}
                    >
                      {specName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 Step Process Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center flex-shrink-0">1</div>
                <span className="font-semibold">{t('booking.step1')}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center flex-shrink-0">2</div>
                <span className="font-semibold">{t('booking.step2')}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center flex-shrink-0">3</div>
                <span className="font-semibold">{t('booking.step4')}</span>
              </div>
            </div>

          </div>

          {/* Right Hero Stats & Emergency Card */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Tabib24 Hero SVG Illustration — main visual for desktop */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/50 shadow-2xl bg-[#0B1220] hidden lg:flex items-center justify-center">
              <img
                src={tabib24Hero}
                alt="Tabib24 — Dunyo shifokorlari, hoziroq yoningizda"
                className="w-full h-auto object-contain"
                style={{ maxHeight: '270px' }}
                loading="eager"
              />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0B1220]/60 to-transparent pointer-events-none" />
            </div>

            {/* Live Queue Banner Card */}
            <div className="bg-white dark:bg-slate-800/95 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-950/40 rounded-full -mr-10 -mt-10 -z-0" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">MEDNAVBAT MED SYSTEM</span>
                  </div>
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">2026</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                    <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('specialties.title')}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{specialties.length}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{t('specialties.all')}</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                    <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('hero.stat_doctors_label')}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('hero.stat_doctors_count')}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">MedNavbat</p>
                  </div>
                </div>

                {/* Tezkor 1-Daqiqalik Registratsiya Banneri (Skrinshot talabiga to'liq mos) */}
                <BannerCard onClick={openFastRegistration} />
              </div>
            </div>

            {/* Quick Clinic Emergency Box - Interactive 103 Caller */}
            <a 
              href="tel:103" 
              className="bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-3xl shadow-lg flex items-center justify-between transition-all transform active:scale-95 cursor-pointer border border-slate-800 hover:border-rose-500/40"
              title="103 Tez Tibbiy Yordamga qo'ng'iroq qilish"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md">
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-medium">{t('footer.emergency_title')}</p>
                  <p className="text-base font-bold text-white group-hover:text-rose-400">{t('nav.emergency_call')}</p>
                </div>
              </div>
              <span className="bg-rose-500/20 text-rose-300 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-500/30">
                24/7
              </span>
            </a>

          </div>

        </div>
      </div>
    </div>
  );
};
