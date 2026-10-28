import React, { useState, useRef, useEffect } from 'react';
import { Bell, Star, MessageSquare, CheckCheck, X, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationCenter = () => {
  const {
    t,
    notifications = [],
    unreadNotificationsCount = 0,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    appointments = [],
    openReviewModal
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayedList = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);

    if (notif.type === 'rate_doctor' && notif.appointment_id) {
      const app = appointments.find(a => a.id === notif.appointment_id);
      if (app) {
        openReviewModal(app);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(v => !v)}
        title="Bildirishnomalar"
        aria-label="Bildirishnomalar"
        aria-expanded={isOpen}
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center border transition flex-shrink-0 ${
          isOpen
            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
            : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Unread indicator */}
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div
          ref={containerRef}
          className="absolute right-0 top-full mt-2 z-[100] w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-slate-950/60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                Bildirishnomalar
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  {unreadNotificationsCount} ta yangi
                </span>
              )}
            </div>

            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Barchasini o'qish</span>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1 p-1.5 bg-slate-100/70 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Barchasi ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition ${
                filter === 'unread'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              O'qilmagan ({unreadNotificationsCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {displayedList.length > 0 ? (
              displayedList.map((item) => {
                const isRate = item.type === 'rate_doctor';
                const isReply = item.type === 'complaint_reply';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition cursor-pointer flex items-start gap-3 ${
                      item.is_read
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                        : 'bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/40 border-l-4 border-teal-500'
                    }`}
                  >
                    {/* Icon container */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isRate
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                          : isReply
                          ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                          : 'bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400'
                      }`}
                    >
                      {isRate ? (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ) : isReply ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                        {item.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>

                        {isRate && (
                          <span className="inline-flex items-center gap-1 font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800 text-[11px]">
                            Baholash <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
                  <Bell className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {filter === 'unread' ? "O'qilmagan bildirishnomalar yo'q" : "Hozircha bildirishnomalar mavjud emas"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Qabul yakunlanganda shifokorni baholash taklifi shu yerda paydo bo'ladi.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
