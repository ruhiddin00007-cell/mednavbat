import React from 'react';
import { useApp } from '../../context/AppContext';
import { useDoctorStatus } from '../../hooks/useAvailabilityStatus';
import { findLanguageByCode } from '../../data/languagesConfig';
import { 
  Star, 
  Clock, 
  MapPin, 
  Award, 
  ChevronRight,
  Moon,
  ShieldCheck,
  AlertCircle,
  Clock4,
  Navigation,
  Lock
} from 'lucide-react';
import { ClinicLocationLink } from '../common/ClinicLocationLink';
import { getYandexMapUrl, openYandexMaps } from '../../utils/yandexMaps';
import { sanitizeDoctorLocationForViewer } from '../../services/privacy/locationPrivacyService';

export const DoctorCard = ({ doctor }) => {
  const { t, setSelectedDoctor, setActiveModal, getLocalized, userProfile, appointments = [], isAdminAuthenticated } = useApp();

  const handleOpenDetail = () => {
    setSelectedDoctor(doctor);
    setActiveModal('doctor-detail');
  };

  const handleStartBooking = () => {
    setSelectedDoctor(doctor);
    setActiveModal('booking');
  };

  const localizedSpec = getLocalized(doctor, 'specialtyName') || doctor.specialtyName || doctor.specialty || '';
  const localizedHosp = getLocalized(doctor, 'hospitalName') || doctor.hospitalName || '';
  const localizedSub = getLocalized(doctor, 'subcategory') || doctor.subcategory || '';

  // Maxfiylik va joylashuv sanitizatsiyasi
  const viewer = userProfile || (isAdminAuthenticated ? { role: 'admin' } : null);
  const sanitized = sanitizeDoctorLocationForViewer(doctor, viewer, appointments);

  const isPrivate = doctor.isPrivateDoctor || 
                    doctor.practiceType === 'private_practice' || 
                    doctor.practiceType === 'both' ||
                    Boolean(doctor.privateCabinet);
  const isBoth = doctor.practiceType === 'both' || (Array.isArray(doctor.workplaces) && doctor.workplaces.length > 1);

  // ── Real-time availability status (shifokorning O'Z vaqt zonasi bo'yicha) ──
  const { isOnline, badgeClass, dotClass, nextOnlineText, localTimeStr } = useDoctorStatus(doctor);

  const isDemo = doctor.source === 'DEMO';
  const isVerified = Boolean(doctor.licenseVerified);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
      
      {/* Top Card Body */}
      <div className="p-5 space-y-4">
        
        {/* Doctor Header & Avatar */}
        <div className="flex items-start space-x-4">
          <div className="relative flex-shrink-0">
            <img 
              src={doctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'} 
              alt={doctor.fullName || doctor.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-100 dark:border-teal-900 shadow-sm group-hover:border-teal-400 transition" 
            />
            {/* Real-time Status Badge */}
            <span className={`absolute -bottom-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center space-x-1 transition-all duration-500 ${badgeClass}`}>
              <span className={dotClass} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {localizedSpec.split('(')[0]}
              </span>
              
              {/* Rating (Ochiq Bayes formulasi asosida) */}
              <div 
                className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-200/80 dark:border-amber-800"
                title="Bemorlar baholari va litsenziya koeffitsienti asosidagi ochiq reyting"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="text-xs font-bold">{doctor.rating || 0}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">({doctor.reviewCount || doctor.reviewsCount || 0})</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition line-clamp-1">
                {doctor.fullName || doctor.name}
              </h3>
              {isDemo && (
                <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
                  DEMO
                </span>
              )}
            </div>

            {/* Litsenziya Tasdiqlangan / Tasdiqlanmagan Belgisi */}
            <div className="flex items-center gap-2 mt-1">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Tasdiqlangan litsenziya</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Tasdiqlanmagan</span>
                </span>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <span>{doctor.experienceYears} {t('doctors.years_suffix')} tajriba</span>
              </p>
            </div>
          </div>
        </div>

        {/* Hospital & Regional Location Badge */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 gap-1.5">
            <ClinicLocationLink
              hospital={doctor}
              name={localizedHosp || doctor.hospitalName || 'Klinika'}
              className="min-w-0"
              iconClassName="w-3.5 h-3.5 text-rose-500 mr-1.5 flex-shrink-0"
            />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href={getYandexMapUrl(doctor)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Yandex Xaritalarda yo'l ko'rish"
                className="min-h-[44px] flex items-center select-none text-[10px] font-bold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:underline gap-0.5 cursor-pointer bg-teal-50/80 dark:bg-teal-950/60 px-2 py-1 rounded border border-teal-200/60 dark:border-teal-800/60 active:scale-[0.98] active:opacity-80 transition-all"
              >
                <Navigation className="w-2.5 h-2.5" />
                <span>Yo'l ko'rsatish</span>
              </a>
              {doctor.regionName && (
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800 flex-shrink-0">
                  {doctor.regionName.replace(' viloyati', ' vil.').replace(' Respublikasi', ' Resp.')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('booking.room')} <strong className="text-slate-800 dark:text-slate-200">{doctor.roomNumber || 'Kabinet'}</strong></span>
            {localizedSub && (
              <span className="text-[11px] bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md font-medium text-slate-700 dark:text-slate-300">
                {localizedSub}
              </span>
            )}
          </div>
        </div>

        {/* Shifokor qabul tillari (spokenLanguages) */}
        {Array.isArray(doctor.spokenLanguages) && doctor.spokenLanguages.length > 0 && (
          <div className="flex items-center gap-1.5 px-1 flex-wrap pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
              <span>{t('doctors.spoken_languages', 'Qabul tillari')}:</span>
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {doctor.spokenLanguages.map(lCode => {
                const lObj = findLanguageByCode(lCode);
                return (
                  <span 
                    key={lCode} 
                    title={lObj ? `${lObj.nameNative} (${lObj.nameEn})` : lCode}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50/60 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60"
                  >
                    <span>{lObj ? lObj.flag : '🌐'}</span>
                    <span>{lObj ? lObj.nameNative.split(' ')[0] : lCode}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Shifokorning o'z vaqt zonasi va vaqti */}
        {doctor.timeZone && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">

            <span className="flex items-center gap-1 font-mono text-[10px]">
              <Clock4 className="w-3 h-3 text-slate-400" />
              <span>Zona: {doctor.timeZone.split('/').pop().replace('_', ' ')}</span>
            </span>
            {localTimeStr && (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Mahalliy vaqt: {localTimeStr}
              </span>
            )}
          </div>
        )}

        {/* Available slots preview */}
        {Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 font-medium flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('doctor_detail.available_slots')}:</span>
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">{doctor.availableSlots.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {doctor.availableSlots.slice(0, 4).map((slot, idx) => (
                <span 
                  key={idx} 
                  className="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg"
                >
                  {slot}
                </span>
              ))}
              {doctor.availableSlots.length > 4 && (
                <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">
                  +{doctor.availableSlots.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Real-vaqt indikatori va "Yana X soatdan keyin online bo'ladi" matni */}
      {!isOnline && nextOnlineText && (
        <div className="px-5 pb-0">
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] font-medium px-3 py-2 rounded-xl">
            <Moon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>{nextOnlineText}</span>
          </div>
        </div>
      )}

      {/* Card Footer Price & Buttons */}
      <div className="p-5 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">{t('doctors.consultation_fee')}</p>
          <p className="text-base font-extrabold text-teal-800 dark:text-teal-300">
            {(doctor.price || 150000).toLocaleString()} <span className="text-xs font-bold">UZS</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenDetail}
            className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {t('doctors.btn_detail')}
          </button>
          <button
            onClick={handleStartBooking}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-teal-600/20 transition flex items-center space-x-1 cursor-pointer"
          >
            <span>{t('doctors.btn_book')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
