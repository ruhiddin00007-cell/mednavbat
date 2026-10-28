import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import useAvailabilityStatus, { useDoctorStatus } from '../../hooks/useAvailabilityStatus';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Award,
  ChevronRight,
  Frown,
  GraduationCap,
  CalendarDays,
  PhoneCall,
  Info,
  X,
  Moon,
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
  Navigation
} from 'lucide-react';
import { ClinicLocationLink } from '../common/ClinicLocationLink';
import { getYandexMapUrl, openYandexMaps } from '../../utils/yandexMaps';

const ICON_MAP = {
  Stethoscope, Activity, Heart, Brain, Sparkles,
  UserCheck, Baby, Sun, Eye, User, ShieldAlert,
  Thermometer, Droplet, Droplets, Smile
};

// ─── Doctor Detail Panel (slide-in style) ───────────────────────────────────
const DoctorDetailPanel = ({ doctor, onClose, onBook, t, getLocalized, doctorStatus }) => {
  if (!doctor) return null;

  const localizedSpec  = getLocalized(doctor, 'specialtyName');
  const localizedHosp  = getLocalized(doctor, 'hospitalName');
  const localizedBio   = getLocalized(doctor, 'bio');
  const localizedEdu   = getLocalized(doctor, 'education');

  const DAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  const ALL_DAYS   = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-y-auto max-h-[92vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header image strip */}
        <div className="relative h-40 bg-gradient-to-br from-teal-600 to-emerald-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <img
                src={doctor.avatar}
                alt={doctor.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
              />
              {/* Real-time status badge */}
              {doctorStatus && (
                <span className={`absolute -bottom-1.5 -right-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white flex items-center gap-1 ${doctorStatus.badgeClass}`}>
                  <span className={doctorStatus.dotClass} />
                  {doctorStatus.statusLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="pt-16 pb-6 px-6 space-y-5">
          {/* Name & Specialty */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{doctor.name}</h2>
            <p className="text-sm text-teal-700 font-semibold mt-0.5">{localizedSpec}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                {doctor.rating} ({doctor.reviewsCount} {t('doctor_detail.reviews')})
              </span>
              <span className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg font-bold">
                <Award className="w-3.5 h-3.5" />
                {doctor.experienceYears} {t('doctors.years_suffix')} {t('doctor_detail.experience')}
              </span>
              <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {doctor.roomNumber}
              </span>
              {/* Status pill */}
              {doctorStatus && (
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold ${doctorStatus.pillClass}`}>
                  <span className={doctorStatus.isOnline ? 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse' : 'w-2 h-2 rounded-full bg-slate-400'} />
                  {doctorStatus.statusLabel}
                </span>
              )}
            </div>
          </div>

          {/* Hospital */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-teal-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <ClinicLocationLink
                  hospital={doctor}
                  name={localizedHosp || doctor.hospitalName}
                  showPin={false}
                  linkClassName="text-xs font-bold text-slate-800 hover:text-teal-600"
                />
                <a
                  href={getYandexMapUrl(doctor)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Yandex Xaritalarda yo'l ko'rish"
                  className="min-h-[44px] inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 active:scale-95 active:opacity-80 select-none bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 cursor-pointer flex-shrink-0 transition-all"
                >
                  <Navigation className="w-3 h-3 text-teal-600" />
                  <span>Yo'l ko'rsatish</span>
                </a>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{doctor.roomNumber}</p>
            </div>
          </div>

          {/* Bio */}
          {localizedBio && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-bold text-slate-800">{t('doctor_detail.about')}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-teal-50/60 p-3 rounded-xl border border-teal-100">
                {localizedBio}
              </p>
            </div>
          )}

          {/* Education */}
          {localizedEdu && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">{t('doctor_detail.education')}</span>
              </div>
              <p className="text-xs text-slate-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                {localizedEdu}
              </p>
            </div>
          )}

          {/* Work Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-800">{t('doctor_detail.available_slots')}</span>
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {ALL_DAYS.map((day, idx) => {
                const isWorking = doctor.workScheduleDays && doctor.workScheduleDays.includes(day);
                return (
                  <div
                    key={day}
                    className={`flex flex-col items-center rounded-xl py-2 text-[10px] font-bold transition ${
                      isWorking
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {DAYS_SHORT[idx]}
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-emerald-300' : 'bg-slate-300'}`} />
                  </div>
                );
              })}
            </div>
            {/* Time slots */}
            {doctor.availableSlots && doctor.availableSlots.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {doctor.availableSlots.map((slot, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    {slot}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price & CTA */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-5 text-white flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">{t('doctors.consultation_fee')}</p>
              <p className="text-2xl font-extrabold">
                {doctor.price?.toLocaleString()} <span className="text-sm">UZS</span>
              </p>
            </div>
            <button
              onClick={() => onBook(doctor)}
              className="bg-white text-teal-700 font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg hover:bg-teal-50 active:scale-95 transition flex items-center gap-2"
            >
              {t('doctors.btn_book')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Single Doctor Card (in the specialty view) ──────────────────────────────
const SpecialtyDoctorCard = ({ doctor, onDetail, onBook, t, getLocalized }) => {
  const localizedSpec = getLocalized(doctor, 'specialtyName');
  const localizedHosp = getLocalized(doctor, 'hospitalName');
  const nearestSlot   = doctor.availableSlots?.[0];

  // ── Real-time availability status ──────────────────────────────────────────
  const { isOnline, badgeClass, dotClass, offlineNote } = useDoctorStatus(doctor);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
      <div className="p-5 flex gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-teal-100 group-hover:border-teal-400 transition"
          />
          {/* Real-time Status Badge */}
          <span className={`absolute bottom-0 right-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white flex items-center gap-0.5 transition-all duration-500 ${badgeClass}`}>
            <span className={dotClass} />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-slate-900 text-base truncate leading-tight group-hover:text-teal-700 transition">
              {doctor.name}
            </h3>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg flex-shrink-0">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span className="text-xs font-bold">{doctor.rating}</span>
            </div>
          </div>

          <p className="text-xs text-teal-700 font-semibold">{localizedSpec}</p>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-teal-500" />
              {doctor.experienceYears} {t('doctors.years_suffix')}
            </span>
            <ClinicLocationLink
              hospital={doctor}
              name={localizedHosp || doctor.hospitalName}
              iconClassName="w-3.5 h-3.5 text-rose-400 flex-shrink-0"
              linkClassName="truncate text-xs text-slate-500"
            />
          </div>

          {/* Nearest slot + price */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {nearestSlot && (
              <span className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold">
                <Clock className="w-3 h-3" />
                Bugun: {nearestSlot}
              </span>
            )}
            {doctor.price && (
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-semibold">
                {doctor.price.toLocaleString()} UZS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Offline Note — faqat tungi offline holatda */}
      {!isOnline && offlineNote && (
        <div className="px-5 pb-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium px-3 py-2 rounded-xl">
            <Moon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>{offlineNote}</span>
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 flex gap-2">
        <button
          onClick={() => onDetail(doctor)}
          className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5" />
          {t('doctors.btn_detail')}
        </button>
        <button
          onClick={() => onBook(doctor)}
          className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5"
        >
          {t('doctors.btn_book')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Exported Component ─────────────────────────────────────────────────
export const SpecialtyDoctorsView = ({ specialtyId, onBack }) => {
  const { t, doctors, specialties, setSelectedDoctor, setActiveModal, getLocalized } = useApp();

  const [detailDoctor, setDetailDoctor] = useState(null);
  const { getDoctorStatus } = useAvailabilityStatus();

  const specialty = specialties.find(s => s.id === specialtyId);
  const IconComponent = specialty ? (ICON_MAP[specialty.icon] || Stethoscope) : Stethoscope;

  const filteredDoctors = useMemo(() => {
    return doctors
      .filter(d => d.specialtyId === specialtyId)
      .sort((a, b) => b.rating - a.rating);
  }, [doctors, specialtyId]);

  const handleBook = (doctor) => {
    setSelectedDoctor(doctor);
    setActiveModal('booking');
    setDetailDoctor(null);
  };

  const specName = specialty ? getLocalized(specialty, 'name') : '';
  const specDesc = specialty ? getLocalized(specialty, 'description') : '';

  return (
    <>
      <section className="min-h-screen bg-slate-50 pb-16">
        {/* Top Banner */}
        <div className="relative bg-gradient-to-br from-teal-700 to-emerald-600 pt-6 pb-16 sm:pb-20 overflow-hidden">
          {/* decorative orbs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 pointer-events-none" />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold mb-6 transition group"
            >
              <span className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition">
                <ArrowLeft className="w-4 h-4" />
              </span>
              Mutaxassisliklar ro'yxatiga qaytish
            </button>

            {/* Specialty Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {specName.split('(')[0]}
                </h1>
                {specDesc && (
                  <p className="text-sm text-white/85 mt-2 leading-relaxed max-w-xl border-l-2 border-white/30 pl-3">
                    {specDesc}
                  </p>
                )}
              </div>
            </div>

            {/* Stats pill */}
            <div className="mt-5 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-bold">
              <Stethoscope className="w-4 h-4" />
              {filteredDoctors.length} ta shifokor mavjud
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10">

          {filteredDoctors.length > 0 ? (
            <div className="space-y-4">
              {filteredDoctors.map(doctor => (
                <SpecialtyDoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onDetail={setDetailDoctor}
                  onBook={handleBook}
                  t={t}
                  getLocalized={getLocalized}
                />
              ))}
            </div>
          ) : (
            // Empty state
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center mt-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Frown className="w-9 h-9 text-slate-400" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Hozircha bu yo'nalishda shifokorlar mavjud emas
              </h3>
              <p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs mx-auto">
                <strong>{specName}</strong> yo'nalishi bo'yicha hali birorta shifokor tizimga qo'shilmagan.
              </p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-sm font-bold transition shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                Boshqa mutaxassislikni tanlash
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Doctor Detail Slide Panel */}
      {detailDoctor && (
        <DoctorDetailPanel
          doctor={detailDoctor}
          onClose={() => setDetailDoctor(null)}
          onBook={handleBook}
          t={t}
          getLocalized={getLocalized}
          doctorStatus={getDoctorStatus(detailDoctor)}
        />
      )}
    </>
  );
};
