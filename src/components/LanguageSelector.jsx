import React, { useState, useMemo, useEffect } from 'react';
import { 
  Globe2, 
  Search, 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  MessageSquarePlus,
  Send,
  Languages
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WORLD_LANGUAGES, findLanguageByCode } from '../data/languagesConfig';
import { searchLanguages, getRecentLanguages, addRecentLanguage } from '../utils/languageSearch';

export const LanguageSelector = ({
  isOpen = false,
  onClose,
  currentLanguage = 'uz-Latn',
  onSelectLanguage
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'recent', 'central_asia', 'europe', 'asia', 'middle_east'
  const [recentLangs, setRecentLangs] = useState([]);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestInput, setSuggestInput] = useState('');
  const [suggestSent, setSuggestSent] = useState(false);

  // Yaqinda ishlatilgan tillarni yuklash
  useEffect(() => {
    if (isOpen) {
      setRecentLangs(getRecentLanguages());
      setSearchQuery('');
      setSuggestSent(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setSearchQuery('');
    setIsSuggestModalOpen(false);
    onClose();
  };

  // Qidiruv natijalari
  const searchedLanguages = useMemo(() => {
    let list = WORLD_LANGUAGES;

    // Kategoriya tabi bo'yicha saralash
    if (activeTab === 'recent') {
      return recentLangs.length > 0 ? recentLangs : WORLD_LANGUAGES;
    } else if (activeTab === 'central_asia') {
      list = WORLD_LANGUAGES.filter(l => l.region === 'central_asia');
    } else if (activeTab === 'middle_east') {
      list = WORLD_LANGUAGES.filter(l => l.region === 'middle_east' || l.direction === 'rtl');
    } else if (activeTab === 'asia') {
      list = WORLD_LANGUAGES.filter(l => l.region === 'asia');
    } else if (activeTab === 'europe') {
      list = WORLD_LANGUAGES.filter(l => l.region === 'europe');
    }

    if (!searchQuery.trim()) {
      return list;
    }

    return searchLanguages(searchQuery, list);
  }, [searchQuery, activeTab, recentLangs]);

  const handleChooseLanguage = (langObj) => {
    addRecentLanguage(langObj.code);
    if (onSelectLanguage) {
      onSelectLanguage(langObj.code);
    }
    handleClose();
  };

  const handleSendSuggestion = (e) => {
    e.preventDefault();
    if (!suggestInput.trim()) return;
    setSuggestSent(true);
    setTimeout(() => {
      setIsSuggestModalOpen(false);
      setSuggestInput('');
      setSuggestSent(false);
    }, 2000);
  };

  if (!isOpen) return null;

  const currentObj = findLanguageByCode(currentLanguage) || WORLD_LANGUAGES[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-dialog-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-scaleUp transition-colors duration-200"
      >
        {/* ── HEADER ── */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-teal-500/5 via-transparent to-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs">
              <Globe2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="language-dialog-title" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {t('language_modal.title', 'Tilni tanlang')}
                </h2>
                <span className="text-[10px] font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {WORLD_LANGUAGES.length}+ Tillar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {t('language_modal.subtitle', "Dunyoning 50 dan ortiq asosiy tillari va yozuvlari")}
              </p>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── SEARCH INPUT ── */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('language_modal.search_placeholder', "Til nomi yoki kodi bo'yicha qidirish (masalan: uz, ru, en, tr, ar, xitoy)...")}
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition shadow-xs"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Tozalash"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: t('language_modal.tabs.all', 'Barchasi') },
              { id: 'recent', label: t('language_modal.tabs.recent', 'Yaqinda') },
              { id: 'central_asia', label: t('language_modal.tabs.central_asia', 'Markaziy Osiyo') },
              { id: 'middle_east', label: t('language_modal.tabs.middle_east', 'Yaqin Sharq & RTL') },
              { id: 'europe', label: t('language_modal.tabs.europe', 'Yevropa') },
              { id: 'asia', label: t('language_modal.tabs.asia', 'Osiyo') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition text-[11px] sm:text-xs ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT / LANGUAGES GRID ── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">

          {/* Yaqinda ishlatilgan tillar bo'limi (agar qidiruv bo'lmasa) */}
          {!searchQuery && recentLangs.length > 0 && activeTab === 'all' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t('language_modal.recent_languages', 'Yaqinda ishlatilgan')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {recentLangs.map(lang => {
                  const isCurrent = (lang.code === currentLanguage || lang.code === currentObj.code);
                  return (
                    <button
                      key={`recent-${lang.code}`}
                      onClick={() => handleChooseLanguage(lang)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition text-left ${
                        isCurrent
                          ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-500 dark:border-teal-600 ring-2 ring-teal-500/20'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:bg-teal-50/40 dark:hover:bg-slate-800 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl leading-none flex-shrink-0">{lang.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {lang.nameNative}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {lang.nameEn}
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Barcha tillar ro'yxati */}
          <div className="space-y-2">
            {!searchQuery && activeTab === 'all' && (
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                {t('language_modal.all_languages', 'Barcha tillar')} ({searchedLanguages.length})
              </div>
            )}

            {searchedLanguages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {searchedLanguages.map(lang => {
                  const isCurrent = (lang.code === currentLanguage || lang.code === currentObj.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleChooseLanguage(lang)}
                      className={`group flex items-center justify-between p-3 rounded-2xl border transition text-left active:scale-[0.99] ${
                        isCurrent
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 dark:border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/20 dark:hover:bg-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl leading-none flex-shrink-0 filter drop-shadow-xs">
                          {lang.flag}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {lang.nameNative}
                            </span>
                            {lang.direction === 'rtl' && (
                              <span className="text-[9px] font-black uppercase px-1 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-800 flex-shrink-0">
                                RTL
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            <span className="truncate">{lang.nameEn}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400">
                              {lang.code}
                            </span>
                          </div>

                          {/* Tekshiruv belgisi */}
                          <div className="mt-1 flex items-center gap-1">
                            {lang.isVerified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                {t('language_modal.verified_badge', 'Tibбий tasdiqlangan')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-400 dark:text-slate-500">
                                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                {t('language_modal.auto_badge', 'Avto-tarjima')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 transition">
                            <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Natija topilmadi ekrani */
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <AlertCircle className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('language_modal.no_results', 'Til topilmadi')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    "{searchQuery}" bo'yicha hech qanday til topilmadi. Qidiruv so'zini tekshiring yoki kodi bo'yicha qidiring.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSuggestInput(searchQuery);
                      setIsSuggestModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>{t('language_modal.missing_lang_btn', 'Tilingiz yo\'qmi? Bizga yozing')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER / MISSING LANGUAGE BAR ── */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              Hozirgi til: <strong>{currentObj.nameNative}</strong> ({currentObj.code})
            </span>
          </div>

          <button
            onClick={() => setIsSuggestModalOpen(true)}
            className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold hover:underline"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>{t('language_modal.missing_lang_btn', "Tilingiz yo'qmi? Bizga yozing")}</span>
          </button>
        </div>
      </div>

      {/* ── SUGGEST NEW LANGUAGE MODAL ── */}
      {isSuggestModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <Languages className="w-5 h-5 text-teal-600" />
                <h3>{t('language_modal.missing_lang_title', 'Yangi til bo\'yicha taklif')}</h3>
              </div>
              <button 
                onClick={() => setIsSuggestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('language_modal.missing_lang_prompt', 'Qaysi tilni platformaga qo\'shishimizni xohlaysiz? Bu taklif tibbiy tarjimonlar guruhimizga yuboriladi.')}
            </p>

            {suggestSent ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-1">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  Rahmat! Taklifingiz qabul qilindi.
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Tez orada yangi til qo'shiladi.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendSuggestion} className="space-y-3">
                <input 
                  type="text"
                  value={suggestInput}
                  onChange={(e) => setSuggestInput(e.target.value)}
                  placeholder="Til nomi (masalan: Ozarbayjoncha, Tatar, Bashkir)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsSuggestModalOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={!suggestInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Yuborish</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
