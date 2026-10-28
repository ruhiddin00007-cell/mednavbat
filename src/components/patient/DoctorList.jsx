import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorCard } from './DoctorCard';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Frown,
  MapPin,
  Globe2,
  Sparkles,
  Languages
} from 'lucide-react';


export const DoctorList = () => {
  const { 
    t,
    doctors, 
    selectedSpecialty, 
    setSelectedSpecialty, 
    searchQuery, 
    setSearchQuery,
    filterExperience,
    setFilterExperience,
    filterRating,
    setFilterRating,
    filterPriceMax,
    setFilterPriceMax,
    filterDay,
    setFilterDay,
    specialties,
    getLocalized,
    selectedCountry,
    selectedRegion,
    clearRegionFilter,
    openLocationModal
  } = useApp();

  const [sortBy, setSortBy] = useState('rating');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterDoctorLanguage, setFilterDoctorLanguage] = useState('all');

  const activeSpecialtyObj = specialties.find(s => s.id === selectedSpecialty);


  // Filtered & Sorted Doctors
  const filteredDoctors = useMemo(() => {
    const countryIso = (selectedCountry?.code || selectedCountry?.iso2 || 'UZ').toUpperCase();

    return doctors.filter(doctor => {
      // 1. Davlat filtri (har qanday davlat: UZ, US, KZ, TR, DE, GB, ...)
      const docCountry = (doctor.countryId || 'UZ').toUpperCase();
      if (docCountry !== countryIso) {
        return false;
      }

      // 2. Viloyat / Shtat filtri
      if (selectedRegion && doctor.regionId && doctor.regionId !== selectedRegion.id) {
        return false;
      }

      // 3. Tasdiqlangan litsenziya filtri
      if (filterVerifiedOnly && !doctor.licenseVerified) {
        return false;
      }

      // 4. Real-vaqt Online holati filtri (shifokorning O'Z vaqt zonasi bo'yicha)
      if (filterOnlineOnly) {
        const isOnline = doctor.availability ? doctor.availability.isOnline : (doctor.onCall || doctor.available24_7);
        if (!isOnline) {
          return false;
        }
      }

      // 5. Mutaxassislik filtri
      if (selectedSpecialty && doctor.specialtyId !== selectedSpecialty && doctor.specialty !== selectedSpecialty) {
        return false;
      }

      // 6. Qidiruv matni filtri
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const docName = (doctor.fullName || doctor.name || '').toLowerCase();
        const matchesName = docName.includes(q);
        const matchesSpec = (doctor.specialtyName || doctor.specialty || '').toLowerCase().includes(q);
        const matchesHosp = (doctor.hospitalName || '').toLowerCase().includes(q);
        const matchesSub = (doctor.subcategory || '').toLowerCase().includes(q);
        const matchesReg = (doctor.regionName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSpec && !matchesHosp && !matchesSub && !matchesReg) return false;
      }

      // 7. Tajriba filtri
      if (filterExperience > 0 && doctor.experienceYears < filterExperience) {
        return false;
      }

      // 8. Reyting filtri
      if (filterRating > 0 && doctor.rating < filterRating) {
        return false;
      }

      // 9. Narx filtri
      if (filterPriceMax > 0 && doctor.price > filterPriceMax) {
        return false;
      }

      // 10. Kun filtri
      if (filterDay && Array.isArray(doctor.workScheduleDays) && !doctor.workScheduleDays.includes(filterDay)) {
        return false;
      }

      // 11. Shifokor qabul tili filtri (spokenLanguages)
      if (filterDoctorLanguage !== 'all') {
        const docLangs = Array.isArray(doctor.spokenLanguages) ? doctor.spokenLanguages : ['uz-Latn', 'ru'];
        const matchesLang = docLangs.some(l => 
          l.toLowerCase() === filterDoctorLanguage.toLowerCase() ||
          l.toLowerCase().startsWith(filterDoctorLanguage.toLowerCase())
        );
        if (!matchesLang) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'experience') return (b.experienceYears || 0) - (a.experienceYears || 0);
      if (sortBy === 'online') {
        const aOnline = a.availability?.isOnline ? 1 : 0;
        const bOnline = b.availability?.isOnline ? 1 : 0;
        return bOnline - aOnline;
      }
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      return 0;
    });
  }, [doctors, selectedCountry, selectedRegion, filterVerifiedOnly, filterOnlineOnly, selectedSpecialty, searchQuery, filterExperience, filterRating, filterPriceMax, filterDay, filterDoctorLanguage, sortBy]);

  const resetAllFilters = () => {
    setSelectedSpecialty(null);
    setSearchQuery('');
    setFilterExperience(0);
    setFilterRating(0);
    setFilterPriceMax(400000);
    setFilterDay('');
    setSortBy('rating');
    setFilterOnlineOnly(false);
    setFilterVerifiedOnly(false);
    setFilterDoctorLanguage('all');
  };


  return (
    <section id="doctors-section" className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{t('doctors.title')}</span>
              {activeSpecialtyObj && (
                <span className="text-teal-700 bg-teal-100 text-sm font-bold px-3 py-1 rounded-xl">
                  {getLocalized(activeSpecialtyObj, 'name').split('(')[0]}
                </span>
              )}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {t('doctors.found_doctors')}: <strong className="text-slate-900 dark:text-white">{filteredDoctors.length} {t('specialties.doctors_count')}</strong>
            </p>

            {/* Regional Filter Indicator & Quick Actions */}
            <div className="flex items-center flex-wrap gap-2 mt-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 rounded-xl text-xs font-bold shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>
                  {selectedCountry?.code === 'UZ' 
                    ? (selectedRegion ? `Hudud: ${selectedRegion.name}` : "Barcha viloyatlar")
                    : `${selectedCountry?.flag || ''} ${selectedCountry?.name || "Xalqaro"}`}
                </span>
              </div>

              {selectedRegion && selectedCountry?.code === 'UZ' && (
                <button
                  onClick={clearRegionFilter}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="O'zbekistonning barcha viloyatlaridagi shifokorlarni ko'rish"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>Barcha hududlar</span>
                </button>
              )}

              <button
                onClick={openLocationModal}
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-bold underline px-1 py-1 cursor-pointer"
              >
                O'zgartirish
              </button>
            </div>
          </div>

          {/* Sort Selector & Reset button */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Quick Online Only Filter */}
            <button
              onClick={() => setFilterOnlineOnly(!filterOnlineOnly)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                filterOnlineOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filterOnlineOnly ? 'bg-white animate-ping' : 'bg-emerald-500'}`} />
              <span>Hozir online</span>
            </button>

            {/* Quick Verified Only Filter */}
            <button
              onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                filterVerifiedOnly
                  ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
              }`}
            >
              <span>Litsenziyasi tasdiqlangan</span>
            </button>

            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Saralash:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="rating">{t('doctor_detail.rating')}</option>
                <option value="online">Online shifokorlar oldinda</option>
                <option value="experience">{t('doctors.experience_years')}</option>
                <option value="price-asc">{t('doctors.consultation_fee')} (min)</option>
                <option value="price-desc">{t('doctors.consultation_fee')} (max)</option>
              </select>
            </div>

            <button
              onClick={resetAllFilters}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('doctors.reset_filters')}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <span>{t('doctors.search_results')}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">MEDNAVBAT MED SYSTEM</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Experience Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t('doctors.filter_experience')}:</span>
                <span className="text-teal-700">{filterExperience === 0 ? 'All' : `${filterExperience}+ ${t('doctors.years_suffix')}`}</span>
              </label>
              <select
                value={filterExperience}
                onChange={(e) => setFilterExperience(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={0}>0+ {t('doctors.years_suffix')}</option>
                <option value={5}>5+ {t('doctors.years_suffix')}</option>
                <option value={10}>10+ {t('doctors.years_suffix')}</option>
                <option value={15}>15+ {t('doctors.years_suffix')}</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t('doctors.filter_rating')}:</span>
                <span className="text-amber-600">{filterRating === 0 ? 'All' : `${filterRating} ★`}</span>
              </label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={0}>All</option>
                <option value={4.5}>4.5 ★+</option>
                <option value={4.8}>4.8 ★+</option>
                <option value={4.9}>4.9 ★ Top</option>
              </select>
            </div>

            {/* Spoken Language Filter (Qaysi tilda gaplashadigan shifokorlar) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('doctors.filter_language', 'Qabul tili')}:</span>
                </span>
                <span className="text-teal-700 font-bold uppercase text-[10px]">
                  {filterDoctorLanguage === 'all' ? 'All' : filterDoctorLanguage}
                </span>
              </label>
              <select
                value={filterDoctorLanguage}
                onChange={(e) => setFilterDoctorLanguage(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="all">{t('doctors.all_languages', 'Barcha tillar')}</option>
                <option value="uz">🇺🇿 O'zbek tili</option>
                <option value="ru">🇷🇺 Rus tili (Русский)</option>
                <option value="en">🇬🇧 Ingliz tili (English)</option>
                <option value="tr">🇹🇷 Turk tili (Türkçe)</option>
                <option value="kk">🇰🇿 Qozoq tili (Қазақша)</option>
                <option value="ar">🇸🇦 Arab tili (العربية)</option>
                <option value="de">🇩🇪 Nemis tili (Deutsch)</option>
              </select>
            </div>

            {/* Max Price Range Slider */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t('doctors.filter_price')}:</span>
                <span className="text-emerald-700 font-extrabold">{filterPriceMax.toLocaleString()} UZS</span>
              </label>
              <input
                type="range"
                min={100000}
                max={400000}
                step={20000}
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer mt-2"
              />
            </div>

            {/* Work Day Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('doctors.filter_day')}:
              </label>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{t('specialties.all')}</option>
                <option value="Dushanba">Dushanba</option>
                <option value="Seshanba">Seshanba</option>
                <option value="Chorshanba">Chorshanba</option>
                <option value="Payshanba">Payshanba</option>
                <option value="Juma">Juma</option>
                <option value="Shanba">Shanba</option>
              </select>
            </div>

          </div>
        </div>


        {/* Doctor Grid Cards */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-700 shadow-xs max-w-md mx-auto my-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <Frown className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('doctors.no_doctors_found')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedRegion 
                  ? `"${selectedRegion.name}" hududida tanlangan filtr bo'yicha shifokor topilmadi.` 
                  : "Filtrlarni qayta sozlab yoki boshqa so'z bilan qidirib ko'ring."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              {selectedRegion && (
                <button
                  onClick={clearRegionFilter}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Barcha hududlar bo'yicha ko'rish
                </button>
              )}
              <button
                onClick={resetAllFilters}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {t('doctors.reset_filters')}
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
