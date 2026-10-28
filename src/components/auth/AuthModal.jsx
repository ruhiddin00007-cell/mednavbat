/**
 * MedNavbat — Bemor Identifikatsiyasi va Autentifikatsiya Modali
 * ──────────────────────────────────────────────────────────
 * Qoidalar va xususiyatlar:
 *  1. Faqat Bemorlar uchun: Telefon raqami (+998) va SMS orqali 6 xonali bir martalik kod (Eskiz.uz).
 *  2. Sinov rejimida tasdiqlash kodi brauzer konsoliga chiqadi (SMS puli ketmaydi).
 *  3. Kod noto'g'ri kiritilsa: 5 martadan keyin raqam 15 daqiqaga vaqtincha bloklanadi.
 *  4. Birinchi marta kirganda: Ism, Familiya, Tug'ilgan sana va Majburiy rozilik.
 *  5. Shifokor va Admin yorliqlari umumiy oynada ko'rinmaydi (alohida himoyalangan manzillarga ajratilgan).
 *  6. Audit jurnaliga muvaffaqiyatli va muvaffaqiyatsiz urinishlar qayd etiladi.
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  User, 
  ShieldCheck, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  RefreshCw, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  sendOtpToUser, 
  verifyUserOtp, 
  validateUzbekPhoneNumber,
  checkPhoneBlockStatus 
} from '../../services/auth/otp.service.js';
import { logAuditEvent } from '../../services/auditLogService.js';

export const AuthModal = () => {
  const { 
    activeModal, 
    setActiveModal, 
    registerPatient, 
    showToast,
    patients
  } = useApp();

  // Step: 1 = Telefon kiritish, 2 = 6 xonali kod, 3 = Yangi bemor ma'lumotlari (Ism, Familiya, Sana, Rozilik)
  const [otpStep, setOtpStep] = useState(1);
  const [phone, setPhone] = useState('+998 ');
  const [otpCode, setOtpCode] = useState('');
  const [devTestCode, setDevTestCode] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMinutes, setBlockedMinutes] = useState(0);

  // Yangi bemor ma'lumotlari (Step 3)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // Taymer sanash (60 soniya qayta yuborish)
  useEffect(() => {
    let interval;
    if (timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds]);

  // Telefon raqami formatlash (+998 XX XXX XX XX)
  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) {
      val = '+998 ';
    }
    const digitsOnly = val.replace(/\D/g, '').substring(0, 12);
    let formatted = '+998 ';
    if (digitsOnly.length > 3) {
      const rest = digitsOnly.substring(3);
      if (rest.length <= 2) {
        formatted += rest;
      } else if (rest.length <= 5) {
        formatted += `${rest.substring(0, 2)} ${rest.substring(2)}`;
      } else if (rest.length <= 7) {
        formatted += `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
      } else {
        formatted += `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5, 7)} ${rest.substring(7, 9)}`;
      }
    }
    setPhone(formatted);
    setErrorMsg('');

    // Bloklanganlikni tekshirish
    const blockCheck = checkPhoneBlockStatus(val);
    if (blockCheck.isBlocked) {
      setIsBlocked(true);
      setBlockedMinutes(blockCheck.remainingMinutes);
      setErrorMsg(blockCheck.error);
    } else {
      setIsBlocked(false);
    }
  };

  // 1. SMS KOD YUBORISH (Eskiz.uz / Test)
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    const validation = validateUzbekPhoneNumber(phone);
    if (!validation.isValid) {
      setErrorMsg(validation.error);
      return;
    }

    // Bloklanganlik tekshiruvi
    const blockCheck = checkPhoneBlockStatus(phone);
    if (blockCheck.isBlocked) {
      setIsBlocked(true);
      setBlockedMinutes(blockCheck.remainingMinutes);
      setErrorMsg(blockCheck.error);
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendOtpToUser(phone);
      if (res.success) {
        setOtpStep(2);
        setTimerSeconds(60);
        setRemainingAttempts(5);
        if (res.devCode) {
          setDevTestCode(res.devCode);
        }
        showToast(res.message, 'success');
      } else {
        setErrorMsg(res.error || "SMS yuborishda xatolik yuz berdi.");
      }
    } catch (_err) {
      setErrorMsg("Tarmoq xatosi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. KODNI TEKSHIRISH
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (otpCode.length !== 6) {
      setErrorMsg("Iltimos, 6 xonali tasdiqlash kodini to'liq kiriting.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const verifyRes = verifyUserOtp(phone, otpCode);

      if (verifyRes.success) {
        logAuditEvent({
          action: 'LOGIN_OTP_SUCCESS',
          actorRole: 'patient',
          actorId: phone,
          details: 'Telefon orqali muvaffaqiyatli autentifikatsiya'
        });

        // Mavjud bemor ekanligini tekshirish
        const cleanPhone = verifyRes.phone;
        const existingPatient = (patients || []).find(
          (p) => p.phone === cleanPhone || p.phone?.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '')
        );

        if (existingPatient) {
          // Allaqachon ro'yxatdan o'tgan bemor
          registerPatient({ ...existingPatient, phone: cleanPhone, role: 'patient' });
          showToast(`Xush kelibsiz, ${existingPatient.name || existingPatient.fullName}!`, 'success');
          setActiveModal(null);
        } else {
          // Yangi bemor — Ism, Familiya, Tug'ilgan sana va Rozilik qadami (Step 3)
          setOtpStep(3);
        }
      } else {
        logAuditEvent({
          action: 'LOGIN_OTP_FAILED',
          actorRole: 'patient',
          actorId: phone,
          details: `Xato kod kiritildi (${verifyRes.remainingAttempts || 0} ta qoldi)`
        });

        if (verifyRes.isBlocked) {
          setIsBlocked(true);
          setErrorMsg(verifyRes.error);
        } else {
          setErrorMsg(verifyRes.error || "Tasdiqlash kodi noto'g'ri.");
          if (verifyRes.remainingAttempts != null) {
            setRemainingAttempts(verifyRes.remainingAttempts);
          }
        }
      }
    } catch (_err) {
      setErrorMsg("Kodni tekshirishda xatolik yuz berdi.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. YANGI BEMORNI RO'YXATDAN O'TKAZISH (Ism, Familiya, Sana, Rozilik)
  const handleCompleteRegistration = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Iltimos, ism va familiyangizni to'liq kiriting.");
      return;
    }

    if (!birthDate) {
      setErrorMsg("Iltimos, tug'ilgan sanangizni tanlang.");
      return;
    }

    if (!consentGiven) {
      setErrorMsg("Davom etish uchun shaxsiy ma'lumotlarni qayta ishlashga rozilik bildirishingiz shart.");
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    registerPatient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName,
      name: fullName,
      phone: cleanPhone,
      birthDate,
      role: 'patient', // Foydalanuvchi rolni o'zgartira olmaydi
      consentGiven: true,
      consentDate: new Date().toISOString()
    });

    logAuditEvent({
      action: 'PATIENT_REGISTERED',
      actorRole: 'patient',
      actorId: cleanPhone,
      details: "Yangi bemor ro'yxatdan o'tdi va ma'lumotlar roziligini berdi"
    });

    showToast(`Xush kelibsiz, ${fullName}! Tizimdan to'liq foydalanishingiz mumkin.`, 'success');
    setActiveModal(null);
  };

  if (activeModal !== 'auth') return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all">

        {/* Modal Header — Faqat Bemor Identifikatsiyasi */}
        <div className="relative bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white p-6 pb-5">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-inner flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                MedNavbat Bemor Kirishi
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Bemor Identifikatsiyasi
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">

          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Telefon raqamini kiritish */}
          {otpStep === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Navbat olish va shaxsiy ma'lumotlaringizni ko'rish uchun telefon raqamingizni kiriting. 6 xonali SMS tasdiqlash kodi yuboriladi.
              </p>

              <div>
                <label
                  htmlFor="auth-modal-phone"
                  className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  O'zbekiston Telefon Raqami (+998)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-modal-phone"
                    type="tel"
                    autoComplete="username"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={isBlocked}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {isBlocked ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Xavfsizlik: Raqamingiz {blockedMinutes} daqiqaga bloklangan.</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSendingOtp || phone.replace(/\D/g, '').length < 12}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SMS Kod Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>SMS Tasdiqlash Kodini Olish</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* STEP 2: 6 xonali SMS kod kiritish */}
          {otpStep === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tasdiqlash kodi quyidagi raqamga yuborildi:
                </span>
                <p className="text-sm font-black text-slate-800 dark:text-white">{phone}</p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  6 Xonali SMS Tasdiqlash Kodi
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono font-black py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Qolgan urinishlar: <strong>{remainingAttempts}</strong></span>
                {timerSeconds > 0 ? (
                  <span className="font-mono text-teal-600 font-bold">{timerSeconds} soniya</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-bold"
                  >
                    Kodni qayta yuborish
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Tekshirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tasdiqlash va Kirish</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setOtpStep(1); setOtpCode(''); setErrorMsg(''); }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Telefon raqamini o'zgartirish
              </button>
            </form>
          )}

          {/* STEP 3: Yangi bemor ma'lumotlari (Ism, Familiya, Sana, Rozilik) */}
          {otpStep === 3 && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center gap-2.5 text-xs text-teal-800 dark:text-teal-300">
                <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Raqam tasdiqlandi! Shaxsiy profilingizni shakllantiring.</span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Ismingiz
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Masalan: Sardor"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Familiyangiz
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Masalan: Karimov"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Tug'ilgan sanangiz
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* MAJBURIY ROZILIK KATAKCHASI */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 cursor-pointer hover:bg-teal-50 transition">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => {
                      setConsentGiven(e.target.checked);
                      setErrorMsg('');
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    <strong>Shaxsiy ma'lumotlarimni qayta ishlashga roziman</strong> (O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi qonuniga muvofiq tibbiy navbat olish uchun).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!consentGiven || !firstName || !lastName || !birthDate}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ro'yxatdan O'tishni Yakunlash</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthModal;
