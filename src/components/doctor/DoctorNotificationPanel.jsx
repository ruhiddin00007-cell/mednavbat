/**
 * DoctorNotificationPanel — Shifokor Bildirishnomalar Markazi
 * ─────────────────────────────────────────────────────────────────────────────
 * Joylashuv:
 *   1. Shifokor paneli ichida alohida "Xabarlar" tabi sifatida
 *   2. Header qo'ng'iroqcha (Bell) bosilganda:
 *      - Telefonda to'liq ekran modal/drawer
 *      - Kompyuterda o'ng tomondan chiquvchi yon panel (Drawer)
 * 
 * Imkoniyatlar:
 *   - Real-time yangilanish (storage + BroadcastChannel + CustomEvent)
 *   - Filtrlar: Hammasi / O'qilmagan / Navbatlar / Davomat / Admindan / Sozlamalar
 *   - O'qilgan/o'qilmagan holati, "Barchasini o'qish", bitta xabarni o'chirish
 *   - Navigatsiya: xabar bosilganda tegishli bo'limga o'tish (Navbatlar, Davomat, Jadval, va h.k.)
 *   - Tovush signali (Web Audio chime) sozlamasi
 *   - Brauzer Push (PWA) ruxsat so'rash va sinovdan o'tkazish
 *   - Telegram bot bilan bir martalik 6 xonali kod orqali ulanish
 *   - Tinch soatlar (Quiet Hours: 22:00-07:00) sozlamasi
 *   - 44px+ sensorli tugmalar (mobil qulaylik)
 */

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Bell, CheckCheck, Trash2, Calendar, CalendarX, CalendarClock,
  CheckCircle2, XCircle, MessageSquare, ShieldCheck, ShieldX,
  FileText, Image, ImageOff, Users, Clock, AlertCircle, Info,
  BellOff, RefreshCw, ChevronDown, Settings, Volume2, VolumeX,
  Send, Smartphone, Moon, Shield, ExternalLink, X, ArrowRight,
  Sparkles, Check, Copy
} from 'lucide-react';
import {
  getDoctorNotifications,
  getDoctorUnreadCount,
  markDoctorNotifRead,
  markAllDoctorNotifsRead,
  deleteDoctorNotif,
  DOCTOR_NOTIF_TYPES,
  DOCTOR_NOTIF_FILTERS,
  formatRelTime,
  getDoctorNotifSettings,
  saveDoctorNotifSettings,
  playNotificationChime,
  requestPushPermission,
  sendBrowserPushNotification,
  generateTelegramLinkCode,
  verifyTelegramLinkCode,
  unlinkTelegram,
  notifyNewAppointment,
  notifyAppointmentCancelled,
  notifyLeaveApproved,
  notifyAdminMessage,
  notifyScheduleChange,
  notifyDailyReminder
} from '../../services/doctorNotificationService';
import { useApp } from '../../context/AppContext';

// ── Ikonka mapper ─────────────────────────────────────────────────────────────
function NotifIcon({ type, size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const icons = {
    new_appointment:       <Calendar       className={s} />,
    appointment_cancel:    <CalendarX      className={s} />,
    appointment_change:    <CalendarClock  className={s} />,
    leave_approved:        <CheckCircle2   className={s} />,
    leave_rejected:        <XCircle        className={s} />,
    admin_message:         <MessageSquare  className={s} />,
    registration_approved: <ShieldCheck    className={s} />,
    registration_rejected: <ShieldX        className={s} />,
    registration_docs:     <FileText       className={s} />,
    photo_approved:        <Image          className={s} />,
    photo_rejected:        <ImageOff       className={s} />,
    patient_transfer:      <Users          className={s} />,
    schedule_change:       <Clock          className={s} />,
    daily_reminder:        <Bell           className={s} />,
    system:                <Info           className={s} />,
  };
  return icons[type] || <AlertCircle className={s} />;
}

// ── Color classes ──────────────────────────────────────────────────────────────
const COLOR_MAP = {
  teal:    { bg: 'bg-teal-100 dark:bg-teal-950/70',    text: 'text-teal-600 dark:text-teal-400',    border: 'border-l-teal-500' },
  rose:    { bg: 'bg-rose-100 dark:bg-rose-950/70',    text: 'text-rose-600 dark:text-rose-400',    border: 'border-l-rose-500' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-950/70', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500' },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-950/70',  text: 'text-amber-600 dark:text-amber-400',  border: 'border-l-amber-500' },
  indigo:  { bg: 'bg-indigo-100 dark:bg-indigo-950/70',text: 'text-indigo-600 dark:text-indigo-400',border: 'border-l-indigo-500' },
  slate:   { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-600 dark:text-slate-400',  border: 'border-l-slate-400' },
};

// ── Header Bell Komponenti (Panel & Navbar ichida ishlatish uchun) ────────────
export const DoctorNavBell = ({ doctorId, onOpen, unreadCount = 0 }) => {
  return (
    <button
      onClick={onOpen}
      title="Xabarlar markazi"
      aria-label="Xabarlar"
      className={`relative min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] rounded-2xl flex items-center justify-center border transition flex-shrink-0 cursor-pointer shadow-sm active:scale-95 ${
        unreadCount > 0
          ? 'border-teal-400 dark:border-teal-500 bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300'
          : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      <Bell className="w-5 h-5 sm:w-4.5 sm:h-4.5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// ── Asosiy Xabarlar Paneli ────────────────────────────────────────────────────
export const DoctorNotificationPanel = ({
  doctorId,
  onNavigate,
  isDrawer = false,
  onClose = null,
  onOpenFull = null,
}) => {
  const { language = 'uz-Latn', showToast } = useApp();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'navbat' | 'attendance' | 'admin' | 'settings'
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [settings, setSettings] = useState(() => getDoctorNotifSettings(doctorId));
  const PAGE_SIZE = 15;

  const refresh = useCallback(() => {
    if (!doctorId) return;
    setNotifs(getDoctorNotifications(doctorId));
    setSettings(getDoctorNotifSettings(doctorId));
  }, [doctorId]);

  useEffect(() => {
    refresh();

    const notifHandler = () => refresh();
    const settingsHandler = () => setSettings(getDoctorNotifSettings(doctorId));

    window.addEventListener('mednavbat_doctor_notifs_changed', notifHandler);
    window.addEventListener('mednavbat_doctor_settings_changed', settingsHandler);
    window.addEventListener('storage', notifHandler);
    const interval = setInterval(refresh, 10000);

    return () => {
      window.removeEventListener('mednavbat_doctor_notifs_changed', notifHandler);
      window.removeEventListener('mednavbat_doctor_settings_changed', settingsHandler);
      window.removeEventListener('storage', notifHandler);
      clearInterval(interval);
    };
  }, [doctorId, refresh]);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  // Filtr mantiqi
  const filterDef = DOCTOR_NOTIF_FILTERS.find(f => f.key === filter);
  const filtered = notifs.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    if (filter === 'settings') return false;
    return filterDef?.types?.includes(n.type);
  });

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const handleRead = (id) => {
    markDoctorNotifRead(id, doctorId);
    refresh();
  };

  const handleReadAll = () => {
    markAllDoctorNotifsRead(doctorId);
    refresh();
    if (showToast) showToast("Barcha xabarlar o'qildi deb belgilandi", 'info');
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteDoctorNotif(id, doctorId);
      setDeletingId(null);
      refresh();
    }, 250);
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) {
      handleRead(notif.id);
    }
    if (notif.target_section && onNavigate) {
      onNavigate(notif.target_section);
      if (isDrawer && onClose) {
        onClose();
      }
    }
  };

  const handleToggleSound = () => {
    const updated = saveDoctorNotifSettings(doctorId, { soundEnabled: !settings.soundEnabled });
    setSettings(updated);
    if (updated.soundEnabled) {
      playNotificationChime();
      if (showToast) showToast("Ovozli bildirishnoma yoqildi 🔔", 'success');
    } else {
      if (showToast) showToast("Ovozli bildirishnoma o'chirildi 🔕", 'info');
    }
  };

  // Demo xabarlar yaratish
  const addTestNotifs = () => {
    notifyNewAppointment(doctorId, {
      patientName: 'Rustam Sobirov',
      date: 'Ertaga',
      timeSlot: '10:30',
      id: `demo-${Date.now()}`
    });
    notifyAdminMessage(doctorId, "Hurmatli shifokor, haftalik davomat hisoboti tasdiqlandi.", "Bosh vrachdan eslatma 📢");
    notifyScheduleChange(doctorId, "Payshanba kuni qabul soatlari 14:00-18:00 ga ko'chirildi.");
    notifyDailyReminder(doctorId, "Ertaga");
    refresh();
    if (showToast) showToast("Demo xabarlar muvaffaqiyatli qo'shildi", 'success');
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors ${
      isDrawer ? 'h-full w-full' : 'rounded-3xl'
    }`}>
      {/* ── Top Header ── */}
      <div className="px-5 py-4 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white flex items-center justify-between gap-3 shadow-md flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white truncate">
                Xabarlar Markazi
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-teal-100 truncate">
              {unreadCount > 0 ? `${unreadCount} ta o'qilmagan bildirishnoma` : "Barcha xabarlar o'qilgan"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Sound toggle */}
          <button
            onClick={handleToggleSound}
            title={settings.soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            className="w-10 h-10 min-w-[40px] rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition cursor-pointer"
          >
            {settings.soundEnabled ? <Volume2 className="w-4.5 h-4.5 text-teal-100" /> : <VolumeX className="w-4.5 h-4.5 text-rose-300" />}
          </button>

          {/* Refresh */}
          <button
            onClick={refresh}
            title="Yangilash"
            className="w-10 h-10 min-w-[40px] rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-teal-100" />
          </button>

          {/* Drawer Close / Fullscreen button */}
          {isDrawer && (
            <>
              {onOpenFull && (
                <button
                  onClick={() => {
                    onOpenFull();
                    if (onClose) onClose();
                  }}
                  title="Katta ekranda ochish"
                  className="hidden sm:flex w-10 h-10 min-w-[40px] rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 items-center justify-center transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-teal-100" />
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  title="Yopish"
                  className="w-10 h-10 min-w-[40px] rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition cursor-pointer text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Subheader & Mark all as read ── */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          30 kundan eski xabarlar avtomatik arxivlanadi
        </span>

        {unreadCount > 0 && filter !== 'settings' && (
          <button
            onClick={handleReadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Hammasini o'qish</span>
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 dark:border-slate-800 flex-shrink-0 no-scrollbar">
        {DOCTOR_NOTIF_FILTERS.map(f => {
          const count = f.key === 'unread' ? unreadCount
            : f.key === 'all' ? notifs.length
            : notifs.filter(n => f.types?.includes(n.type)).length;

          return (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={`whitespace-nowrap min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === f.key
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{f.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  filter === f.key
                    ? 'bg-white/30 text-white'
                    : f.key === 'unread'
                    ? 'bg-rose-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Sozlamalar tab */}
        <button
          onClick={() => setFilter('settings')}
          className={`whitespace-nowrap min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto ${
            filter === 'settings'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Sozlamalar</span>
        </button>
      </div>

      {/* ── Content Area: List OR Settings ── */}
      <div className="flex-1 overflow-y-auto">
        {filter === 'settings' ? (
          <NotificationSettingsView
            doctorId={doctorId}
            settings={settings}
            onSettingsChange={(newSettings) => setSettings(newSettings)}
            showToast={showToast}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {paginated.length === 0 ? (
              <EmptyState filter={filter} onAddDemo={addTestNotifs} />
            ) : (
              paginated.map(notif => {
                const typeMeta = DOCTOR_NOTIF_TYPES[notif.type] || DOCTOR_NOTIF_TYPES.system;
                const colors = COLOR_MAP[typeMeta.color] || COLOR_MAP.slate;
                const isDeleting = deletingId === notif.id;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`relative flex items-start gap-3.5 p-4 transition-all duration-200 cursor-pointer group select-none ${
                      isDeleting ? 'opacity-0 scale-95' : 'opacity-100'
                    } ${
                      notif.is_read
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                        : `bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50/80 dark:hover:bg-teal-950/35 border-l-4 ${colors.border}`
                    }`}
                  >
                    {/* Icon container */}
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xs ${colors.bg} ${colors.text}`}>
                      <NotifIcon type={notif.type} size="md" />
                    </div>

                    {/* Content text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className={`text-xs font-black truncate ${
                              notif.is_read ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white'
                            }`}>
                              {notif.title}
                            </h4>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        {/* O'chirish tugmasi (kamida 44x44px maydon mobil uchun) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif.id);
                          }}
                          className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer flex-shrink-0"
                          title="Xabarni o'chirish"
                          aria-label="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Footer: vaqt va navigatsiya havolasi */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelTime(notif.created_at, language)}</span>
                        </span>

                        {notif.target_section && (
                          <span className="text-[10px] text-teal-700 dark:text-teal-300 font-extrabold bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 flex items-center gap-1 transition">
                            <span>
                              {notif.target_section === 'timeline' ? "Navbatlar"
                                : notif.target_section === 'attendance' ? "Davomat"
                                : notif.target_section === 'schedule' ? "Jadval"
                                : notif.target_section === 'profile' ? "Profil"
                                : "Ko'rish"}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Load more */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="min-h-[44px] flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>Ko'proq yuklash ({filtered.length - paginated.length} ta qoldi)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sozlamalar Ko'rinishi (Notification Settings) ─────────────────────────────
function NotificationSettingsView({ doctorId, settings, onSettingsChange, showToast }) {
  const [pushStatus, setPushStatus] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [tgCodeData, setTgCodeData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSoundToggle = () => {
    const next = saveDoctorNotifSettings(doctorId, { soundEnabled: !settings.soundEnabled });
    onSettingsChange(next);
    if (next.soundEnabled) playNotificationChime();
  };

  const handleTestSound = () => {
    playNotificationChime();
    if (showToast) showToast("Yengil tovush signali yangradi 🔔", 'info');
  };

  const handleRequestPush = async () => {
    const res = await requestPushPermission();
    setPushStatus(res);
    if (res === 'granted') {
      const next = saveDoctorNotifSettings(doctorId, { pushEnabled: true });
      onSettingsChange(next);
      sendBrowserPushNotification("MedNavbat Shifokor Paneli", {
        body: "Brauzer push bildirishnomalari muvaffaqiyatli yoqildi!"
      });
      if (showToast) showToast("Brauzer push bildirishnomalari yoqildi ✅", 'success');
    } else {
      const next = saveDoctorNotifSettings(doctorId, { pushEnabled: false });
      onSettingsChange(next);
      if (showToast) showToast("Push ruxsati berilmadi yoki rad etildi", 'warning');
    }
  };

  const handleTestPush = () => {
    if (pushStatus !== 'granted') {
      handleRequestPush();
      return;
    }
    sendBrowserPushNotification("MedNavbat Sinov", {
      body: "Yangi navbat: ertaga 10:00 (Sinov xabari)"
    });
    if (showToast) showToast("Sinov push xabari yuborildi 📲", 'info');
  };

  const handleGetTelegramCode = () => {
    const res = generateTelegramLinkCode(doctorId);
    setTgCodeData(res);
  };

  const handleCopyCode = () => {
    if (!tgCodeData?.code) return;
    navigator.clipboard?.writeText(tgCodeData.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    if (showToast) showToast("Bir martalik kod nusxalandi", 'success');
  };

  const handleSimulateTelegramConnect = () => {
    if (!tgCodeData?.code) return;
    const res = verifyTelegramLinkCode(tgCodeData.code, 'dr_toshmatov');
    if (res.success) {
      const next = getDoctorNotifSettings(doctorId);
      onSettingsChange(next);
      setTgCodeData(null);
      if (showToast) showToast(`Telegram bot muvaffaqiyatli ulandi! (${res.telegramUsername})`, 'success');
    } else {
      if (showToast) showToast(res.error || "Ulanishda xato", 'error');
    }
  };

  const handleUnlinkTelegram = () => {
    const next = unlinkTelegram(doctorId);
    onSettingsChange(next);
    setTgCodeData(null);
    if (showToast) showToast("Telegram botdan uzildi", 'info');
  };

  const handleToggleQuietHours = () => {
    const next = saveDoctorNotifSettings(doctorId, {
      quietHoursEnabled: !settings.quietHoursEnabled
    });
    onSettingsChange(next);
  };

  const handleQuietHoursChange = (key, val) => {
    const next = saveDoctorNotifSettings(doctorId, { [key]: val });
    onSettingsChange(next);
  };

  const handleEventFilterToggle = (key) => {
    const current = settings.eventFilters || {};
    const nextFilters = { ...current, [key]: !current[key] };
    const next = saveDoctorNotifSettings(doctorId, { eventFilters: nextFilters });
    onSettingsChange(next);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Bildirishnoma va Kanallar Sozlamalari</span>
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Xabarlarni qanday, qaysi kanallar va qaysi soatlarda olishni o'zingiz boshqaring.
        </p>
      </div>

      {/* ── Section 1: Tovush Signali ── */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Yengil Tovush Signali (Chime)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Yangi navbat yoki xabar kelganda ohang yangraydi</p>
            </div>
          </div>
          <button
            onClick={handleSoundToggle}
            className={`min-w-[48px] h-7 rounded-full transition-colors relative cursor-pointer ${
              settings.soundEnabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
              settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
        {settings.soundEnabled && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex justify-end">
            <button
              onClick={handleTestSound}
              className="min-h-[44px] px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Ovozni sinab ko'rish</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Section 2: Brauzer Push (Web Push / PWA) ── */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-slate-900 dark:text-white">Brauzer Push Bildirishnomasi (PWA)</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  pushStatus === 'granted'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                }`}>
                  {pushStatus === 'granted' ? 'Ruxsat berilgan' : 'Ruxsat berilmagan'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Panel yopiq bo'lganda ham yangi navbatlar haqida darhol xabar olasiz
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2">
          {pushStatus !== 'granted' ? (
            <button
              onClick={handleRequestPush}
              className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Push ruxsatini yoqish</span>
            </button>
          ) : (
            <button
              onClick={handleTestPush}
              className="min-h-[44px] px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sinov push xabari yuborish</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Section 3: Telegram Bot Ulash ── */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-slate-900 dark:text-white">Telegram Bot Xabarnomasi</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  settings.telegramEnabled && settings.telegramUsername
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {settings.telegramEnabled && settings.telegramUsername
                    ? `Ulangan: ${settings.telegramUsername}`
                    : 'Ulanmagan'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Bir martalik xavfsiz kod orqali Telegram botga ulaning
              </p>
            </div>
          </div>
        </div>

        {/* Telegram Code generation box */}
        {tgCodeData && (
          <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-900 dark:text-sky-200">
                Telegram botga yuboriladigan bir martalik kod:
              </span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">10 daqiqa amal qiladi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono font-black tracking-widest text-sky-800 dark:text-sky-200 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-sky-300 dark:border-sky-800">
                {tgCodeData.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="min-h-[44px] px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Nusxalandi' : 'Nusxalash'}</span>
              </button>
              <button
                onClick={handleSimulateTelegramConnect}
                className="min-h-[44px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ml-auto"
                title="Botga yuborish simulyatsiyasi"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ulandim deb tasdiqlash</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Qadam: Telegramda <b>@mednavbat_bot</b> ga kiring va yuqoridagi 6 xonali kodni yuboring.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2">
          {settings.telegramEnabled && settings.telegramUsername ? (
            <button
              onClick={handleUnlinkTelegram}
              className="min-h-[44px] px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>Botdan uzish</span>
            </button>
          ) : (
            <button
              onClick={handleGetTelegramCode}
              className="min-h-[44px] px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bir martalik ulanish kodini olish</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Section 4: Tinch Soatlar (Quiet Hours) ── */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Tinch Soatlar (Kechki orom)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Belgilangan vaqtda push va ovoz bezovta qilmaydi</p>
            </div>
          </div>
          <button
            onClick={handleToggleQuietHours}
            className={`min-w-[48px] h-7 rounded-full transition-colors relative cursor-pointer ${
              settings.quietHoursEnabled ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
              settings.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {settings.quietHoursEnabled && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">Vaqt oralig'i:</span>
            <input
              type="time"
              value={settings.quietHoursStart || '22:00'}
              onChange={(e) => handleQuietHoursChange('quietHoursStart', e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
            <span className="text-xs text-slate-400">dan</span>
            <input
              type="time"
              value={settings.quietHoursEnd || '07:00'}
              onChange={(e) => handleQuietHoursChange('quietHoursEnd', e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
            <span className="text-xs text-slate-400">gacha</span>
          </div>
        )}
      </div>

      {/* ── Section 5: Voqealar Filtrlari ── */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
        <p className="text-xs font-black text-slate-900 dark:text-white">Qaysi voqealarda tashqi xabar yuborilsin?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { key: 'new_appointment', label: 'Yangi navbat yozilganda' },
            { key: 'appointment_cancel', label: 'Navbat bekor qilinganda' },
            { key: 'appointment_change', label: "Navbat o'zgartirilganda" },
            { key: 'leave_status', label: 'Dam olish so\'rovi tasdiqlanganda' },
            { key: 'admin_message', label: 'Admindan muhim xabarlar' },
            { key: 'schedule_change', label: "Ish jadvali o'zgarganda" },
            { key: 'daily_reminder', label: 'Kunlik davomat eslatmasi' },
          ].map(item => {
            const checked = settings.eventFilters?.[item.key] !== false;
            return (
              <label
                key={item.key}
                className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer select-none min-h-[44px]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleEventFilterToggle(item.key)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Privacy Guarantee Note ── */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
            Maksimal Maxfiylik Kafolati (GDPR & Tibbiy Sir)
          </p>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
            Tashqi kanallarga (Telegram, Push, SMS) bemorning to'liq ismi, telefon raqami va tibbiy shikoyatlari HECH QACHON yuborilmaydi. Faqat "Yangi navbat: ertaga 10:00" kabi minimum xavfsiz matn yuboriladi, to'liq ma'lumot esa faqat shifokorning shaxsiy panelida ko'rinadi.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Bo'sh Holat (Empty state) ──────────────────────────────────────────────────
function EmptyState({ filter, onAddDemo }) {
  return (
    <div className="py-16 px-6 text-center select-none">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 shadow-inner">
        <BellOff className="w-8 h-8 text-slate-400 opacity-60" />
      </div>
      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-1">
        {filter === 'unread' ? "O'qilmagan xabarlar yo'q" : "Hozircha xabarlar yo'q"}
      </h4>
      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
        {filter === 'unread'
          ? "Barcha bildirishnomalarni o'qib chiqdingiz. Yangi xabar kelganda bu yerda ko'rinadi."
          : "Navbatlar, davomat, dam olish arizalari va boshqaruv xabarlari shu yerda chiqadi."}
      </p>

      {/* Demo test xabarlar qo'shish tugmasi — faqat DEV rejimida */}
      {import.meta.env.DEV && (
        <button
          onClick={onAddDemo}
          className="mt-5 min-h-[44px] px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
        >
          Demo xabarlar qo'shish (sinov)
        </button>
      )}
    </div>
  );
}
