/**
 * MobileAppInstallModal — Mobil Ilova O'rnatish Modali
 * ─────────────────────────────────────────────────────
 * Mantiq:
 *  1. Havola (GOOGLE_PLAY_URL / APP_STORE_URL) to'ldirilgan bo'lsa → do'kon ochiladi.
 *  2. Havola bo'sh bo'lsa (hozirgi holat):
 *     - Foydalanuvchi qurilmasi (Android yoki iPhone) avtomatik aniqlanadi va ko'rsatiladi.
 *     - Android uchun: "beforeinstallprompt" orqali tizimning "Ilovani o'rnatish" tugmasi ishlaydi.
 *     - iPhone uchun: "Safari -> Ulashish tugmasi -> Bosh ekranga qo'shish" ko'rsatmasi va tasviriy rasm chiqadi.
 *     - Sayt allaqachon o'rnatilgan bo'lsa: "Ilova allaqachon o'rnatilgan" holati chiqadi.
 *     - 3 ta tilni (uz, ru, en) to'liq qo'llab-quvvatlaydi.
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  PlusSquare,
  Monitor,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MobileAppInstallModal = ({
  isOpen,
  onClose,
  targetPlatform = 'auto', // 'android' | 'ios' | 'desktop' | 'auto'
  pwaInstall,              // usePWAInstall() hooki natijasi
}) => {
  const { t, language } = useApp();
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  const deviceType = pwaInstall?.deviceType || 'desktop';
  const isInstalled = pwaInstall?.isInstalled || false;
  const isInstallable = pwaInstall?.isInstallable || false;
  const triggerInstallPrompt = pwaInstall?.triggerInstallPrompt;

  // Foydalanuvchi qurilmasiga mos tabni boshlang'ich tanlash
  const [activeTab, setActiveTab] = useState('android');

  useEffect(() => {
    if (!isOpen) return;

    if (targetPlatform === 'ios') {
      setActiveTab('ios');
    } else if (targetPlatform === 'android') {
      setActiveTab('android');
    } else {
      // 'auto' bo'lganda qurilma turini aniqlash
      if (deviceType === 'ios') {
        setActiveTab('ios');
      } else if (deviceType === 'android') {
        setActiveTab('android');
      } else {
        setActiveTab('android'); // desktopda ham Android / Chrome PWA asosiy
      }
    }
  }, [isOpen, targetPlatform, deviceType]);

  // Esc klavishi orqali yopish
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAndroidInstall = async () => {
    if (!triggerInstallPrompt) return;
    setInstalling(true);
    const accepted = await triggerInstallPrompt();
    setInstalling(false);
    if (accepted) {
      setInstalled(true);
      setTimeout(() => {
        onClose();
        setInstalled(false);
      }, 2000);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Matnlar tillar bo'yicha moslashuvchan
  const isUz = language === 'uz' || language === 'uz-Cyrl';
  const isRu = language === 'ru';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white p-5 sm:p-6 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95"
            aria-label={t('pwa.close', 'Yopish')}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                  PWA Mobile
                </span>
                {deviceType !== 'desktop' && (
                  <span className="text-[10px] text-teal-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {deviceType === 'ios' ? 'iPhone' : 'Android'}
                  </span>
                )}
              </div>
              <h2 id="pwa-modal-title" className="text-lg font-black tracking-tight text-white mt-0.5">
                {t('pwa.modal_title', "Mobil Ilovani O'rnating")}
              </h2>
            </div>
          </div>

          {/* Platform Tab Switcher */}
          <div className="mt-4 grid grid-cols-2 bg-black/20 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'android'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🤖 Android</span>
              {deviceType === 'android' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'ios'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span> iPhone (iOS)</span>
              {deviceType === 'ios' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">

          {/* ALLAQACHON O'RNATILGAN HOLAT */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {t('pwa.already_installed', "MedNavbat allaqachon qurilmangizda o'rnatilgan")}
                </p>
                <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                  {isUz
                    ? "Siz hozirda ilovadan to'liq mustaqil rejimda foydalanmoqdasiz."
                    : isRu
                    ? "Вы уже используете приложение в автономном режиме."
                    : "You are currently running the app in standalone mode."}
                </p>
              </div>
            </div>
          )}

          {/* ───────────────── ANDROID TAB ───────────────── */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t('pwa.android_title', "Android Telefonga O'rnatish")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('pwa.android_desc', "MedNavbat ilovasini bir tugma bilan telefoningizga o'rnating:")}
                </p>
              </div>

              {installed ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-center space-y-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {t('pwa.android_success', "Muvaffaqiyatli o'rnatildi!")}
                  </p>
                </div>
              ) : isInstallable ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleAndroidInstall}
                    disabled={installing}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2.5 transition active:scale-98 disabled:opacity-70"
                  >
                    <Download className={`w-5 h-5 ${installing ? 'animate-bounce' : ''}`} />
                    <span>
                      {installing
                        ? t('pwa.android_installing', "O'rnatilmoqda...")
                        : t('pwa.android_install_btn', "Ilovani O'rnatish")}
                    </span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    {isUz
                      ? "Google Play siz, to'g'ridan-to'g'ri tezkor o'rnatiladi (2 MB)"
                      : isRu
                      ? "Быстрая установка напрямую без Google Play (2 МБ)"
                      : "Fast direct installation without Google Play (2 MB)"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <span>📌</span>
                      <span>
                        {isUz
                          ? "Qo'lda o'rnatish (Google Chrome / Brave / Samsung Internet):"
                          : isRu
                          ? "Ручная установка (Google Chrome / Samsung Internet):"
                          : "Manual Install (Chrome / Samsung Internet):"}
                      </span>
                    </p>
                    <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 pl-1">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-teal-600 dark:text-teal-400">1.</span>
                        <span>
                          {isUz
                            ? "Brauzerning o'ng yuqori qismidagi ⋮ (uch nuqta) menyuni bosing."
                            : isRu
                            ? "Нажмите меню ⋮ (три точки) в правом верхнем углу браузера."
                            : "Tap the ⋮ menu at the top right of your browser."}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-teal-600 dark:text-teal-400">2.</span>
                        <span>
                          {isUz
                            ? "'Ilovani o'rnatish' yoki 'Bosh ekranga qo'shish' ni tanlang."
                            : isRu
                            ? "Выберите «Установить приложение» или «Добавить на главный экран»."
                            : "Select 'Install app' or 'Add to Home screen'."}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-teal-600 dark:text-teal-400">3.</span>
                        <span>
                          {isUz
                            ? "Tasdiqlang — MedNavbat ilovasi asosiy ekranga tushadi."
                            : isRu
                            ? "Подтвердите — MedNavbat появится на рабочем столе."
                            : "Confirm — MedNavbat will appear on your home screen."}
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────── IPHONE (iOS) TAB ───────────────── */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t('pwa.ios_title', "iPhone ga O'rnatish")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isUz
                    ? "Safari brauzeri orqali App Store'siz o'rnatish ko'rsatmasi:"
                    : isRu
                    ? "Инструкция по установке через Safari без App Store:"
                    : "Safari installation guide without App Store:"}
                </p>
              </div>

              {/* 4 Bosqichli qisqa ko'rsatma */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 pt-0.5">
                    {t('pwa.ios_step1', "Safari brauzerida bu sahifani oching")}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 pt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                    <span>{t('pwa.ios_step2', "Pastdagi 'Ulashish' tugmasini bosing")}</span>
                    <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-700 text-[11px]">
                      <Share2 className="w-3 h-3" />
                      <span>{isUz ? "Ulashish" : isRu ? "Поделиться" : "Share"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 pt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                    <span>{t('pwa.ios_step3', "'Bosh ekranga qo‘shish' ni tanlang")}</span>
                    <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-700 text-[11px]">
                      <PlusSquare className="w-3 h-3" />
                      <span>{isUz ? "Bosh ekranga qo'shish" : isRu ? "На экран «Домой»" : "Add to Home Screen"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                    4
                  </div>
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 pt-0.5 font-bold">
                    {t('pwa.ios_step4', "'Qo‘shish' tugmasini bosing — tayyor!")}
                  </div>
                </div>
              </div>

              {/* ── ILUSTRARETSIYA / RASM (Safari Share Action Sheet) ── */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-white shadow-inner">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
                  <span>📱 {isUz ? "Vizual Ko'rinish" : isRu ? "Наглядный вид" : "Visual Guide"}</span>
                  <span className="text-teal-400">iOS Safari</span>
                </div>

                {/* SVG Mockup: iPhone Safari pastki paneli va menyusi */}
                <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 space-y-2.5">
                  {/* Safari Share Sheet Popover */}
                  <div className="bg-slate-700/80 rounded-lg p-2.5 border border-slate-600/80 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{isUz ? "Bosh ekranga qo'shish" : isRu ? "На экран «Домой»" : "Add to Home Screen"}</span>
                          <span className="px-1.5 py-0.2 bg-teal-500 text-slate-950 text-[9px] font-black rounded">
                            {isUz ? "BOSING" : isRu ? "НАЖАТЬ" : "TAP"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">MedNavbat • mednavbat.uz</div>
                      </div>
                    </div>
                    <span className="text-teal-400 font-bold text-xs">➕</span>
                  </div>

                  {/* Safari Bottom Navigation Bar */}
                  <div className="pt-1.5 border-t border-slate-700 flex items-center justify-between px-2 text-slate-400">
                    <span className="text-xs font-bold opacity-40">‹</span>
                    <span className="text-xs font-bold opacity-40">›</span>

                    {/* Highlighted Share Icon with Arrow */}
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300 animate-pulse">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-teal-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                        ⬆️ 1-bosqich
                      </div>
                    </div>

                    <span className="text-xs opacity-40">📖</span>
                    <span className="text-xs opacity-40">⧉</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop qo'shimcha ma'lumot */}
          {deviceType === 'desktop' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {isUz
                    ? "Kompyuter brauzerida manzil qatoridagi ⊕ belgisidan ham o'rnatishingiz mumkin"
                    : isRu
                    ? "На компьютере можно установить через значок ⊕ в адресной строке"
                    : "On desktop, you can also install via the ⊕ icon in address bar"}
                </span>
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {t('pwa.close', 'Yopish')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAppInstallModal;
