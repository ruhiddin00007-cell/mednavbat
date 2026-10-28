import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Clock, 
  ShieldCheck, 
  Phone, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  RotateCcw, 
  Sparkles,
  Lock
} from 'lucide-react';
import { OtpInput } from './OtpInput';
import { TicketView } from './TicketView';
import { sendRegistrationOtp, verifyRegistrationOtp } from '../../api/clientApi';
import { useApp } from '../../context/AppContext';

export const RegistrationModal = ({ isOpen, onClose, onComplete }) => {
  const { userProfile, setUserProfile, setIsAuthenticated } = useApp();

  const [step, setStep] = useState(1); // 1: Info, 2: OTP, 3: Ticket
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [ticket, setTicket] = useState(null);

  // 60 soniyalik qayta SMS yuborish taymeri
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer = null;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(c => c - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // Telefon raqamini avtomatik formatlash maskasi: +998 (90) 123-45-67
  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');

    // +998 prefiksini doimo saqlash
    if (!digits.startsWith('998')) {
      const remaining = digits.replace(/^998/, '');
      setPhone(`+998 ${remaining}`);
      return;
    }

    const local = digits.substring(3, 12);
    let formatted = '+998';

    if (local.length > 0) {
      formatted += ` (${local.substring(0, 2)}`;
    }
    if (local.length >= 2) {
      formatted += `) ${local.substring(2, 5)}`;
    }
    if (local.length >= 5) {
      formatted += `-${local.substring(5, 7)}`;
    }
    if (local.length >= 7) {
      formatted += `-${local.substring(7, 9)}`;
    }

    setPhone(formatted);
    setErrorMessage('');
  };

  // 1-qadam: SMS kod yuborish
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Iltimos, ism va familiyangizni kiriting.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 12) {
      setErrorMessage("Iltimos, to'liq telefon raqamingizni kiriting (+998 90 123 45 67).");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await sendRegistrationOtp(phone, fullName);
      if (!response.success) {
        setErrorMessage(response.error || "SMS yuborishda xatolik yuz berdi.");
        setIsLoading(false);
        return;
      }

      setDevCode(response.devCode || null);
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setErrorMessage(`Tarmoq xatosi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2-qadam: SMS kodni tasdiqlash
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpCode;
    if (code.length !== 6) {
      setErrorMessage("Iltimos, 6 xonali tasdiqlash kodini to'liq kiriting.");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await verifyRegistrationOtp(phone, code, fullName);
      if (!response.success) {
        setErrorMessage(response.error || "Tasdiqlash kodi noto'g'ri.");
        setIsLoading(false);
        return;
      }

      // Muvaffaqiyatli!
      setTicket(response.ticket);
      setStep(3);

      // App context user profilini yangilash
      if (setUserProfile) {
        setUserProfile(prev => ({
          ...prev,
          name: fullName,
          phone: response.user.formattedPhone || phone,
          isVerified: true
        }));
      }
      if (setIsAuthenticated) {
        setIsAuthenticated(true);
      }

      // Confetti otish
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_e) {}

      onComplete?.(response.ticket);
    } catch (err) {
      setErrorMessage(`Tasdiqlashda xatolik: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // SMS kodni qayta yuborish
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await sendRegistrationOtp(phone, fullName);
      if (response.success) {
        setDevCode(response.devCode || null);
        setCountdown(60);
        setCanResend(false);
      } else {
        setErrorMessage(response.error || "Qayta yuborishda xatolik.");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFullName('');
    setPhone('+998 ');
    setOtpCode('');
    setErrorMessage('');
    setDevCode(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-modal-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] animate-scaleUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header (Faqat 1 va 2-qadamda ko'rinadi) */}
        {step !== 3 && (
          <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/25 flex-shrink-0">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="registration-modal-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Tezkor 1-Daqiqalik Registratsiya
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step === 1 ? "Ism va telefoningiz orqali 60 soniyada ro'yxatdan o'ting" : "Telefoningizga yuborilgan 6 xonali SMS kodni kiriting"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition active:scale-95 flex-shrink-0 cursor-pointer"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Qadamlar progress bari */}
            <div className="flex items-center space-x-2 mt-4">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
            </div>
          </div>
        )}

        {/* Modal Tana Qismi */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          
          {/* Xatolik xabari */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="font-semibold">{errorMessage}</p>
            </div>
          )}

          {/* 1-QADAM: Ism va Telefon */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>Ism va Familiyangiz *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Azizbek Karimov"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-hidden text-sm font-medium transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Telefon raqamingiz (+998) *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+998 (90) 123-45-67"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-hidden text-sm font-mono font-bold tracking-wide transition"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Ushbu raqamga tasdiqlash uchun 6 xonali SMS kod jo'natiladi
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-teal-600/25 transition transform active:scale-98 disabled:opacity-75 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SMS yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>SMS Kodni Olish (Davom etish)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 pt-1">
                <Lock className="w-3 h-3 text-teal-600" />
                <span>Ma'lumotlaringiz xavfsiz va shifrlangan holda saqlanadi</span>
              </div>
            </form>
          )}

          {/* 2-QADAM: 6 xonali SMS OTP Kod */}
          {step === 2 && (
            <div className="space-y-5 text-center">
              
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tasdiqlash kodi quyidagi raqamga yuborildi:
                </p>
                <p className="text-sm font-bold font-mono text-teal-700 dark:text-teal-300">
                  {phone}
                </p>
              </div>

              {/* Development Mock Kod Bildirishnomasi */}
              {devCode && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200">
                  <span>Dev Mock Kod: <strong className="font-mono text-sm tracking-widest">{devCode}</strong></span>
                </div>
              )}

              {/* 6 xonali OTP Kataklari */}
              <div className="py-2">
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={handleVerifyOtp}
                  disabled={isLoading}
                  isError={Boolean(errorMessage)}
                  length={6}
                />
              </div>

              {/* Tasdiqlash Tugmasi */}
              <button
                onClick={() => handleVerifyOtp(otpCode)}
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-teal-600/25 transition transform active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Tekshirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <span>Tasdiqlash va Chiptani Olish</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Qayta SMS so'rash va Raqamni o'zgartirish */}
              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 dark:text-slate-400 hover:text-teal-600 font-medium cursor-pointer"
                >
                  Raqamni o'zgartirish
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Qayta yuborish</span>
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">
                    Qayta yuborish: <strong className="font-mono">{countdown}s</strong>
                  </span>
                )}
              </div>

            </div>
          )}

          {/* 3-QADAM: QR Chipta Ko'rinishi */}
          {step === 3 && ticket && (
            <TicketView 
              ticket={ticket} 
              onClose={handleClose}
              onBookDoctor={() => {
                handleClose();
                const el = document.getElementById('doctors-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} 
            />
          )}

        </div>

      </div>
    </div>
  );
};
