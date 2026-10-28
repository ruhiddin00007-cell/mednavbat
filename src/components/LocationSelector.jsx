import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  X, 
  Check, 
  Building2, 
  Compass, 
  Globe2, 
  AlertCircle, 
  Loader2, 
  ArrowRight
} from 'lucide-react';
import { UZBEKISTAN_REGIONS } from '../data/locationData';

export const LocationSelector = ({
  isOpen = false,
  isOnboarding = false,
  onClose,
  selectedRegion,
  onSelectRegion,
  onClearRegion,
  onDetectLocation,
  isDetecting = false,
  detectionError = null,
  isHttps = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  // Qidiruv bo'yicha filtrlangan O'zbekiston hududlari
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return UZBEKISTAN_REGIONS;
    const q = searchQuery.toLowerCase().trim();
    return UZBEKISTAN_REGIONS.filter(region => 
      (region.name && region.name.toLowerCase().includes(q)) ||
      (region.nameUz && region.nameUz.toLowerCase().includes(q)) ||
      (region.name_uz && region.name_uz.toLowerCase().includes(q)) ||
      (region.centerHospital && region.centerHospital.toLowerCase().includes(q)) ||
      (Array.isArray(region.aliases) && region.aliases.some(alias => alias.toLowerCase().includes(q)))
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-dialog-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-500/5 via-emerald-500/5 to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs flex-shrink-0">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="location-dialog-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    O'zbekiston Hududini Tanlang
                  </h2>
                  <span className="bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                    14 ta Hudud
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Shifokorlar va klinikalarni o'zingizga qulay hudud bo'yicha saralang
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition active:scale-95 flex-shrink-0"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Auto-Detect GPS Button */}
          <div className="mt-4">
            <button
              onClick={onDetectLocation}
              disabled={isDetecting}
              className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-md shadow-teal-600/25 transition transform active:scale-98 disabled:opacity-75 cursor-pointer"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GPS va IP orqali aniqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 animate-pulse" />
                  <span>Joylashuvingizni avtomatik aniqlash (GPS)</span>
                </>
              )}
            </button>
          </div>

          {/* Detection Error Warning */}
          {detectionError && (
            <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-semibold">{detectionError}</p>
                <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-0.5">
                  Iltimos, quyidagi ro'yxatdan hududingizni o'zingiz tanlang.
                </p>
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Viloyat yoki shahar nomi bo'yicha qidirish..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="space-y-3">
            {/* All Regions Quick Selection */}
            <button
              onClick={() => {
                onClearRegion();
                handleClose();
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer group ${
                selectedRegion === null
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/20'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Barcha hududlar (Butun O'zbekiston)
                    </span>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/80 px-2 py-0.5 rounded-full">
                      14 ta Hudud
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Barcha 14 ta viloyat va shahardagi shifokorlarni ko'rish
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {selectedRegion === null ? (
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
                )}
              </div>
            </button>

            {/* Regions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredRegions.map((region) => {
                const isSelected = selectedRegion?.id === region.id;
                const regName = region.name_uz || region.name;

                return (
                  <button
                    key={region.id}
                    onClick={() => {
                      onSelectRegion(region);
                      handleClose();
                    }}
                    className={`flex items-start justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/20'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                          {regName}
                        </span>
                      </div>

                      {region.centerHospital && (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{region.centerHospital}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 mt-1.5">
                        {region.doctorsCount !== undefined && (
                          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                            {region.doctorsCount} ta shifokor
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 group-hover:border-teal-400 flex items-center justify-center transition text-transparent group-hover:text-teal-600">
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredRegions.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <Compass className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  "{searchQuery}" bo'yicha O'zbekiston hududi topilmadi.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
