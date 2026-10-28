import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeartPulse, PhoneCall, ShieldCheck, MapPin, Smartphone, Clock, CheckCircle2 } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { MobileAppInstallModal } from './MobileAppInstallModal';
import { PhoneLink } from './common/PhoneLink';

export const Footer = () => {
  const { t, showToast } = useApp();
  const pwaInstall = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState('auto');

  // App Store tugmasi bosilganda
  const handleAppStoreClick = () => {
    // 1. Havola qo'yilgan bo'lsa: yangi oynada ochish
    if (SITE_CONFIG.APP_STORE_URL && SITE_CONFIG.APP_STORE_URL.trim() !== '') {
      window.open(SITE_CONFIG.APP_STORE_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. Havola bo'sh va ilova allaqachon o'rnatilgan bo'lsa
    if (pwaInstall.isInstalled) {
      if (typeof showToast === 'function') {
        showToast(t('pwa.already_installed', "MedNavbat allaqachon qurilmangizda o'rnatilgan"), 'info');
      }
      setTargetPlatform('ios');
      setIsInstallModalOpen(true);
      return;
    }

    // 3. Havola bo'sh bo'lsa: chiroyli modal oynani ochish
    // Foydalanuvchi qurilmasi avtomatik aniqlanadi
    setTargetPlatform(pwaInstall.deviceType === 'ios' ? 'ios' : 'auto');
    setIsInstallModalOpen(true);
  };

  // Google Play tugmasi bosilganda
  const handleGooglePlayClick = () => {
    // 1. Havola qo'yilgan bo'lsa: yangi oynada ochish
    if (SITE_CONFIG.GOOGLE_PLAY_URL && SITE_CONFIG.GOOGLE_PLAY_URL.trim() !== '') {
      window.open(SITE_CONFIG.GOOGLE_PLAY_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. Havola bo'sh va ilova allaqachon o'rnatilgan bo'lsa
    if (pwaInstall.isInstalled) {
      if (typeof showToast === 'function') {
        showToast(t('pwa.already_installed', "MedNavbat allaqachon qurilmangizda o'rnatilgan"), 'info');
      }
      setTargetPlatform('android');
      setIsInstallModalOpen(true);
      return;
    }

    // 3. Havola bo'sh bo'lsa: chiroyli modal oynani ochish
    // Foydalanuvchi qurilmasi avtomatik aniqlanadi
    setTargetPlatform(pwaInstall.deviceType === 'android' ? 'android' : 'auto');
    setIsInstallModalOpen(true);
  };

  return (
    <>
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-24 md:pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center text-white">
                  <HeartPulse className="w-6 h-6 animate-pulse" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white">Med<span className="gradient-text">Navbat</span></span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('footer.description')}
              </p>
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>MedNavbat Verified Health Standard</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">{t('footer.quick_links')}</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#specialties-section" className="hover:text-teal-400 transition">{t('footer.link_specialties')}</a></li>
                <li><a href="#doctors-section" className="hover:text-teal-400 transition">{t('footer.link_doctors')}</a></li>
                <li><a href="#my-appointments-section" className="hover:text-teal-400 transition">{t('footer.link_appointments')}</a></li>
                <li><a href="#hospitals" className="hover:text-teal-400 transition">{t('footer.link_hospitals')}</a></li>
              </ul>
            </div>

            {/* Contacts & Emergency */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">{t('footer.emergency_title')}</h4>
              <div className="space-y-2 text-xs">
                <p className="flex items-center space-x-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{SITE_CONFIG.contact.address}</span>
                </p>
                <p className="flex items-center space-x-2 text-slate-300">
                  <PhoneCall className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span>Call-Center:{' '}
                    <PhoneLink
                      phone={SITE_CONFIG.contact.phone.display}
                      href={SITE_CONFIG.contact.phone.telHref}
                      className="text-teal-400 hover:text-teal-300 underline font-semibold"
                    />
                  </span>
                </p>
                {/* 103 Tez Yordam — aniq tel:103 havolasi, qizil rang saqlanadi */}
                <p className="flex items-center space-x-2 text-rose-400 font-bold">
                  <Clock className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>
                    24/7 Tez Yordam Call-markazi:{' '}
                    <PhoneLink
                      phone="103"
                      href="tel:103"
                      emergency
                      className="text-rose-300 hover:text-rose-200 font-extrabold underline"
                    />
                  </span>
                </p>
              </div>
            </div>

            {/* Mobile App Downloads Callout */}
            <div className="space-y-3 bg-slate-800/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>{t('nav.mobile_app')}</span>
                </span>
                {pwaInstall.isInstalled && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t('footer.app_already_installed', "O'rnatilgan")}</span>
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-400">iOS & Android App Store / Google Play</p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAppStoreClick}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center space-x-2 transition active:scale-98"
                >
                  <span> {t('footer.app_store_btn', 'App Store')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGooglePlayClick}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center space-x-2 transition active:scale-98"
                >
                  <span>▶ {t('footer.google_play_btn', 'Google Play')}</span>
                </button>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 MedNavbat. {t('footer.rights')}</p>
          </div>

        </div>
      </footer>

      {/* PWA / Mobil Ilova O'rnatish Modali */}
      <MobileAppInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        targetPlatform={targetPlatform}
        pwaInstall={pwaInstall}
      />
    </>
  );
};

export default Footer;
