import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { HeaderSearch } from './HeaderSearch';
import { NotificationCenter } from './NotificationCenter';
import {
  HeartPulse,
  User,
  Stethoscope,
  ShieldCheck,
  Smartphone,
  Monitor,
  PhoneCall,
  PlusCircle,
  ChevronDown,
  LogIn,
  LogOut,
  Sun,
  Moon,
  MapPin,
  Clock,
  Menu,
  X,
  MoreHorizontal,
  QrCode,
  Search,
  Globe,
  ChevronRight,
  Bell,
  LayoutDashboard
} from 'lucide-react';
import { findLanguageByCode } from '../data/languagesConfig';
import { SITE_CONFIG } from '../config/siteConfig';
import { DoctorNavBell } from './doctor/DoctorNotificationPanel';
import { getDoctorUnreadCount } from '../services/doctorNotificationService';

export const Navbar = () => {
  const {
    t,
    currentRole,
    setCurrentRole,
    isAuthenticated,
    isAdminAuthenticated,
    logoutUser,
    isMobileSimulated,
    setIsMobileSimulated,
    setActiveModal,
    language,
    setLanguage,
    openLanguageModal,
    theme,
    toggleTheme,
    selectedCountry,
    selectedRegion,
    openLocationModal,
    openFastRegistration,
    doctors,
    userProfile
  } = useApp();

  // Rolga mos havolalar ko'rinishi:
  // - Tizimga kirmagan: Bemor, Shifokor va Admin havolalari barchasi ko'rinadi
  // - Bemor (patient) kirgan: Faqat "Bemor paneli" ko'rinadi
  // - Shifokor kirgan: Faqat "Shifokor paneli" ko'rinadi
  // - Admin kirgan: Faqat "Admin paneli" ko'rinadi
  const showPatientPanelLink = !isAuthenticated || (isAuthenticated && currentRole === 'patient');
  const showDoctorPanelLink = !isAuthenticated || (isAuthenticated && currentRole === 'doctor');
  const showAdminPanelLink = !isAuthenticated || (isAuthenticated && currentRole === 'admin');

  const navigateTo = (route) => {
    if (route === '/') {
      window.history.pushState(null, '', window.location.pathname === '/' ? '/' : window.location.origin);
      window.location.hash = '';
    } else {
      window.location.hash = route.replace('/', '#');
    }
    window.dispatchEvent(new Event('popstate'));
  };

  const [docUnread, setDocUnread] = useState(0);

  const activeDocId = (currentRole === 'doctor' && userProfile?.id)
    ? userProfile.id
    : (doctors?.[0]?.id || 'doc-tash-1');

  useEffect(() => {
    if (currentRole !== 'doctor') return;
    const upd = () => setDocUnread(getDoctorUnreadCount(activeDocId));
    upd();
    window.addEventListener('mednavbat_doctor_notifs_changed', upd);
    window.addEventListener('storage', upd);
    const interval = setInterval(upd, 10000);
    return () => {
      window.removeEventListener('mednavbat_doctor_notifs_changed', upd);
      window.removeEventListener('storage', upd);
      clearInterval(interval);
    };
  }, [currentRole, activeDocId]);


  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreRef = useRef(null);
  const moreBtnRef = useRef(null);
  const langRef = useRef(null);
  const langBtnRef = useRef(null);

  // Close dropdowns on click outside or Escape key
  useEffect(() => {
    if (!isMoreOpen && !isLangOpen) return;

    const handleClickOutside = (e) => {
      if (
        isMoreOpen &&
        moreRef.current &&
        !moreRef.current.contains(e.target) &&
        moreBtnRef.current &&
        !moreBtnRef.current.contains(e.target)
      ) {
        setIsMoreOpen(false);
      }

      if (
        isLangOpen &&
        langRef.current &&
        !langRef.current.contains(e.target) &&
        langBtnRef.current &&
        !langBtnRef.current.contains(e.target)
      ) {
        setIsLangOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
        setIsLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen, isLangOpen]);

  const quickLanguages = [
    { code: 'uz-Latn', name: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru',      name: 'Русский',   flag: '🇷🇺' },
    { code: 'en',      name: 'English',   flag: '🇬🇧' }
  ];
  const currentLangObj = quickLanguages.find(l => l.code === language || language.startsWith(l.code.split('-')[0])) || quickLanguages[0];

  const locationLabel = selectedRegion
    ? (selectedRegion.shortName || selectedRegion.name_uz || selectedRegion.name)
    : t('nav.allUzbekistan', "O'zbekiston (Barcha)");

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-300">
      <div className="w-full px-3 sm:px-4 lg:px-6">

        {/* ── MAIN ROW ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 min-w-0">

          {/* ── LEFT: Logo + Role Switcher ──────────────────────────────────── */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">

            {/* Logo */}
            <div
              className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md shadow-teal-500/20 flex-shrink-0">
                <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  Med<span className="gradient-text">Navbat</span>
                </span>
                <span className="hidden lg:inline bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                  {t('nav.online')}
                </span>
              </div>
            </div>

            {/* Rol ko'rsatkichi — faqat tasdiqlangan shifokor yoki admin uchun xizmat qiladi */}
            {currentRole === 'doctor' && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold flex-shrink-0">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden md:inline">{t('nav.doctorCabinet')}</span>
              </div>
            )}

            {currentRole === 'admin' && isAdminAuthenticated && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">{t('nav.adminCabinet')}</span>
              </div>
            )}
          </div>

          {/* ── CENTER: Search (only xl+) ───────────────────────────────────── */}
          <div className="hidden xl:flex items-center flex-1 max-w-xs mx-3 min-w-0">
            <HeaderSearch />
          </div>

          {/* ── NAVBAR PANEL LINKS (Qidiruv satri va Login orasida) ─────────────── */}
          {(showDoctorPanelLink || showAdminPanelLink || showPatientPanelLink) && (
            <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 mx-1">
              {showPatientPanelLink && (
                <button
                  onClick={() => navigateTo('/patient')}
                  title={t('nav.patientPanelTitle')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition active:scale-95 shadow-xs whitespace-nowrap"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden lg:inline">{t('nav.patientPanel')}</span>
                  <span className="lg:hidden">{t('nav.patientPanelShort')}</span>
                </button>
              )}

              {showDoctorPanelLink && (
                <button
                  onClick={() => navigateTo('/doctor')}
                  title={t('nav.doctorPanelTitle')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold transition active:scale-95 shadow-xs whitespace-nowrap"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="hidden lg:inline">{t('nav.doctorPanel')}</span>
                  <span className="lg:hidden">{t('nav.doctorPanelShort')}</span>
                </button>
              )}

              {showAdminPanelLink && (
                <button
                  onClick={() => navigateTo('/admin')}
                  title={t('nav.adminPanelTitle')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition active:scale-95 shadow-xs whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="hidden lg:inline">{t('nav.adminPanel')}</span>
                  <span className="lg:hidden">{t('nav.adminPanelShort')}</span>
                </button>
              )}
            </div>
          )}

          {/* ── RIGHT: Controls + Login ─────────────────────────────────────── */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ml-auto">

            {/* Location */}
            <button
              onClick={openLocationModal}
              title={t('nav.locationTitle')}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold transition active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              <span>{selectedCountry?.flag || '🇺🇿'}</span>
              <span className="hidden lg:inline max-w-[72px] truncate">{locationLabel}</span>
            </button>

            {/* Language Dropdown */}
            <div className="relative hidden sm:block">
              <button
                ref={langBtnRef}
                onClick={() => setIsLangOpen(v => !v)}
                aria-expanded={isLangOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition whitespace-nowrap"
              >
                <span className="text-sm leading-none">{currentLangObj.flag}</span>
                <span className="uppercase hidden md:inline">{currentLangObj.code}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div
                  ref={langRef}
                  className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-950/40 p-1.5 z-[100] min-w-[12rem] animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  <div className="space-y-0.5">
                    {quickLanguages.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setIsLangOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition ${
                          language === l.code
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">{l.flag}</span>
                          <span>{l.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 uppercase">{l.code.split('-')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>


            {/* In-App Notifications Center */}
            {currentRole === 'doctor' ? (
              <DoctorNavBell
                doctorId={activeDocId}
                unreadCount={docUnread}
                onOpen={() => window.dispatchEvent(new CustomEvent('mednavbat_open_doctor_notif_drawer'))}
              />
            ) : (
              <NotificationCenter />
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? "Kunduzgi rejim" : "Tungi rejim"}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 transition active:scale-90 flex-shrink-0"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-slate-600" />
              }
            </button>

            {/* Emergency Call */}
            <a
              href="tel:103"
              title="Tez Yordam 103"
              className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 px-2 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden lg:inline">{t('nav.emergency_call')}</span>
              <span className="lg:hidden font-extrabold">103</span>
            </a>

            {/* ⋯ "More" Dropdown — sm+ da ko'rinadi */}
            <div className="relative hidden sm:block">
              <button
                ref={moreBtnRef}
                onClick={() => setIsMoreOpen(v => !v)}
                title={t('nav.more')}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition flex-shrink-0 ${
                  isMoreOpen
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMoreOpen && (
                <div
                  ref={moreRef}
                  className="absolute right-0 top-full mt-2 z-[100] min-w-[260px] sm:min-w-[280px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-slate-950/60 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  {/* Search inside More dropdown (especially prominent when navbar search is hidden) */}
                  <div className="px-1 pb-2 pt-0.5 border-b border-slate-100 dark:border-slate-700/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1.5 pb-1 flex items-center gap-1">
                      <Search className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span>{t('search.title', 'Qidiruv')}</span>
                    </div>
                    <HeaderSearch />
                  </div>

                  {/* Mobil App / Veb rejim */}
                  <button
                    onClick={() => { setIsMobileSimulated(!isMobileSimulated); setIsMoreOpen(false); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 transition group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                      isMobileSimulated
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60'
                    }`}>
                      {isMobileSimulated ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {isMobileSimulated ? t('nav.web_view') : t('nav.mobile_app')}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {isMobileSimulated ? t('nav.webViewDesc') : t('nav.mobileAppDesc')}
                      </div>
                    </div>
                  </button>

                  {/* Tezkor QR Chipta */}
                  <button
                    onClick={() => { openFastRegistration(); setIsMoreOpen(false); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-left rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        {t('nav.quickQr')}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 truncate">
                        {t('nav.quickQrDesc')}
                      </div>
                    </div>
                  </button>

                  {/* Hudud va davlat */}
                  <button
                    onClick={() => { openLocationModal(); setIsMoreOpen(false); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-left rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/50 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/60 transition">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {selectedCountry?.flag || '🇺🇿'} {locationLabel}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {t('nav.changeRegion')}
                      </div>
                    </div>
                  </button>

                  {/* Tez Yordam: 103 */}
                  <a
                    href="tel:103"
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-left rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/60 transition">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-rose-700 dark:text-rose-400">
                        {t('nav.emergency_call')}
                      </div>
                      <div className="text-[10px] text-rose-500 dark:text-rose-400/80 truncate">
                        {t('nav.emergencyDesc')}
                      </div>
                    </div>
                  </a>

                  {/* Call-Center: +998 (95) 141-10-07 */}
                  <a
                    href={SITE_CONFIG.contact.phone.telHref}
                    className="w-full flex items-center gap-3 px-2.5 py-2 text-left rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/50 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/60 transition">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-teal-700 dark:text-teal-400">
                        {t('nav.callCenter')}
                      </div>
                      <div className="text-[10px] text-teal-600 dark:text-teal-400/80 truncate font-semibold">
                        {SITE_CONFIG.contact.phone.display}
                      </div>
                    </div>
                  </a>

                  {/* Admin: Shifokor qo'shish (Faqat to'liq tasdiqlangan admin uchun) */}
                  {currentRole === 'admin' && isAdminAuthenticated && (
                    <button
                      onClick={() => { setActiveModal('add-doctor'); setIsMoreOpen(false); }}
                      className="w-full flex items-center gap-3 px-2.5 py-2 text-left rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition group border border-emerald-200 dark:border-emerald-800"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                          {t('nav.add_doctor')}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                          {t('nav.addDoctorDesc')}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── LOGIN — ALWAYS VISIBLE ──────────────────────────────────── */}
            {!isAuthenticated && (
              <button
                onClick={() => navigateTo('/login')}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition active:scale-95 whitespace-nowrap flex-shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{t('auth.login_title')}</span>
              </button>
            )}

            {/* Logout (authenticated) */}
            {isAuthenticated && (
              <button
                onClick={logoutUser}
                title={t('auth.logout')}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 text-slate-700 dark:text-slate-300 rounded-lg transition flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* ☰ Hamburger — mobile only (< sm) */}
            <button
              onClick={() => setIsMobileMenuOpen(v => !v)}
              aria-label="Menyu"
              className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex-shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>
        </div>

        {/* ── MOBILE MENU ───────────────────────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className="sm:hidden pb-3 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">

            {/* Search */}
            <HeaderSearch />

            {/* Mobil Panel Havolalari */}
            {(showDoctorPanelLink || showAdminPanelLink || showPatientPanelLink) && (
              <div className={`grid gap-2 pt-1 pb-1 ${
                (!isAuthenticated) ? 'grid-cols-3' : 'grid-cols-1'
              }`}>
                {showPatientPanelLink && (
                  <button
                    onClick={() => { navigateTo('/patient'); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold active:scale-95 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                    <span className="truncate">{t('nav.patientPanel')}</span>
                  </button>
                )}
                {showDoctorPanelLink && (
                  <button
                    onClick={() => { navigateTo('/doctor'); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold active:scale-95 transition"
                  >
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span className="truncate">{t('nav.doctorPanel')}</span>
                  </button>
                )}
                {showAdminPanelLink && (
                  <button
                    onClick={() => { navigateTo('/admin'); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold active:scale-95 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="truncate">{t('nav.adminPanel')}</span>
                  </button>
                )}
              </div>
            )}

            {/* Rol nishoni — faqat shifokor yoki admin uchun */}
            {currentRole === 'doctor' && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>{t('nav.doctorCabinet')}</span>
              </div>
            )}
            {currentRole === 'admin' && isAdminAuthenticated && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('nav.adminCabinet')}</span>
              </div>
            )}

            {/* Hudud + Til */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { openLocationModal(); setIsMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold transition truncate"
              >
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{selectedCountry?.flag || '🇺🇿'} {locationLabel}</span>
              </button>

                {quickLanguages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setIsMobileMenuOpen(false); }}
                    title={l.name}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition ${
                      language === l.code || language.startsWith(l.code)
                        ? 'bg-teal-100 dark:bg-teal-950/60 border-2 border-teal-500 dark:border-teal-400'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {l.flag}
                  </button>
                ))}
            </div>


            {/* Qo'shimcha amallar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setIsMobileSimulated(!isMobileSimulated); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  isMobileSimulated
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isMobileSimulated ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                <span>{isMobileSimulated ? t('nav.web_view') : t('nav.mobile_app')}</span>
              </button>

              <button
                onClick={() => { openFastRegistration(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition"
              >
                <Clock className="w-4 h-4" />
                <span>{t('nav.quickQrShort')}</span>
              </button>

              {currentRole === 'doctor' && (
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('mednavbat_open_doctor_notif_drawer'));
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition min-h-[44px]"
                >
                  <Bell className="w-4 h-4" />
                  <span>{t('nav.notifications')}</span>
                  {docUnread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {docUnread > 99 ? '99+' : docUnread}
                    </span>
                  )}
                </button>
              )}

              {currentRole === 'admin' && isAdminAuthenticated && (
                <button
                  onClick={() => { setActiveModal('add-doctor'); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('nav.add_doctor')}</span>
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 transition ml-auto"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

          </div>
        )}

      </div>
    </header>
  );
};
