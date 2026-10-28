import React from 'react';
import { useApp } from '../../context/AppContext';
import { useDoctorStatus } from '../../hooks/useAvailabilityStatus';
import { DoctorReviewsBlock } from '../doctor/DoctorReviewsBlock';
import { 
  X, 
  Star, 
  Award, 
  GraduationCap, 
  ChevronRight, 
  Building2,
  Moon,
  Languages,
  Navigation
} from 'lucide-react';
import { findLanguageByCode } from '../../data/languagesConfig';
import { ClinicLocationLink } from '../common/ClinicLocationLink';
import { getYandexMapUrl, openYandexMaps } from '../../utils/yandexMaps';


export const DoctorDetailModal = () => {
  const { t, activeModal, setActiveModal, selectedDoctor, getLocalized } = useApp();

  if (activeModal !== 'doctor-detail' || !selectedDoctor) return null;

  const localizedSpec = getLocalized(selectedDoctor, 'specialtyName');
  const localizedHosp = getLocalized(selectedDoctor, 'hospitalName');
  const localizedBio = getLocalized(selectedDoctor, 'bio');
  const localizedEdu = getLocalized(selectedDoctor, 'education');

  // ── Real-time status ─────────────────────────────────────────────────────────────
  const { isOnline, statusLabel, badgeClass, dotClass, offlineNote } = useDoctorStatus(selectedDoctor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8 relative">
        
        {/* Modal Top Header Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-6 relative">
          <button
            onClick={() => setActiveModal(null)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
            <img 
              src={selectedDoctor.avatar} 
              alt={selectedDoctor.name} 
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg flex-shrink-0"
            />
            
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-xs font-bold border border-teal-400/30">
                  {localizedSpec}
                </div>
                {/* Real-time status pill */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                  <span className={dotClass} />
                  {statusLabel}
                </span>
              </div>

              <h2 className="text-2xl font-bold">{selectedDoctor.name}</h2>

              <p className="text-xs text-teal-100/90 flex items-center justify-center sm:justify-start space-x-2">
                <Award className="w-3.5 h-3.5 text-teal-300" />
                <span>{t('doctor_detail.experience')}: <strong>{selectedDoctor.experienceYears} {t('doctors.years_suffix')}</strong></span>
              </p>

              <div className="flex items-center justify-center sm:justify-start space-x-3 pt-1">
                <div className="flex items-center space-x-1 bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-amber-400/30">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{selectedDoctor.rating} {t('doctor_detail.rating')}</span>
                </div>
                <span className="text-xs text-slate-300">({selectedDoctor.reviewsCount} {t('doctor_detail.reviews')})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Bio */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('doctor_detail.about')}</h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {localizedBio}
            </p>
          </div>

          {/* Hospital & Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-800">{t('booking.hospital')}</h5>
                  <a
                    href={getYandexMapUrl(selectedDoctor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Yandex Xaritalarda yo'l ko'rish"
                    className="min-h-[44px] flex items-center select-none text-[10px] font-bold text-teal-700 hover:text-teal-900 hover:underline gap-1 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 active:scale-[0.98] active:opacity-80 transition-all cursor-pointer"
                  >
                    <Navigation className="w-2.5 h-2.5" />
                    <span>Yo'l ko'rsatish</span>
                  </a>
                </div>
                <div className="mt-1">
                  <ClinicLocationLink
                    hospital={selectedDoctor}
                    name={localizedHosp || selectedDoctor.hospitalName}
                    iconClassName="w-3.5 h-3.5 text-rose-500 mr-1 flex-shrink-0"
                    linkClassName="text-xs text-slate-700 font-bold"
                  />
                </div>
                <p className="text-[11px] text-teal-700 font-semibold mt-1">{t('booking.room')} {selectedDoctor.roomNumber}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start space-x-3">
              <GraduationCap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-slate-800">{t('doctor_detail.education')}</h5>
                <p className="text-xs text-slate-600 font-medium">{localizedEdu}</p>
              </div>
            </div>
          </div>

          {/* Schedule days */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('doctors.working_days')}</h4>
            <div className="flex flex-wrap gap-2">
              {selectedDoctor.workScheduleDays.map((day) => (
                <span key={day} className="px-3 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                  ✓ {day}
                </span>
              ))}
            </div>
          </div>

          {/* Qaysi tillarda qabul qiladi */}
          {Array.isArray(selectedDoctor.spokenLanguages) && selectedDoctor.spokenLanguages.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Languages className="w-4 h-4 text-teal-600" />
                <span>{t('doctor_detail.spoken_languages', 'Qabul va muloqot tillari')}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedDoctor.spokenLanguages.map(lCode => {
                  const lObj = findLanguageByCode(lCode);
                  return (
                    <span 
                      key={lCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 shadow-2xs"
                    >
                      <span className="text-base leading-none">{lObj ? lObj.flag : '🌐'}</span>
                      <span>{lObj ? lObj.nameNative : lCode}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({lObj ? lObj.nameEn : lCode})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}


          {/* Bemorlar baholari va sharhlari */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Bemorlar baholari va sharhlari</span>
            </h4>
            <DoctorReviewsBlock doctorId={selectedDoctor.id} isDoctorPanel={false} />
          </div>

          {/* Offline note */}
          {!isOnline && offlineNote && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-4 py-3 rounded-2xl">
              <Moon className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <span>{offlineNote}</span>
            </div>
          )}

        </div>

        {/* Modal Bottom Sticky Bar */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">{t('doctors.consultation_fee')}</span>
            <span className="text-xl font-extrabold text-teal-800">
              {selectedDoctor.price.toLocaleString()} <span className="text-xs font-bold">UZS</span>
            </span>
          </div>

          <button
            onClick={() => setActiveModal('booking')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-teal-600/30 transition flex items-center space-x-2"
          >
            <span>{t('doctor_detail.book_now')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
