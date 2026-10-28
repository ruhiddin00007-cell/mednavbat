import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  QrCode,
  Smartphone,
  Sparkles,
  AlertTriangle,
  Loader2,
  Building2,
  MapPin,
  Coffee,
  Navigation
} from 'lucide-react';
import { ClinicLocationLink } from '../common/ClinicLocationLink';
import { getYandexMapUrl, openYandexMaps } from '../../utils/yandexMaps';
import { STANDARD_TIME_SLOTS, LUNCH_BREAK } from '../../data/medicalDataLoader';
import { fetchOccupiedSlots, bookNewAppointment, subscribeToSlotChanges } from '../../services/appointmentService';
import { formatUzbekPhone, isValidUzbekPhone } from '../../utils/phoneFormatter';

export const BookingModal = () => {
  const { t } = useTranslation();
  const { 
    activeModal, 
    setActiveModal, 
    selectedDoctor, 
    userProfile, 
    isAuthenticated,
    getLocalized,
    showToast,
    refreshAppointments
  } = useApp();

  const [step, setStep] = useState(1);

  // Sana - bugundan boshlab
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(() => {
    return todayStr;
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [patientName, setPatientName] = useState(() => userProfile?.name || '');
  const [patientPhone, setPatientPhone] = useState(() => {
    return userProfile?.phone ? formatUzbekPhone(userProfile.phone) : '+998 ';
  });
  const [symptoms, setSymptoms] = useState('');
  
  // Real-time band bo'lgan slotlar
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Click');
  const [createdTicket, setCreatedTicket] = useState(null);

  // Band slotlarni server/bazadan yuklash
  useEffect(() => {
    if (!selectedDoctor?.id || !selectedDate || activeModal !== 'booking') return;

    let isMounted = true;
    setIsLoadingSlots(true);
    setBookingError('');

    fetchOccupiedSlots(selectedDoctor.id, selectedDate)
      .then((slots) => {
        if (isMounted) {
          setOccupiedSlots(slots);
          // Agar tanlangan slot band bo'lib qolgan bo'lsa, tanlovni tozalash
          if (slots.includes(selectedTimeSlot)) {
            setSelectedTimeSlot('');
          }
        }
      })
      .catch((err) => {
        console.warn('Slotlarni olishda xatolik:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    // Realtime slot yangilanishlarini tinglash
    const unsubscribe = subscribeToSlotChanges(() => {
      if (isMounted) {
        fetchOccupiedSlots(selectedDoctor.id, selectedDate).then(setOccupiedSlots);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedDoctor?.id, selectedDate, activeModal]);

  if (activeModal !== 'booking' || !selectedDoctor) return null;

  if (!isAuthenticated) {
    setActiveModal('auth');
    showToast("Navbat olish uchun iltimos, avval telefon raqamingiz orqali tizimga kiring!", "warning", 4500);
    return null;
  }

  const localizedSpec = getLocalized ? getLocalized(selectedDoctor, 'specialtyName') : (selectedDoctor.specialtyName || selectedDoctor.specialty);
  const localizedHosp = getLocalized ? getLocalized(selectedDoctor, 'hospitalName') : selectedDoctor.hospitalName;

  // Bugungi kundagi o'tib ketgan vaqtlarni aniqlash
  const isSelectedDateToday = selectedDate === todayStr;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const isSlotInPast = (slot) => {
    if (!isSelectedDateToday) return false;
    const [sHour, sMin] = slot.split(':').map(Number);
    if (sHour < currentHour) return true;
    if (sHour === currentHour && sMin <= currentMinute) return true;
    return false;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatUzbekPhone(e.target.value);
    setPatientPhone(formatted);
  };

  const handleFinalBooking = async () => {
    if (!patientName.trim()) {
      showToast(t('booking.err_name', "Iltimos, ismingizni kiriting!"), 'error');
      return;
    }

    if (!isValidUzbekPhone(patientPhone)) {
      showToast(t('booking.err_phone', "Telefon raqami faqat +998 formatida bo'lishi kerak! (+998 XX XXX XX XX)"), 'error');
      return;
    }

    setIsSubmitting(true);
    setBookingError('');

    try {
      const res = await bookNewAppointment({
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialtyName: localizedSpec,
        hospitalName: localizedHosp || selectedDoctor.hospitalName || "Toshkent Tibbiyot Markazi",
        hospitalAddress: selectedDoctor.hospitalAddress || "",
        roomNumber: selectedDoctor.roomNumber || "101-xona",
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        symptoms: symptoms.trim() || 'Konsultatsiya',
        paymentMethod,
        price: selectedDoctor.price || 0
      });

      if (!res.success) {
        if (res.isOccupied) {
          setBookingError("Kechirasiz, ushbu vaqt hozirgina boshqa bemor tomonidan band qilindi. Iltimos, boshqa vaqtni tanlang.");
          showToast("Ushbu vaqt band! Iltimos, boshqa vaqtni tanlang.", 'error');
          // Slotlarni qayta yangilash
          const updated = await fetchOccupiedSlots(selectedDoctor.id, selectedDate);
          setOccupiedSlots(updated);
          setSelectedTimeSlot('');
          setStep(1);
          setIsSubmitting(false);
          return;
        }
        throw new Error(res.error || "Navbat yozishda xatolik yuz berdi");
      }

      setCreatedTicket(res.appointment);
      if (typeof refreshAppointments === 'function') {
        refreshAppointments();
      }
      setStep(4);

      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 }
        });
      } catch (_e) {}

    } catch (err) {
      setBookingError(err.message || "Xatolik yuz berdi");
      showToast(err.message || "Xatolik", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveModal(null);
    setStep(1);
    setSelectedTimeSlot('');
    setCreatedTicket(null);
    setBookingError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-6 relative transition-colors">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">{t('booking.title', "Onlayn Navbat Olish")}</h3>
              <p className="text-xs text-teal-300 font-medium truncate">
                {selectedDoctor.name} • {localizedSpec}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shifoxona ma'lumoti banneri */}
        <div className="bg-teal-50 dark:bg-teal-950/40 px-6 py-2.5 border-b border-teal-100 dark:border-teal-900 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ClinicLocationLink
              hospital={selectedDoctor}
              name={localizedHosp || selectedDoctor.hospitalName || "Shifoxona"}
              iconClassName="w-3.5 h-3.5 text-teal-600 flex-shrink-0"
              linkClassName="font-bold text-teal-900 dark:text-teal-200 hover:text-teal-600 truncate"
            />
            <a
              href={getYandexMapUrl(selectedDoctor)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Yandex Xaritalarda yo'l ko'rish"
              className="min-h-[44px] inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline select-none active:scale-95 active:opacity-80 cursor-pointer bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-700 flex-shrink-0 transition-all"
            >
              <Navigation className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>Yo'l ko'rsatish</span>
            </a>
          </div>
          {selectedDoctor.roomNumber && (
            <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold text-[11px] text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
              {selectedDoctor.roomNumber}
            </span>
          )}
        </div>

        {/* Step Tracker */}
        {step < 4 && (
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className={step >= 1 ? 'text-teal-600 dark:text-teal-400 font-extrabold' : ''}>1. Sana & Vaqt</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={step >= 2 ? 'text-teal-600 dark:text-teal-400 font-extrabold' : ''}>2. Bemor Ma'lumotlari</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={step >= 3 ? 'text-teal-600 dark:text-teal-400 font-extrabold' : ''}>3. To'lov</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-teal-600 h-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Xatolik xabari bo'lsa */}
        {bookingError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* ── STEP 1: Sana & 30-daqiqalik vaqt slotlari ── */}
        {step === 1 && (
          <div className="p-6 space-y-5 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                1. Qabul kunini tanlang (O'tib ketgan sanalarni tanlab bo'lmaydi):
              </label>
              <input
                type="date"
                value={selectedDate}
                min={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>2. Vaqt slotini tanlang (09:00 - 17:00, har 30 daqiqada):</span>
                </label>
                {isLoadingSlots && (
                  <span className="text-[11px] text-teal-600 flex items-center gap-1 font-bold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Yuklanmoqda...</span>
                  </span>
                )}
              </div>

              {/* Tushlik tanaffusi ko'rsatgichi */}
              <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>Tushlik tanaffusi: {LUNCH_BREAK} (Slotlar mavjud emas)</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {STANDARD_TIME_SLOTS.map((slot) => {
                  const isOccupied = occupiedSlots.includes(slot);
                  const isPast = isSlotInPast(slot);
                  const isSelected = selectedTimeSlot === slot;
                  const isDisabled = isOccupied || isPast;

                  return (
                    <button
                      key={slot}
                      disabled={isDisabled}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`p-2.5 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center border relative ${
                        isOccupied 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-400 border-rose-200 dark:border-rose-900 cursor-not-allowed line-through'
                          : isPast
                            ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                            : isSelected 
                              ? 'bg-teal-600 text-white border-teal-700 shadow-md scale-105'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <Clock className="w-3 h-3 mb-0.5" />
                      <span>{slot}</span>
                      {isOccupied && (
                        <span className="text-[9px] uppercase font-black text-rose-600 dark:text-rose-400 mt-0.5">
                          BAND
                        </span>
                      )}
                      {isPast && !isOccupied && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                          O'tgan
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Bo'sh</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                  <span>Band (Yozilgan)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  <span>O'tib ketgan</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
              <button
                disabled={!selectedTimeSlot}
                onClick={() => setStep(2)}
                className={`px-6 py-3 rounded-2xl text-xs font-extrabold transition shadow-md flex items-center space-x-2 ${
                  selectedTimeSlot 
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-95' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Davom etish</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Bemor ma'lumotlari (Faqat +998) ── */}
        {step === 2 && (
          <div className="p-6 space-y-5 animate-fade-in">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Bemor ma'lumotlarini kiritish:
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bemorning to'liq ismi (F.I.SH) *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Aziz Rahimov"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Telefon raqami (Faqat +998 O'zbekiston formati) *:</span>
                  <span className="text-[10px] text-teal-600 font-mono font-bold">+998 XX XXX XX XX</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  value={patientPhone}
                  onChange={handlePhoneChange}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-teal-500 font-mono tracking-wide"
                />
                {!isValidUzbekPhone(patientPhone) && patientPhone.length > 5 && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    Telefon raqamini to'liq kiriting: +998 (XX) XXX-XX-XX
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Shikoyat yoki qabul maqsadi (ixtiyoriy):
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Masalan: Tomoq og'rig'i, umumiy profilaktik ko'rik..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-teal-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Orqaga
              </button>

              <button
                disabled={!patientName.trim() || !isValidUzbekPhone(patientPhone)}
                onClick={() => setStep(3)}
                className={`px-6 py-3 rounded-2xl text-xs font-extrabold shadow-md flex items-center space-x-2 transition ${
                  patientName.trim() && isValidUzbekPhone(patientPhone)
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>To'lovga o'tish</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: To'lov turi va Tasdiqlash ── */}
        {step === 3 && (
          <div className="p-6 space-y-5 animate-fade-in">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                Navbatni tasdiqlash va to'lov usuli:
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Qabul narxi: <strong className="text-teal-700 dark:text-teal-400 text-sm">{selectedDoctor.price ? Number(selectedDoctor.price).toLocaleString() + " UZS" : "Bepul"}</strong>
              </p>
            </div>

            {/* Qisqacha rezyume kartasi */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Shifokor:</span>
                <strong className="text-slate-900 dark:text-white">{selectedDoctor.name}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Shifoxona:</span>
                <div className="flex items-center gap-1.5">
                  <ClinicLocationLink
                    hospital={selectedDoctor}
                    name={localizedHosp || selectedDoctor.hospitalName}
                    linkClassName="font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-600"
                    iconClassName="w-3.5 h-3.5 text-rose-500 mr-1 flex-shrink-0"
                  />
                  <a
                    href={getYandexMapUrl(selectedDoctor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Yandex Xaritalarda yo'l ko'rish"
                    className="min-h-[44px] inline-flex items-center text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline select-none active:opacity-80 cursor-pointer px-2 py-1"
                  >
                    (Yo'l ko'rish)
                  </a>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sana va vaqt:</span>
                <strong className="text-teal-600 dark:text-teal-400">{selectedDate} — {selectedTimeSlot}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bemor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{patientName} ({patientPhone})</span>
              </div>
            </div>

            {/* To'lov usullari */}
            <div className="space-y-2.5">
              <div 
                onClick={() => setPaymentMethod('Kassada')}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'Kassada' ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    KASSA
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Shifoxona kassasida to'lash</h5>
                    <p className="text-[10px] text-slate-500">Qabulga kelganda kassa orqali naqd yoki karta bilan</p>
                  </div>
                </div>
                {paymentMethod === 'Kassada' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>

              <div 
                onClick={() => setPaymentMethod('Click')}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'Click' ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 shadow-xs' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500 text-white font-black flex items-center justify-center text-xs">
                    CLICK
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Click orqali to'lov</h5>
                    <p className="text-[10px] text-slate-500">Onlayn tezkor to'lov</p>
                  </div>
                </div>
                {paymentMethod === 'Click' && <CheckCircle2 className="w-5 h-5 text-cyan-600" />}
              </div>

              <div 
                onClick={() => setPaymentMethod('Payme')}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'Payme' ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 shadow-xs' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500 text-white font-black flex items-center justify-center text-xs">
                    PAYME
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Payme orqali to'lov</h5>
                    <p className="text-[10px] text-slate-500">Onlayn tezkor to'lov</p>
                  </div>
                </div>
                {paymentMethod === 'Payme' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={isSubmitting}
                onClick={() => setStep(2)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Orqaga
              </button>

              <button
                disabled={isSubmitting}
                onClick={handleFinalBooking}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Band qilinmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Navbatni Tasdiqlash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Elektron Chipta ── */}
        {step === 4 && createdTicket && (
          <div className="p-6 space-y-5 text-center animate-fade-in">
            
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Navbatingiz Muvaffaqiyatli Tasdiqlandi!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Siz uchun shifokor qabulida vaqt band qilindi. Quyidagi chiptani saqlab oling:
              </p>
            </div>

            {/* Chipta kartasi */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-3xl border-2 border-dashed border-teal-400 dark:border-teal-600 text-left space-y-3.5 relative overflow-hidden shadow-inner">
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                    Elektron Navbat Raqami
                  </span>
                  <span className="text-xl font-black text-teal-800 dark:text-teal-300 tracking-wider font-mono">
                    {createdTicket.ticketCode}
                  </span>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-900 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Shifokor:</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-bold">{createdTicket.doctorName}</strong>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 block">{createdTicket.specialtyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sana va Vaqt:</span>
                  <strong className="text-teal-700 dark:text-teal-300 font-bold block">{createdTicket.date}</strong>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{createdTicket.timeSlot}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Shifoxona & Xona:</span>
                  <div className="flex items-center gap-1">
                    <ClinicLocationLink
                      hospital={selectedDoctor || { name: createdTicket.hospitalName }}
                      name={createdTicket.hospitalName}
                      linkClassName="text-slate-800 dark:text-slate-200 font-semibold truncate hover:text-teal-600"
                      iconClassName="w-3 h-3 text-rose-500 mr-1 flex-shrink-0"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-[11px] text-slate-500 font-mono">{selectedDoctor?.roomNumber || '101-xona'}</span>
                    <a
                      href={getYandexMapUrl(selectedDoctor || { name: createdTicket.hospitalName })}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Yandex Xaritalarda yo'l ko'rish"
                      className="min-h-[44px] inline-flex items-center text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline select-none active:opacity-80 cursor-pointer px-2 py-1"
                    >
                      (Yo'l ko'rish)
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Bemor:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold block">{createdTicket.patientName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{createdTicket.patientPhone}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">To'lov holati:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {paymentMethod === 'Kassada' ? "Kassada to'lanadi" : `Onlayn (${paymentMethod})`}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={handleClose}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition shadow-md active:scale-95"
              >
                Mening Navbatlarim Ro'yxatiga O'tish
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
