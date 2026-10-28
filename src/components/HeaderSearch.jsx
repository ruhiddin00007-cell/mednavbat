import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  X, 
  ChevronRight, 
  Star, 
  MapPin, 
  Stethoscope, 
  Activity, 
  Heart, 
  Brain, 
  Sparkles, 
  UserCheck, 
  Baby, 
  Sun, 
  Eye, 
  User, 
  ShieldAlert, 
  Thermometer, 
  Droplet, 
  Droplets, 
  Smile,
  CornerDownLeft
} from 'lucide-react';
import { ClinicLocationLink } from './common/ClinicLocationLink';

const ICON_MAP = {
  Stethoscope,
  Activity,
  Heart,
  Brain,
  Sparkles,
  UserCheck,
  Baby,
  Sun,
  Eye,
  User,
  ShieldAlert,
  Thermometer,
  Droplet,
  Droplets,
  Smile
};

// Matndagi qidirilgan qismni ajratib ko'rsatish (Highlighter)
const HighlightedText = ({ text = '', query = '' }) => {
  if (!query || !text) return <span>{text}</span>;
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-teal-100 text-teal-900 font-extrabold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const HeaderSearch = ({ className = '' }) => {
  const { 
    t, 
    specialties = [], 
    doctors = [], 
    getLocalized, 
    openSpecialtyView, 
    openDoctorDetail 
  } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Tashqariga bosilganda yopish
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Harflarni normallashtirish (apostrof va katta-kichik harflar)
  const normalize = (str = '') => {
    return str
      .toLowerCase()
      .replace(/[ʻʼ'`’‘]/g, "'")
      .trim();
  };

  // Real-time qidiruv natijalari
  const searchResults = useMemo(() => {
    const q = normalize(query);
    if (!q) return { matchedSpecialties: [], matchedDoctors: [], total: 0 };

    // 1. Mutaxassisliklar bo'yicha qidiruv
    const matchedSpecialties = specialties.filter((spec) => {
      const locName = normalize(getLocalized(spec, 'name'));
      const rawName = normalize(spec.name || '');
      const uzName = normalize(spec.name_uz || '');
      const ruName = normalize(spec.name_ru || '');
      const enName = normalize(spec.name_en || '');
      const desc = normalize(getLocalized(spec, 'description') || '');
      const subcats = (spec.subcategories || []).map(s => normalize(s)).join(' ');

      return (
        locName.includes(q) ||
        rawName.includes(q) ||
        uzName.includes(q) ||
        ruName.includes(q) ||
        enName.includes(q) ||
        desc.includes(q) ||
        subcats.includes(q)
      );
    }).map(spec => ({
      type: 'specialty',
      data: spec,
      id: `spec-${spec.id}`
    }));

    // 2. Shifokorlar bo'yicha qidiruv
    const matchedDoctors = doctors.filter((doc) => {
      const name = normalize(doc.name || '');
      const locSpec = normalize(getLocalized(doc, 'specialtyName'));
      const rawSpec = normalize(doc.specialtyName || '');
      const locHosp = normalize(getLocalized(doc, 'hospitalName'));
      const rawHosp = normalize(doc.hospitalName || '');
      const subcat = normalize(doc.subcategory || '');

      return (
        name.includes(q) ||
        locSpec.includes(q) ||
        rawSpec.includes(q) ||
        locHosp.includes(q) ||
        rawHosp.includes(q) ||
        subcat.includes(q)
      );
    }).map(doc => ({
      type: 'doctor',
      data: doc,
      id: `doc-${doc.id}`
    }));

    return {
      matchedSpecialties,
      matchedDoctors,
      total: matchedSpecialties.length + matchedDoctors.length
    };
  }, [query, specialties, doctors, getLocalized]);

  // Barcha natijalar bir tekis tartibda (klaviatura bilan harakatlanish uchun)
  const flatItems = useMemo(() => {
    return [...searchResults.matchedSpecialties, ...searchResults.matchedDoctors];
  }, [searchResults]);

  // Tanlangan elementni bosish / tanlash
  const handleSelectItem = (item) => {
    if (!item) return;

    if (item.type === 'specialty') {
      openSpecialtyView(item.data.id);
    } else if (item.type === 'doctor') {
      openDoctorDetail(item.data);
    }

    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Klaviatura hodisalari
  const handleKeyDown = (e) => {
    if (!isOpen || flatItems.length === 0) {
      if (e.key === 'ArrowDown' && query.trim()) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        handleSelectItem(flatItems[selectedIndex]);
      } else if (flatItems.length > 0) {
        // Agar tanlanmagan bo'lsa, birinchi natijani ochish
        handleSelectItem(flatItems[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center justify-center">
          <Search className="w-4 h-4 text-teal-600 transition-colors" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder', 'Mutaxassislik yoki shifokor qidirish...')}
          className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20 shadow-xs transition-all duration-200"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
            title={t('search.clear', 'Tozalash')}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Live Search Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div 
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[75vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Top Bar with results info */}
          <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {t('search.all_results', 'Qidiruv natijalari')}: <strong className="text-teal-700 dark:text-teal-400">{searchResults.total}</strong> ta mos keldi
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <CornerDownLeft className="w-3 h-3" /> {t('search.navigate_hint', 'Enter — tanlash')}
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {/* If NO RESULTS FOUND */}
            {searchResults.total === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {t('search.no_results', 'Hech narsa topilmadi')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  "{query}" so'rovi bo'yicha hech qanday mutaxassislik yoki shifokor topilmadi.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500">Maslahat:</span>
                  <button
                    onClick={() => setQuery('Xirurg')}
                    className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 font-semibold"
                  >
                    Xirurg
                  </button>
                  <button
                    onClick={() => setQuery('Kardiolog')}
                    className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 font-semibold"
                  >
                    Kardiolog
                  </button>
                  <button
                    onClick={() => setQuery('Akmal')}
                    className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 font-semibold"
                  >
                    Akmal
                  </button>
                </div>
              </div>
            )}

            {/* 1. MUTAXASSISLIKLAR (Specialties Group) */}
            {searchResults.matchedSpecialties.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center justify-between">
                  <span>{t('search.specialties_title', 'Mutaxassisliklar')} ({searchResults.matchedSpecialties.length})</span>
                  <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-semibold">
                    Bo'lim
                  </span>
                </div>

                <div className="space-y-1">
                  {searchResults.matchedSpecialties.map((item) => {
                    const spec = item.data;
                    const IconComponent = ICON_MAP[spec.icon] || Stethoscope;
                    const itemIndex = flatItems.findIndex((it) => it.id === item.id);
                    const isSelected = selectedIndex === itemIndex;
                    const localizedName = getLocalized(spec, 'name');
                    const localizedDesc = getLocalized(spec, 'description');
                    const docCount = doctors.filter(d => d.specialtyId === spec.id).length;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`group px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected 
                            ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-xs' 
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-teal-100/70 text-teal-700 group-hover:bg-teal-600 group-hover:text-white'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs sm:text-sm truncate">
                                <HighlightedText text={localizedName} query={query} />
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 flex-shrink-0">
                                {t('search.specialty_badge', 'Mutaxassislik')}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {localizedDesc || spec.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg hidden sm:inline-block">
                            {docCount} {t('specialties.doctors_count', 'shifokor')}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-0.5 text-teal-600' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. SHIFOKORLAR (Doctors Group) */}
            {searchResults.matchedDoctors.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                  <span>{t('search.doctors_title', 'Shifokorlar')} ({searchResults.matchedDoctors.length})</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                    Profil
                  </span>
                </div>

                <div className="space-y-1">
                  {searchResults.matchedDoctors.map((item) => {
                    const doc = item.data;
                    const itemIndex = flatItems.findIndex((it) => it.id === item.id);
                    const isSelected = selectedIndex === itemIndex;
                    const localizedSpec = getLocalized(doc, 'specialtyName');
                    const localizedHosp = getLocalized(doc, 'hospitalName');

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`group px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected 
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 shadow-xs' 
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img
                              src={doc.avatar}
                              alt={doc.name}
                              className="w-9 h-9 rounded-full object-cover border border-emerald-200"
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs sm:text-sm truncate">
                                <HighlightedText text={doc.name} query={query} />
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex-shrink-0">
                                {t('search.doctor_badge', 'Shifokor')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                              <span className="text-teal-700 font-semibold truncate">
                                <HighlightedText text={localizedSpec} query={query} />
                              </span>
                              <span className="text-slate-300">•</span>
                              <ClinicLocationLink
                                hospital={doc}
                                name={localizedHosp}
                                iconClassName="w-3 h-3 text-rose-400 flex-shrink-0"
                                linkClassName="truncate text-[11px] text-slate-500 hover:text-teal-600"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {doc.rating && (
                            <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                              {doc.rating}
                            </span>
                          )}
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-0.5 text-emerald-600' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom quick shortcut hint */}
          <div className="px-4 py-2 bg-slate-50 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
            <span>Escape — yopish</span>
            <span className="text-teal-700 font-semibold">MedNavbat Tezkor Qidiruv</span>
          </div>
        </div>
      )}
    </div>
  );
};
