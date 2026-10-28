/**
 * AIChatWidget — MedNavbat "Uy shifokori yordamchisi" AI chat widget
 * ─────────────────────────────────────────────────────────────────────────────
 * - Telefonda (max-width: 768px):
 *     1. Ekranning pastki o'ng burchagida yumaloq #2D9CDB rangli suzuvchi tugma (58px),
 *        oq robot SVG belgisi, yumshoq ko'k yorug'lik va nafis pulsatsiya animatsiyasi.
 *     2. Bosilganda butun ekranga ochiladi, sarlavha "Uy shifokori yordamchisi",
 *        yuqorida yopish (X) tugmasi, suzuvchi tugma yashiriladi.
 *     3. Telefon orqaga (back) tugmasi bosilganda avval chat yopiladi (popstate).
 *     4. Virtual klaviatura ochilganda yozish maydoni klaviatura ustida mustahkam
 *        turadi (visualViewport API) va xabarlar avtomatik pastga suriladi.
 *     5. iPhone safe-area (env(safe-area-inset-bottom/top)) hisobga olingan.
 * - Kompyuter va planshetda (min-width: 769px):
 *     Mavjud oyna va tugma dizayni 100% o'zgarishsiz saqlanadi.
 */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from 'react';
import {
  Bot,
  X,
  Send,
  Square,
  AlertCircle,
  PanelLeftOpen,
  PanelLeftClose,
  Stethoscope,
  History,
} from 'lucide-react';
import { useAIChat } from '../../hooks/useAIChat';
import { useApp } from '../../context/AppContext';
import { ChatMessage } from './ChatMessage';
import { ChatSidebar } from './ChatSidebar';

// ── Quick-start prompt suggestions ───────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '🛏️ Yotoq yaralari', text: 'Yotoq yaralarini (bedsore) qanday oldini olish mumkin?' },
  { label: '💊 Dori tartibi', text: 'Dori-darmonlarni to\'g\'ri qabul qilish tartibini tushuntiring' },
  { label: '🩺 Qon bosim', text: 'Qon bosimini qanday to\'g\'ri o\'lchash kerak?' },
  { label: '🍎 Ovqatlanish', text: 'Kasallar uchun to\'g\'ri ovqatlanish tartibi qanday?' },
  { label: '💉 Diabet', text: 'Diabetli bemorni uyda qanday parvarish qilish kerak?' },
  { label: '🏃 Mashqlar', text: 'Yotgan bemor uchun qanday jismoniy mashqlar tavsiya qilasiz?' },
];

// ── Robot Chat SVG belgisi (tashqi rasm ishlatilmagan, toza inline SVG) ──────
const RobotChatIcon = ({ className = 'w-7 h-7 text-white' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Antenna */}
    <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="2" r="1.5" fill="currentColor" />
    {/* Robot boshi / chat tanasi */}
    <rect
      x="3.5"
      y="5"
      width="17"
      height="12"
      rx="4"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="2"
    />
    {/* Ko'zlar */}
    <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="10.5" r="1.5" fill="currentColor" />
    {/* Tabassum */}
    <path
      d="M9.5 13.5C10.2 14.5 13.8 14.5 14.5 13.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Chat dumi (speech bubble tail) */}
    <path
      d="M7 17L5 21L11 17"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// ── 1. MOBIL SUZUVCHI TUGMA (faqat telefonda: max-width 768px) ─────────────────
const MobileFloatingButton = memo(({ onClick, hasUnread, ariaLabel }) => (
  <button
    id="ai-chat-mobile-float-btn"
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="md:hidden fixed z-50 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 animate-ai-pulse focus:outline-none focus:ring-2 focus:ring-[#2D9CDB] focus:ring-offset-2 select-none"
    style={{
      width: '58px',
      height: '58px',
      right: '16px',
      bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      backgroundColor: '#2D9CDB',
      boxShadow: '0 4px 20px rgba(45, 156, 219, 0.45), 0 0 12px rgba(45, 156, 219, 0.3)',
    }}
  >
    <RobotChatIcon className="w-7 h-7 text-white drop-shadow-sm" />
    {hasUnread && (
      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
    )}
  </button>
));
MobileFloatingButton.displayName = 'MobileFloatingButton';

// ── 2. KOMPYUTER VA PLANSHET SUZUVCHI TUGMASI (min-width: 769px) ──────────────
const DesktopFloatingButton = memo(({ onClick, hasUnread }) => (
  <button
    id="ai-chat-float-btn"
    type="button"
    onClick={onClick}
    className="hidden md:flex fixed bottom-20 right-4 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl hover:shadow-teal-500/30 hover:scale-110 active:scale-95 transition-all duration-200 items-center justify-center group"
    title="AI Yordamchi — Uy Hamshirasi"
  >
    <Bot className="w-6 h-6 drop-shadow" />
    {hasUnread && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
    )}
    {/* Tooltip — chapga chiqadi, overflow hosil qilmaydi */}
    <span className="absolute right-full mr-2 whitespace-nowrap text-xs bg-slate-900 dark:bg-slate-700 text-white px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
      AI Yordamchi
    </span>
  </button>
));
DesktopFloatingButton.displayName = 'DesktopFloatingButton';

// ── ASOSIY WIDGET ─────────────────────────────────────────────────────────────
export const AIChatWidget = () => {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [viewportHeight, setViewportHeight] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    chats,
    activeChat,
    activeChatId,
    isLoading,
    error,
    setError,
    newChat,
    switchChat,
    deleteChat,
    renameChat,
    sendMessage,
    stopGeneration,
  } = useAIChat();

  const messages = activeChat?.messages || [];
  const hasMessages = messages.length > 0;

  // Ko'p tilli aria-label
  const ariaLabel =
    language === 'ru'
      ? 'Открыть AI-помощника'
      : language === 'en'
      ? 'Open AI assistant'
      : 'AI yordamchini ochish';

  // ── Auto-scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // ── Focus input when opened ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // ── Mobil virtual klaviatura (VisualViewport API) ───────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const updateViewport = () => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768 && window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setViewportHeight(null);
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
      updateViewport();
    }

    return () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      }
    };
  }, [isOpen]);

  // ── Mobil telefon "Orqaga (Back)" tugmasi hodisasi (popstate) ──────────────
  useEffect(() => {
    if (!isOpen) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (!isMobile) return;

    // Chat ochilganda tarixga yangi holat kiritamiz
    window.history.pushState({ aiChatOpen: true }, '');

    const handlePopState = (e) => {
      // Agar foydalanuvchi telefonda "orqaga" tugmasini bossa, chat yopiladi
      setIsOpen(false);
      setIsSidebarOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (!activeChatId && chats.length === 0) {
      newChat();
    }
  }, [activeChatId, chats.length, newChat]);

  const handleClose = useCallback(() => {
    // Agar mobile tarix holatida tursa, history.back() chaqirilsa popstate orqali yopiladi
    if (
      typeof window !== 'undefined' &&
      window.innerWidth <= 768 &&
      window.history.state?.aiChatOpen
    ) {
      window.history.back();
    } else {
      setIsOpen(false);
      setIsSidebarOpen(false);
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(text);
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleTextareaChange = useCallback((e) => {
    setInputValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
  }, []);

  const handleQuickPrompt = useCallback((text) => {
    setInputValue(text);
    textareaRef.current?.focus();
  }, []);

  return (
    <>
      {/* ── 1. SUZUVCHI TUGMALAR (faqat chat yopiq bo'lsa) ───────────────────── */}
      {!isOpen && (
        <>
          {/* Mobil suzuvchi tugma (faqat ekran <= 768px da chiqadi) */}
          <MobileFloatingButton
            onClick={handleOpen}
            hasUnread={false}
            ariaLabel={ariaLabel}
          />

          {/* Kompyuter suzuvchi tugma (faqat ekran > 768px da chiqadi) */}
          <DesktopFloatingButton onClick={handleOpen} hasUnread={false} />
        </>
      )}

      {/* ── 2. MOBIL CHAT OYNASI (BUTUN EKRAN — max-width: 768px) ────────────── */}
      {isOpen && (
        <div
          id="ai-chat-mobile-fullscreen"
          className="md:hidden fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 animate-fadeIn"
          style={{
            height: viewportHeight ? `${viewportHeight}px` : '100dvh',
            maxHeight: '100dvh',
          }}
        >
          {/* Mobil Sarlavha (Header) */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#2D9CDB] to-[#1E88E5] text-white flex-shrink-0 shadow-md"
            style={{
              paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
            }}
          >
            {/* Chap tomonda: Suhbatlar tarixi tugmasi */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((p) => !p)}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Suhbatlar tarixi"
              aria-label="Suhbatlar tarixi"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <History className="w-5 h-5" />
              )}
            </button>

            {/* Markazda: Robot belgisi va Sarlavha */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 shadow-xs">
                <RobotChatIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-center min-w-0">
                <h2 className="text-sm font-extrabold text-white leading-tight truncate">
                  Uy shifokori yordamchisi
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLoading ? 'bg-amber-300 animate-pulse' : 'bg-emerald-300'
                    }`}
                  />
                  <span className="text-[10px] text-white/90 font-medium">
                    {isLoading ? 'Yozmoqda...' : 'Onlayn · Tibbiy maslahat'}
                  </span>
                </div>
              </div>
            </div>

            {/* O'ng tomonda: Yopish (X) tugmasi */}
            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Yopish"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobil Suhbatlar Tarixi (Drawer Overlay) */}
          {isSidebarOpen && (
            <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex animate-fadeIn">
              <div className="w-[82%] max-w-xs h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Suhbatlar tarixi
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ChatSidebar
                    chats={chats}
                    activeChatId={activeChatId}
                    onNewChat={() => {
                      newChat();
                      setIsSidebarOpen(false);
                    }}
                    onSelectChat={(id) => {
                      switchChat(id);
                      setIsSidebarOpen(false);
                    }}
                    onDeleteChat={deleteChat}
                    onRenameChat={renameChat}
                  />
                </div>
              </div>
              <div
                className="flex-1 h-full"
                onClick={() => setIsSidebarOpen(false)}
              />
            </div>
          )}

          {/* Mobil Xabarlar ro'yxati */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-900/90">
            {!hasMessages && (
              <div className="h-full flex flex-col items-center justify-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#2D9CDB]/15 border border-[#2D9CDB]/30 flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-[#2D9CDB]" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    Uy shifokori yordamchisi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px]">
                    Sog'ligingiz va bemorlar parvarishi bo'yicha savollaringizga javob beraman
                  </p>
                </div>

                {/* Tezkor savollar */}
                <div className="w-full grid grid-cols-2 gap-2 pt-2">
                  {QUICK_PROMPTS.map((qp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleQuickPrompt(qp.text)}
                      className="text-left px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2D9CDB] dark:hover:border-[#2D9CDB] active:bg-[#2D9CDB]/10 transition-colors text-[11px] text-slate-700 dark:text-slate-300 font-medium shadow-2xs"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center max-w-[260px] pt-2">
                  ⚠️ Men aniq tibbiy diagnoz qo'ymayman. Shoshilinch vaziyatlarda darhol{' '}
                  <a href="tel:103" className="font-extrabold text-rose-500 dark:text-rose-400 underline hover:text-rose-600 dark:hover:text-rose-300 active:opacity-60 min-h-[44px] inline-flex items-center" title="103 Tez Yordamga qo'ng'iroq qilish">103 Tez Yordam</a>ga qo'ng'iroq qiling.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLast={idx === messages.length - 1}
              />
            ))}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 underline"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Mobil 103 Ogohlantirish satri */}
          <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200/60 dark:border-amber-800/40 flex-shrink-0">
            <p className="text-[11px] text-amber-800 dark:text-amber-300 text-center font-medium">
              ⚠️ AI diagnoz qo'ymaydi · Jiddiy holatda:{' '}
              <a href="tel:103" className="font-extrabold text-rose-500 dark:text-rose-400 underline hover:text-rose-600 active:opacity-60" title="103 Tez Yordamga qo'ng'iroq">
                103 Tez Yordam
              </a>
            </p>
          </div>

          {/* Mobil Yozish maydoni (Klaviatura ustida mustahkam turadi) */}
          <div
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0"
            style={{
              paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Savolingizni yozing..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#2D9CDB] focus:ring-1 focus:ring-[#2D9CDB] transition-colors disabled:opacity-60 max-h-28 leading-relaxed"
                style={{ height: 'auto', minHeight: '40px' }}
              />

              {isLoading ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="flex-shrink-0 w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 active:bg-rose-100 active:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="To'xtatish"
                  aria-label="To'xtatish"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#2D9CDB] hover:bg-[#1E88E5] active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 flex items-center justify-center transition-all disabled:cursor-not-allowed shadow-md shadow-[#2D9CDB]/20"
                  title="Yuborish"
                  aria-label="Yuborish"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. KOMPYUTER VA PLANSHET CHAT OYNASI (min-width: 769px) ─────────── */}
      {isOpen && (
        <div
          id="ai-chat-window"
          className="hidden md:flex fixed bottom-20 right-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60"
          style={{
            width: isSidebarOpen ? 580 : 360,
            height: 560,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 100px)',
          }}
        >
          {/* Kompyuter Sidebar */}
          {isSidebarOpen && (
            <div className="w-48 flex-shrink-0 overflow-hidden">
              <ChatSidebar
                chats={chats}
                activeChatId={activeChatId}
                onNewChat={() => {
                  newChat();
                }}
                onSelectChat={(id) => {
                  switchChat(id);
                }}
                onDeleteChat={deleteChat}
                onRenameChat={renameChat}
              />
            </div>
          )}

          {/* Kompyuter Asosiy chat maydoni */}
          <div className="flex flex-col flex-1 bg-white dark:bg-slate-900 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((p) => !p)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
                title={isSidebarOpen ? 'Yopish' : 'Suhbatlar tarixi'}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </button>

              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold leading-tight truncate">
                  AI Uy Hamshirasi Yordamchi
                </p>
                <div className="flex items-center gap-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  <p className="text-white/80 text-[9px] leading-tight">
                    {isLoading ? 'Yozmoqda...' : 'Onlayn · Tibbiy maslahat'}
                  </p>
                </div>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors flex-shrink-0"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50 dark:bg-slate-900/80">
              {!hasMessages && (
                <div className="h-full flex flex-col items-center justify-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/20 flex items-center justify-center">
                    <Stethoscope className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Uy Hamshirasi AI Yordamchi
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[220px]">
                      Bemorlar parvarishi bo'yicha savollaringizga javob beraman
                    </p>
                  </div>

                  {/* Quick prompts */}
                  <div className="w-full grid grid-cols-2 gap-1.5">
                    {QUICK_PROMPTS.map((qp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickPrompt(qp.text)}
                        className="text-left px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-[10px] text-slate-700 dark:text-slate-300 leading-tight font-medium shadow-sm"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[9px] text-slate-400 dark:text-slate-600 text-center max-w-[220px]">
                    ⚠️ Men tibbiy diagnoz qo'ymayman. Jiddiy holatlarda{' '}
                    <a href="tel:103" className="font-extrabold text-rose-500 dark:text-rose-400 underline hover:text-rose-600 active:opacity-60" title="103 Tez Yordamga qo'ng'iroq">103 Tez Yordam</a>ga murojaat qiling.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLast={idx === messages.length - 1}
                />
              ))}

              {error && (
                <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-rose-700 dark:text-rose-300 leading-relaxed">
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="mt-1 text-[9px] text-rose-600 dark:text-rose-400 underline hover:no-underline"
                    >
                      Yopish
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Disclaimer strip */}
            <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200/60 dark:border-amber-800/30 flex-shrink-0">
              <p className="text-[9px] text-amber-700 dark:text-amber-400 text-center">
                ⚠️ AI diagnoz qo'ymaydi · Jiddiy holat:{' '}
                <a href="tel:103" className="font-extrabold text-rose-500 dark:text-rose-400 underline hover:text-rose-600 active:opacity-60" title="103 Tez Yordamga qo'ng'iroq">103</a>
              </p>
            </div>

            {/* Input area */}
            <div className="px-3 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/60 flex-shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Savolingizni yozing... (Enter — yuborish)"
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 resize-none text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-teal-500 dark:focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-colors disabled:opacity-60 max-h-24 leading-relaxed"
                  style={{ height: 'auto', minHeight: '36px' }}
                />

                {isLoading ? (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors"
                    title="To'xtatish"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="flex-shrink-0 w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                    title="Yuborish (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
