import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { 
  getRegions, 
  getHospitalsByRegion, 
  getSpecialtiesByHospital,
  getHospitalById
} from '../../data/medicalDataLoader';
import { 
  MapPin, 
  Building2, 
  Stethoscope, 
  UserCheck, 
  Phone, 
  Clock, 
  Calendar, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Sparkles,
  Info,
  Navigation
} from 'lucide-react';
import { ClinicLocationLink } from '../common/ClinicLocationLink';
import { getYandexMapUrl, openYandexMaps } from '../../utils/yandexMaps';

export const UzbekistanMedicalFinder = () => {
  const { t } = useTranslation();
  const { setSelectedDoctor, setActiveModal } = useApp();

  // Bosqichlar: 1: Hudud -> 2: Shifoxona -> 3: Mutaxassislik -> 4: Shifokor
  const [selectedRegionId, setSelectedRegionId] = useState('tashkent_city');
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(null);

  const [regionSearch, setRegionSearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');

  // 14 ta hudud
  const allRegions = useMemo(() => getRegions(), []);

  const filteredRegions = useMemo(() => {
    if (!regionSearch.trim()) return allRegions;
    const q = regionSearch.toLowerCase();
    return allRegions.filter(r => r.name.toLowerCase().includes(q));
  }, [allRegions, regionSearch]);

  const currentRegion = useMemo(() => {
    return allRegions.find(r => r.id === selectedRegionId) || allRegions[0];
  }, [allRegions, selectedRegionId]);

  // Tanlangan hududdagi shifoxonalar
  const hospitals = useMemo(() => {
    return getHospitalsByRegion(selectedRegionId);
  }, [selectedRegionId]);

  const filteredHospitals = useMemo(() => {
    if (!hospitalSearch.trim()) return hospitals;
    const q = hospitalSearch.toLowerCase();
    return hospitals.filter(h => 
      h.name.toLowerCase().includes(q) || 
      h.address.toLowerCase().includes(q)
    );
  }, [hospitals, hospitalSearch]);

  const currentHospital = useMemo(() => {
    if (!selectedHospitalId) return null;
    return getHospitalById(selectedHospitalId);
  }, [selectedHospitalId]);

  // Tanlangan shifoxonadagi mutaxassisliklar
  const specialties = useMemo(() => {
    if (!selectedHospitalId) return [];
    return getSpecialtiesByHospital(selectedHospitalId);
  }, [selectedHospitalId]);

  // Shifokorlar ro'yxati
  const availableDoctors = useMemo(() => {
    if (!currentHospital) return [];
    let docs = currentHospital.doctors || [];
    if (selectedSpecialtyId) {
      docs = docs.filter(d => d.specialtyId === selectedSpecialtyId);
    }
    return docs;
  }, [currentHospital, selectedSpecialtyId]);

  // Navbat olishga o'tish
  const handleBookDoctor = (doc) => {
    const fullDoctor = {
      ...doc,
      fullName: doc.name,
      regionId: currentRegion.id,
      regionName: currentRegion.name,
      hospitalId: currentHospital?.id,
      hospitalName: currentHospital?.name,
      hospitalAddress: currentHospital?.address,
      hospitalPhone: currentHospital?.phone
    };
    setSelectedDoctor(fullDoctor);
    setActiveModal('booking');
  };

  const handleReset = () => {
    setSelectedHospitalId(null);
    setSelectedSpecialtyId(null);
    setHospitalSearch('');
  };

  return (
    <section id="uzbekistan-finder-section" className="py-10 bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Sarlavha */}
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-full text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('finder.uzbekistan_only', "Faqat O'zbekiston — 14 ta Hudud")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('finder.title', "Hudud, Shifoxona va Shifokor Tanlash")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {t('finder.subtitle', "Ketma-ketlik bo'yicha o'zingizga qulay shifoxona va mutaxassisni topib, real vaqtda onlayn navbat oling.")}
          </p>
        </div>

        {/* 4 Bosqichli Stepper / Breadcrumbs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
            
            {/* 1. Hudud */}
            <button 
              onClick={() => { setSelectedHospitalId(null); setSelectedSpecialtyId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                !selectedHospitalId 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>{currentRegion.name}</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />

            {/* 2. Shifoxona */}
            <button 
              onClick={() => setSelectedSpecialtyId(null)}
              disabled={!selectedHospitalId}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                selectedHospitalId && !selectedSpecialtyId 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : selectedHospitalId 
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200' 
                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              <span className="truncate max-w-[150px] sm:max-w-[200px]">
                {currentHospital ? currentHospital.name : t('finder.step_hospital', "Shifoxona tanlang")}
              </span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />

            {/* 3. Mutaxassislik */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
              selectedSpecialtyId 
                ? 'bg-teal-600 text-white shadow-sm' 
                : selectedHospitalId 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200' 
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400'
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
              <span>
                {selectedSpecialtyId 
                  ? (specialties.find(s => s.id === selectedSpecialtyId)?.name || selectedSpecialtyId) 
                  : t('finder.step_specialty', "Mutaxassislik")}
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />

            {/* 4. Shifokorlar */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[10px]">4</span>
              <span>{t('finder.step_doctor', "Shifokor & Navbat")}</span>
            </div>

            {/* Boshidan boshlash tugmasi */}
            {(selectedHospitalId || selectedSpecialtyId) && (
              <button
                onClick={handleReset}
                className="ml-auto text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('finder.reset', "Boshidan")}</span>
              </button>
            )}

          </div>
        </div>

        {/* ── 1. HUDUDNI TANLASH PANELI ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>1. {t('finder.select_region', "Hududni tanlang (14 ta hudud)")}:</span>
            </h3>
            
            {/* Hudud qidiruvi */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('finder.search_region', "Hududni izlash...")}
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {filteredRegions.map((reg) => {
              const isSelected = reg.id === selectedRegionId;
              return (
                <button
                  key={reg.id}
                  onClick={() => {
                    setSelectedRegionId(reg.id);
                    setSelectedHospitalId(null);
                    setSelectedSpecialtyId(null);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-700 shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold truncate leading-tight">{reg.name}</div>
                  <div className={`text-[10px] mt-1.5 flex items-center justify-between ${
                    isSelected ? 'text-teal-100' : 'text-slate-400 dark:text-slate-400'
                  }`}>
                    <span>{reg.hospitalsCount} shifoxona</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. SHIFOXONALAR RO'YXATI ── */}
        {!selectedHospitalId && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>2. {currentRegion.name} shifoxonalari:</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-md hover:border-teal-400 dark:hover:border-teal-500 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1.5 bg-teal-50 dark:bg-teal-950 text-teal-600 rounded-lg">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <ClinicLocationLink
                          hospital={hosp}
                          name={hosp.name}
                          showPin={false}
                          linkClassName="text-sm font-extrabold text-slate-900 dark:text-white leading-snug hover:text-teal-600 dark:hover:text-teal-400"
                        />
                        <a
                          href={getYandexMapUrl(hosp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Yandex Xaritalarda yo'l ko'rish"
                          className="min-h-[44px] inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline select-none active:scale-95 active:opacity-80 cursor-pointer bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 transition-all"
                        >
                          <Navigation className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>Yo'l ko'rsatish</span>
                        </a>
                      </div>
                      {hosp.isSample && (
                        <span className="inline-block px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded border border-amber-200 dark:border-amber-800">
                          NAMUNA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <ClinicLocationLink
                        hospital={hosp}
                        name={hosp.address}
                        iconClassName="w-3.5 h-3.5 text-rose-500 flex-shrink-0"
                        linkClassName="text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600"
                      />
                    </div>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a href={`tel:${hosp.phone.replace(/\s+/g, '')}`} className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
                        {hosp.phone}
                      </a>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {hosp.doctors?.length || 0} nafar shifokor qabulda
                    </span>
                    <button
                      onClick={() => setSelectedHospitalId(hosp.id)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Mutaxassisliklarni ko'rish</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. MUTAXASSISLIKLAR VA SHIFOKORLAR TANLOVI ── */}
        {selectedHospitalId && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Tanlangan shifoxona info paneli */}
            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 className="w-4 h-4 text-teal-700 dark:text-teal-300" />
                  <ClinicLocationLink
                    hospital={currentHospital}
                    name={currentHospital?.name}
                    showPin={false}
                    linkClassName="text-sm font-extrabold text-teal-950 dark:text-teal-100 hover:text-teal-600"
                  />
                  <a
                    href={getYandexMapUrl(currentHospital)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Yandex Xaritalarda yo'l ko'rish"
                    className="min-h-[44px] inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline select-none active:scale-95 active:opacity-80 cursor-pointer bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-teal-300 dark:border-teal-700 transition-all"
                  >
                    <Navigation className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    <span>Yo'l ko'rsatish</span>
                  </a>
                </div>
                <div className="text-xs text-teal-800/80 dark:text-teal-300/80 mt-1 flex items-center gap-3 flex-wrap">
                  <ClinicLocationLink
                    hospital={currentHospital}
                    name={currentHospital?.address}
                    iconClassName="w-3.5 h-3.5 text-teal-600 mr-1 flex-shrink-0"
                    linkClassName="hover:underline"
                  />
                  <span>•</span>
                  <span>Tel: {currentHospital?.phone}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedHospitalId(null)}
                className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Boshqa shifoxona tanlash</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Mutaxassislik filtri */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                3. Mutaxassislik bo'yicha filter:
              </h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedSpecialtyId(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    !selectedSpecialtyId 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Barcha mutaxassisliklar ({currentHospital?.doctors?.length || 0})
                </button>
                {specialties.map(spec => (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpecialtyId(spec.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedSpecialtyId === spec.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {spec.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Shifokorlar kartalari */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                4. Shifokorlar ro'yxati va qabul vaqtlari ({availableDoctors.length} ta mutaxassis):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableDoctors.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'}
                        alt={doc.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {doc.name}
                          </h5>
                          {doc.isSample && (
                            <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[9px] font-bold rounded">
                              NAMUNA
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                          {doc.specialtyName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {doc.experienceYears} yil tajriba • {doc.roomNumber}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Qabul kunlari:</span>
                        </span>
                        <span className="font-bold text-[11px] truncate max-w-[130px]">
                          {Array.isArray(doc.workDays) ? doc.workDays.slice(0, 3).join(', ') + '...' : 'Dush-Juma'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Ish vaqti:</span>
                        </span>
                        <span className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400">
                          {doc.workHours || '09:00 - 17:00'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        Tushlik tanaffusi: {doc.lunchBreak || '13:00 - 14:00'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400">Ko'rik narxi:</div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {doc.price ? Number(doc.price).toLocaleString() + " so'm" : "Bepul"}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBookDoctor(doc)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Navbat Olish</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
