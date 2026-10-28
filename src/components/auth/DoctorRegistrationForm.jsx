import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  Building2, 
  Award, 
  FileCheck, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Clock,
  MapPin,
  Home,
  Briefcase
} from 'lucide-react';
import { validateUzbekPhoneNumber, sendOtpToUser, verifyUserOtp } from '../../services/auth/otp.service';
import { readFileAsDataUrl, validateUploadedFile } from '../../services/auth/cryptoHelper';
import { getAllHospitals } from '../../data/medicalDataLoader';
import { LocationPickerMap } from '../common/LocationPickerMap';
import { UZBEKISTAN_REGIONS } from '../../data/locationData';
import { getDistrictsByRegion } from '../../data/uzbekistanDistricts';

export const DoctorRegistrationForm = ({ onBack, onComplete, initialValues = null }) => {
  const { t, specialties, submitDoctorApplication, resubmitDoctorApplication, showToast } = useApp();

  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // ── 1-BOSQICH: SHAXSIY MA'LUMOTLAR ──
  const [firstName, setFirstName] = useState(initialValues?.firstName || '');
  const [lastName, setLastName] = useState(initialValues?.lastName || '');
  const [middleName, setMiddleName] = useState(initialValues?.middleName || '');
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate || '');
  const [phone, setPhone] = useState(initialValues?.phone || '+998 ');
  const [email, setEmail] = useState(initialValues?.email || '');

  // SMS OTP Holatlari
  const [phoneVerified, setPhoneVerified] = useState(initialValues?.phoneVerified || false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifyingSms, setIsVerifyingSms] = useState(false);
  const [smsTimer, setSmsTimer] = useState(0);

  // ── 2-BOSQICH: KASBIY MA'LUMOTLAR ──
  const [specialtyId, setSpecialtyId] = useState(initialValues?.specialtyId || '');
  const [experienceYears, setExperienceYears] = useState(initialValues?.experienceYears || '');
  const [diplomaNumber, setDiplomaNumber] = useState(initialValues?.diplomaNumber || '');
  const [licenseNumber, setLicenseNumber] = useState(initialValues?.licenseNumber || '');
  const [licenseExpiry, setLicenseExpiry] = useState(initialValues?.licenseExpiry || '');

  // SHIFOKOR TURI (Talab 1): 'hospital' | 'private_practice' | 'both'
  const [practiceType, setPracticeType] = useState(initialValues?.practiceType || 'hospital');

  // Shifoxona maydonlari
  const [hospitalSelectionType, setHospitalSelectionType] = useState(
    initialValues?.hospitalRegion ? 'custom' : 'existing'
  );
  const [selectedHospitalName, setSelectedHospitalName] = useState(initialValues?.hospitalName || '');
  const [customHospitalName, setCustomHospitalName] = useState(initialValues?.hospitalName || '');
  const [customHospitalRegion, setCustomHospitalRegion] = useState(initialValues?.hospitalRegion || '');
  const [customHospitalAddress, setCustomHospitalAddress] = useState(initialValues?.hospitalAddress || '');
  const [hospitalScheduleDays, setHospitalScheduleDays] = useState(
    initialValues?.workScheduleDays || ['Dushanba', 'Chorshanba', 'Juma']
  );

  // Xususiy kabinet maydonlari (Talab 2 & 3)
  const initialCab = initialValues?.privateCabinet || {};
  const [cabinetName, setCabinetName] = useState(initialCab.cabinetName || initialValues?.cabinetName || '');
  const [cabinetRegionId, setCabinetRegionId] = useState(initialCab.regionId || 'tashkent_city');
  const [cabinetDistrict, setCabinetDistrict] = useState(initialCab.district || '');
  const [cabinetAddress, setCabinetAddress] = useState(initialCab.address || '');
  const [cabinetLandmark, setCabinetLandmark] = useState(initialCab.landmark || '');
  const [cabinetPhone, setCabinetPhone] = useState(initialCab.phone || initialValues?.phone || '+998 ');
  const [cabinetCoords, setCabinetCoords] = useState(
    initialCab.lat && initialCab.lng
      ? { lat: Number(initialCab.lat), lng: Number(initialCab.lng) }
      : { lat: 41.3111, lng: 69.2797 }
  );
  const [cabinetPrivacy, setCabinetPrivacy] = useState(initialCab.privacyType || 'after_confirmed');
  const [privateLicenseNumber, setPrivateLicenseNumber] = useState(initialValues?.privateLicenseNumber || '');
  const [cabinetScheduleDays, setCabinetScheduleDays] = useState(
    initialCab.workScheduleDays || ['Seshanba', 'Payshanba', 'Shanba']
  );

  // ── 3-BOSQICH: HUJJATLAR ──
  const [diplomaFile, setDiplomaFile] = useState(initialValues?.diplomaFile || null);
  const [licenseFile, setLicenseFile] = useState(initialValues?.licenseFile || null);
  const [passportFile, setPassportFile] = useState(initialValues?.passportFile || null);
  const [privateLicenseFile, setPrivateLicenseFile] = useState(initialValues?.privateLicenseFile || null);
  const [avatarFile, setAvatarFile] = useState(initialValues?.avatarFile || null);

  // ── 4-BOSQICH: PAROL VA ROZILIK ──
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Bot himoyasi

  // Shifoxonalar ro'yxati
  const [hospitalsList, setHospitalsList] = useState([]);

  useEffect(() => {
    try {
      const allH = getAllHospitals();
      setHospitalsList(allH || []);
    } catch (_e) {
      setHospitalsList([]);
    }
  }, []);

  // SMS Timer
  useEffect(() => {
    let interval;
    if (smsTimer > 0) {
      interval = setInterval(() => setSmsTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [smsTimer]);

  // Telefon raqami formatlash (+998 XX XXX XX XX)
  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) val = '+998 ';
    const digitsOnly = val.replace(/\D/g, '').substring(0, 12);
    let formatted = '+998 ';
    if (digitsOnly.length > 3) {
      const rest = digitsOnly.substring(3);
      if (rest.length <= 2) formatted += rest;
      else if (rest.length <= 5) formatted += `${rest.substring(0, 2)} ${rest.substring(2)}`;
      else if (rest.length <= 7) formatted += `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
      else formatted += `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5, 7)} ${rest.substring(7, 9)}`;
    }
    setPhone(formatted);
    setPhoneVerified(false);
    setSmsSent(false);
    setErrorMsg('');
  };

  // SMS kod yuborish
  const handleSendSms = async () => {
    setErrorMsg('');
    const validation = validateUzbekPhoneNumber(phone);
    if (!validation.isValid) {
      setErrorMsg(validation.error);
      return;
    }

    setIsSendingSms(true);
    try {
      const res = await sendOtpToUser(phone, firstName ? `${firstName} ${lastName}` : 'Shifokor');
      if (res.success) {
        setSmsSent(true);
        setSmsTimer(60);
        if (res.devCode) setDevCode(res.devCode);
        showToast("6 xonali SMS kod yuborildi!", "success");
      } else {
        setErrorMsg(res.error || "SMS yuborishda xatolik.");
      }
    } catch (_e) {
      setErrorMsg("SMS yuborishda tarmoq xatosi yuz berdi.");
    } finally {
      setIsSendingSms(false);
    }
  };

  // SMS kodni tekshirish
  const handleVerifySms = () => {
    setErrorMsg('');
    if (smsCode.length !== 6) {
      setErrorMsg("Iltimos, 6 xonali tasdiqlash kodini to'liq kiriting.");
      return;
    }

    setIsVerifyingSms(true);
    try {
      const res = verifyUserOtp(phone, smsCode);
      if (res.success) {
        setPhoneVerified(true);
        showToast("Telefon raqamingiz muvaffaqiyatli tasdiqlandi! ✅", "success");
      } else {
        setErrorMsg(res.error || "Tasdiqlash kodi noto'g'ri.");
      }
    } catch (_e) {
      setErrorMsg("Kodni tekshirishda xatolik.");
    } finally {
      setIsVerifyingSms(false);
    }
  };

  // Fayl yuklash handler
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const val = validateUploadedFile(file);
    if (!val.isValid) {
      setErrorMsg(val.error);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const fileData = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl
      };

      if (type === 'diploma') setDiplomaFile(fileData);
      else if (type === 'license') setLicenseFile(fileData);
      else if (type === 'passport') setPassportFile(fileData);
      else if (type === 'private_license') setPrivateLicenseFile(fileData);
      else if (type === 'avatar') setAvatarFile(fileData);
      setErrorMsg('');
    } catch (_e) {
      setErrorMsg("Faylni yuklashda xatolik yuz berdi.");
    }
  };

  // 1-bosqichni tekshirish
  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Iltimos, ism va familiyangizni to'liq kiriting.");
      return false;
    }
    if (!birthDate) {
      setErrorMsg("Iltimos, tug'ilgan sanangizni tanlang.");
      return false;
    }
    const validation = validateUzbekPhoneNumber(phone);
    if (!validation.isValid) {
      setErrorMsg(validation.error);
      return false;
    }
    if (!phoneVerified) {
      setErrorMsg("Telefon raqamingizni SMS kod bilan tasdiqlashingiz shart.");
      return false;
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg("Email formati noto'g'ri. Masalan: shifokor@mednavbat.uz");
      return false;
    }
    return true;
  };

  // 2-bosqichni tekshirish (Talab 1, 2 va 4)
  const validateStep2 = () => {
    if (!specialtyId) {
      setErrorMsg("Mutaxassislikni tanlang.");
      return false;
    }
    if (experienceYears === '' || Number(experienceYears) < 0) {
      setErrorMsg("Ish stajini to'g'ri kiriting (yil).");
      return false;
    }
    if (!diplomaNumber.trim()) {
      setErrorMsg("Diplom raqamini kiriting.");
      return false;
    }
    if (!licenseNumber.trim()) {
      setErrorMsg("Litsenziya yoki sertifikat raqamini kiriting.");
      return false;
    }
    if (!licenseExpiry) {
      setErrorMsg("Litsenziyaning amal qilish muddatini kiriting.");
      return false;
    }

    const hasHospital = practiceType === 'hospital' || practiceType === 'both';
    const isPrivate = practiceType === 'private_practice' || practiceType === 'both';

    if (hasHospital) {
      const targetHosp = hospitalSelectionType === 'existing' ? selectedHospitalName : customHospitalName;
      if (!targetHosp?.trim()) {
        setErrorMsg("Shifoxonani tanlang yoki yangisini kiriting.");
        return false;
      }
      if (hospitalSelectionType === 'custom' && (!customHospitalRegion.trim() || !customHospitalAddress.trim())) {
        setErrorMsg("Boshqa shifoxona uchun hudud va aniq manzilni kiriting.");
        return false;
      }
    }

    if (isPrivate) {
      if (!cabinetDistrict.trim()) {
        setErrorMsg("Xususiy kabinetingiz joylashgan tumanni tanlang yoki kiriting.");
        return false;
      }
      if (!cabinetAddress.trim()) {
        setErrorMsg("Xususiy kabinetning aniq ko'cha va uy manzilini kiriting.");
        return false;
      }
      if (!cabinetCoords || cabinetCoords.lat == null || cabinetCoords.lng == null) {
        setErrorMsg("Iltimos, xaritada kabinetingiz joylashuvini belgilang.");
        return false;
      }
      if (!privateLicenseNumber.trim()) {
        setErrorMsg("Xususiy tibbiy faoliyat litsenziya/ruxsatnoma raqamini kiriting.");
        return false;
      }
    }

    return true;
  };

  // 3-bosqichni tekshirish (Talab 4)
  const validateStep3 = () => {
    if (!diplomaFile) {
      setErrorMsg("Diplom nusxasi faylini yuklashingiz shart.");
      return false;
    }
    if (!licenseFile) {
      setErrorMsg("Tibbiy litsenziya nusxasi faylini yuklashingiz shart.");
      return false;
    }
    if (!passportFile) {
      setErrorMsg("Shaxsni tasdiqlovchi pasport yoki selfie rasmini yuklashingiz shart.");
      return false;
    }
    if (practiceType !== 'hospital' && !privateLicenseFile) {
      setErrorMsg("Xususiy tibbiy faoliyat uchun litsenziya/ruxsatnoma hujjatini yuklashingiz shart.");
      return false;
    }
    return true;
  };

  // 4-bosqich va Ariza yuborish
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg("Parol kamida 8 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMsg("Parolda kamida bitta harf va bitta raqam bo'lishi kerak.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Parollar bir-biriga mos kelmadi.");
      return;
    }
    if (!consentPersonalData || !consentTerms) {
      setErrorMsg("Davom etish uchun shaxsiy ma'lumotlarni qayta ishlashga va qoidalarga rozilik berishingiz shart.");
      return;
    }

    const selectedSpec = specialties.find(s => s.id === specialtyId);
    const finalHospitalName = hospitalSelectionType === 'existing' ? selectedHospitalName : customHospitalName;

    const isPrivate = practiceType === 'private_practice' || practiceType === 'both';
    const hasHospital = practiceType === 'hospital' || practiceType === 'both';

    const selectedRegObj = UZBEKISTAN_REGIONS.find(r => r.id === cabinetRegionId);

    const formattedCabinet = isPrivate ? {
      id: `cab-${Date.now()}`,
      cabinetName: cabinetName.trim() || `Dr. ${firstName.trim()} ${lastName.trim()} qabuli`,
      name: cabinetName.trim() || `Dr. ${firstName.trim()} ${lastName.trim()} qabuli`,
      regionId: cabinetRegionId,
      regionName: selectedRegObj?.name || "Toshkent shahri",
      district: cabinetDistrict.trim(),
      address: cabinetAddress.trim(),
      landmark: cabinetLandmark.trim(),
      phone: cabinetPhone.trim() || phone,
      lat: Number(cabinetCoords.lat),
      lng: Number(cabinetCoords.lng),
      privacyType: cabinetPrivacy, // 'public' | 'after_confirmed'
      approxRadiusMeters: 400,
      privateLicenseNumber: privateLicenseNumber.trim(),
      workScheduleDays: cabinetScheduleDays,
      availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      status: 'pending_verification'
    } : null;

    const initialWorkplaces = [];
    if (hasHospital) {
      initialWorkplaces.push({
        id: `wp-hosp-${Date.now()}`,
        type: 'hospital',
        name: finalHospitalName,
        regionId: hospitalSelectionType === 'custom' ? customHospitalRegion : '',
        regionName: hospitalSelectionType === 'custom' ? customHospitalRegion : '',
        address: hospitalSelectionType === 'custom' ? customHospitalAddress : '',
        phone,
        workScheduleDays: hospitalScheduleDays,
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        status: 'pending_verification'
      });
    }
    if (isPrivate && formattedCabinet) {
      initialWorkplaces.push({
        id: formattedCabinet.id,
        type: 'private_cabinet',
        name: formattedCabinet.cabinetName,
        cabinetName: formattedCabinet.cabinetName,
        regionId: formattedCabinet.regionId,
        regionName: formattedCabinet.regionName,
        district: formattedCabinet.district,
        address: formattedCabinet.address,
        landmark: formattedCabinet.landmark,
        phone: formattedCabinet.phone,
        lat: formattedCabinet.lat,
        lng: formattedCabinet.lng,
        privacyType: formattedCabinet.privacyType,
        approxRadiusMeters: 400,
        workScheduleDays: formattedCabinet.workScheduleDays,
        availableSlots: formattedCabinet.availableSlots,
        status: 'pending_verification'
      });
    }

    const payload = {
      firstName,
      lastName,
      middleName,
      birthDate,
      phone,
      phoneVerified: true,
      email,
      specialtyId,
      specialtyName: selectedSpec?.name || specialtyId,
      experienceYears: Number(experienceYears),
      diplomaNumber,
      licenseNumber,
      licenseExpiry,
      // Shifokor turi va ish joylari
      practiceType,
      isPrivateDoctor: isPrivate,
      hospitalName: hasHospital ? finalHospitalName : (formattedCabinet?.cabinetName || `Dr. ${firstName.trim()} ${lastName.trim()} qabuli`),
      hospitalRegion: hospitalSelectionType === 'custom' ? customHospitalRegion : (formattedCabinet?.regionName || ''),
      hospitalAddress: hospitalSelectionType === 'custom' ? customHospitalAddress : (formattedCabinet?.address || ''),
      hospitalScheduleDays,
      privateCabinet: formattedCabinet,
      workplaces: initialWorkplaces,
      privateLicenseNumber: privateLicenseNumber.trim(),
      privateLicenseFile,
      diplomaFile,
      licenseFile,
      passportFile,
      avatarFile,
      password,
      confirmPassword,
      consentPersonalData: true,
      consentTerms: true,
      honeypot
    };

    setIsSubmitting(true);
    try {
      let res;
      if (initialValues?.id && initialValues?.status === 'rejected') {
        res = await resubmitDoctorApplication(initialValues.id, payload);
      } else {
        res = await submitDoctorApplication(payload);
      }

      if (res.success) {
        setIsSubmittedSuccess(true);
        showToast("Arizangiz muvaffaqiyatli topshirildi!", "success");
        if (onComplete) onComplete(res.application);
      } else {
        setErrorMsg(res.error || "Ariza yuborishda xatolik yuz berdi.");
      }
    } catch (_err) {
      setErrorMsg("Ariza topshirishda kutilmagan xatolik.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  // Muvaffaqiyat ekrani
  if (isSubmittedSuccess) {
    return (
      <div className="py-6 px-2 text-center space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {t('doctor_reg.under_review_title', "Arizangiz ko'rib chiqilmoqda")}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {t('doctor_reg.under_review_desc', "Arizangiz va yuklangan diplom hamda litsenziya hujjatlaringiz ma'muriyat tomonidan ko'rib chiqilmoqda. Tasdiqlangach SMS yoki emailingizga xabar yuboriladi.")}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
          <div className="font-extrabold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <Clock className="w-4 h-4" />
            <span>Holat: Tasdiqlanishi kutilmoqda (Ko'rib chiqilmoqda)</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            Admin arizangizni tasdiqlamaguncha bemorlar ma'lumotlari yopiq turadi va ro'yxatda ko'rinmaysiz. Tasdiqlanganidan so'ng bemorlar navbatini qabul qilishingiz mumkin.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition"
        >
          Kirish oynasiga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Wizard Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handlePrevStep}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? t('doctor_reg.back_btn', "Orqaga") : `Bosqich ${step - 1}`}</span>
        </button>

        <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 rounded-full">
          {step}/4-bosqich: {
            step === 1 ? t('doctor_reg.step1_title', "Shaxsiy") :
            step === 2 ? t('doctor_reg.step2_title', "Kasbiy") :
            step === 3 ? t('doctor_reg.step3_title', "Hujjatlar") :
            t('doctor_reg.step4_title', "Parol va Rozilik")
          }
        </span>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= step ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Honeypot yashirin maydoni */}
      <input
        type="text"
        name="med_hp_field"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{ display: 'none' }}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          1-BOSQICH: SHAXSIY MA'LUMOTLAR + SMS OTP
         ══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('doctor_reg.first_name', "Ismingiz")} *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Akmal"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('doctor_reg.last_name', "Familiyangiz")} *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Rahimov"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('doctor_reg.middle_name', "Otasining ismi")}
            </label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="Sobirovich (ixtiyoriy)"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('doctor_reg.birth_date', "Tug'ilgan sana")} *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* TELEFON VA SMS KOD BILAN TASDIQLASH */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {t('doctor_reg.phone', "Telefon raqami (+998)")} *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  disabled={phoneVerified}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+998 90 123 45 67"
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60"
                />
              </div>

              {!phoneVerified ? (
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={isSendingSms || phone.replace(/\D/g, '').length < 12 || smsTimer > 0}
                  className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
                >
                  {isSendingSms ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{smsTimer > 0 ? `${smsTimer}s` : t('doctor_reg.send_sms', "SMS Kod")}</span>
                </button>
              ) : (
                <div className="px-3 py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tasdiqlandi</span>
                </div>
              )}
            </div>

            {/* Test/Dev rejimida kod ko'rsatish */}
            {devCode && !phoneVerified && (
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span>Sinov kodi (Konsol):</span>
                <button
                  type="button"
                  onClick={() => setSmsCode(devCode)}
                  className="font-black bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded text-xs hover:underline"
                >
                  {devCode}
                </button>
              </div>
            )}

            {/* SMS Kod kiritish */}
            {smsSent && !phoneVerified && (
              <div className="flex gap-2 animate-in fade-in">
                <input
                  type="text"
                  maxLength={6}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="6 xonali SMS kod"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-center tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifySms}
                  disabled={isVerifyingSms || smsCode.length !== 6}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {isVerifyingSms ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{t('doctor_reg.verify_sms', "Tasdiqlash")}</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('doctor_reg.email', "Email manzili")} *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shifokor@mednavbat.uz"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextStep}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{t('doctor_reg.next_btn', "Keyingisi: Kasbiy ma'lumotlar")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          2-BOSQICH: KASBIY MA'LUMOTLAR
         ══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('doctor_reg.specialty', "Mutaxassislik")} *
            </label>
            <select
              required
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">{t('doctor_reg.select_specialty', "-- Mutaxassislikni tanlang --")}</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.name_uz}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('doctor_reg.experience', "Ish staji (yil)")} *
              </label>
              <input
                type="number"
                min="0"
                max="60"
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="Masalan: 10"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('doctor_reg.diploma_number', "Diplom raqami")} *
              </label>
              <input
                type="text"
                required
                value={diplomaNumber}
                onChange={(e) => setDiplomaNumber(e.target.value)}
                placeholder="B № 123456"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('doctor_reg.license_number', "Litsenziya №")} *
              </label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="LIC-UZ-98421"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('doctor_reg.license_expiry', "Amal qilish muddati")} *
              </label>
              <input
                type="date"
                required
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* ── SHIFOKOR TURI (Talab 1) ── */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Ishlash joyi turi (Shifokor faoliyati) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPracticeType('hospital')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer select-none ${
                  practiceType === 'hospital'
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 ring-2 ring-teal-600/20 text-teal-900 dark:text-teal-200 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Shifoxona / Klinika</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Mavjud shifoxonada qabul qilaman
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPracticeType('private_practice')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer select-none ${
                  practiceType === 'private_practice'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 ring-2 ring-purple-600/20 text-purple-900 dark:text-purple-200 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Home className="w-4 h-4 text-purple-600" />
                  <span>Xususiy shifokor</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  O'z xususiy kabinetim bor
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPracticeType('both')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer select-none ${
                  practiceType === 'both'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 ring-2 ring-indigo-600/20 text-indigo-900 dark:text-indigo-200 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>Ikkala variant</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Shifoxonada ham, o'z kabinetimda ham
                </p>
              </button>
            </div>
          </div>

          {/* ── 1. SHIFOXONA / KLINIKA MA'LUMOTLARI ── */}
          {(practiceType === 'hospital' || practiceType === 'both') && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>{practiceType === 'both' ? "1-ish joyi: Shifoxona yoki klinika *" : t('doctor_reg.hospital', "Ishlayotgan shifoxona *")}</span>
                </label>
                <div className="flex gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setHospitalSelectionType('existing')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      hospitalSelectionType === 'existing'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Ro'yxatdan
                  </button>
                  <button
                    type="button"
                    onClick={() => setHospitalSelectionType('custom')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      hospitalSelectionType === 'custom'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {t('doctor_reg.other_hospital', "Boshqa")}
                  </button>
                </div>
              </div>

              {hospitalSelectionType === 'existing' ? (
                <select
                  value={selectedHospitalName}
                  onChange={(e) => setSelectedHospitalName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">{t('doctor_reg.select_hospital', "-- Shifoxonani tanlang --")}</option>
                  {hospitalsList.map((h, i) => (
                    <option key={`${h.id || i}`} value={h.name}>
                      {h.name} ({h.regionName || 'O\'zbekiston'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    value={customHospitalName}
                    onChange={(e) => setCustomHospitalName(e.target.value)}
                    placeholder={t('doctor_reg.hospital_name', "Shifoxona yoki klinika nomi")}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={customHospitalRegion}
                      onChange={(e) => setCustomHospitalRegion(e.target.value)}
                      placeholder={t('doctor_reg.hospital_region', "Hudud (masalan: Toshkent sh.)")}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={customHospitalAddress}
                      onChange={(e) => setCustomHospitalAddress(e.target.value)}
                      placeholder={t('doctor_reg.hospital_address', "Aniq manzil, ko'cha")}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Shifoxonadagi qabul kunlari */}
              {practiceType === 'both' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                    Shifoxonadagi qabul kunlaringiz:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'].map(d => {
                      const isSel = hospitalScheduleDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            if (isSel) setHospitalScheduleDays(hospitalScheduleDays.filter(x => x !== d));
                            else setHospitalScheduleDays([...hospitalScheduleDays, d]);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                            isSel ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 2. XUSUSIY KABINET MA'LUMOTLARI VA JOYLASHUVI (Talab 1, 2 va 3) ── */}
          {(practiceType === 'private_practice' || practiceType === 'both') && (
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                  {practiceType === 'both' ? "2-ish joyi: Xususiy kabinet joylashuvi *" : "Xususiy kabinet ma'lumotlari va joylashuvi *"}
                </h4>
              </div>

              {/* Kabinet nomi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kabinet nomi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={cabinetName}
                  onChange={(e) => setCabinetName(e.target.value)}
                  placeholder={`Masalan: Dr. ${firstName ? firstName : 'Akmal'} Rahimov qabuli`}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Hudud va Tuman */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hudud (Viloyat) *
                  </label>
                  <select
                    value={cabinetRegionId}
                    onChange={(e) => {
                      setCabinetRegionId(e.target.value);
                      const dists = getDistrictsByRegion(e.target.value);
                      if (dists && dists.length > 0) setCabinetDistrict(dists[0].name);
                      else setCabinetDistrict('');
                    }}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {UZBEKISTAN_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tuman / Shahar *
                  </label>
                  {getDistrictsByRegion(cabinetRegionId).length > 0 ? (
                    <select
                      value={cabinetDistrict}
                      onChange={(e) => setCabinetDistrict(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">-- Tumanni tanlang --</option>
                      {getDistrictsByRegion(cabinetRegionId).map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={cabinetDistrict}
                      onChange={(e) => setCabinetDistrict(e.target.value)}
                      placeholder="Tuman nomi"
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Manzil (Ko'cha, uy) va Mo'ljal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aniq manzil (ko'cha, uy) *
                  </label>
                  <input
                    type="text"
                    required
                    value={cabinetAddress}
                    onChange={(e) => setCabinetAddress(e.target.value)}
                    placeholder="Masalan: Navoiy ko'chasi, 24-uy"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mo'ljal (masalan, metro yonida)
                  </label>
                  <input
                    type="text"
                    value={cabinetLandmark}
                    onChange={(e) => setCabinetLandmark(e.target.value)}
                    placeholder="Masalan: Korzinka yonida, 2-qavat"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Kabinet telefoni va Xususiy litsenziya raqami */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kabinet telefoni *
                  </label>
                  <input
                    type="text"
                    required
                    value={cabinetPhone}
                    onChange={(e) => setCabinetPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Xususiy faoliyat litsenziya/ruxsatnoma № *
                  </label>
                  <input
                    type="text"
                    required
                    value={privateLicenseNumber}
                    onChange={(e) => setPrivateLicenseNumber(e.target.value)}
                    placeholder="UZ-PRIV-MED-00941"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Interaktiv Leaflet Joylashuv Xaritasi va Maxfiylik sozlamasi (Talab 2 & 3) */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-black text-slate-900 dark:text-white">
                  Xaritada joylashuvni belgilang (Leaflet + OpenStreetMap) *
                </label>
                <LocationPickerMap
                  initialCoords={cabinetCoords}
                  regionId={cabinetRegionId}
                  district={cabinetDistrict}
                  address={cabinetAddress}
                  privacyType={cabinetPrivacy}
                  onCoordsChange={(newPos) => setCabinetCoords(newPos)}
                  onPrivacyChange={(newPriv) => setCabinetPrivacy(newPriv)}
                  showPrivacySelector={true}
                />
              </div>

              {/* Kabinetdagi qabul kunlari */}
              <div className="pt-2 border-t border-purple-200 dark:border-purple-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block">
                  Xususiy kabinetdagi qabul kunlaringiz:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'].map(d => {
                    const isSel = cabinetScheduleDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          if (isSel) setCabinetScheduleDays(cabinetScheduleDays.filter(x => x !== d));
                          else setCabinetScheduleDays([...cabinetScheduleDays, d]);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          isSel ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          <button
            type="button"
            onClick={handleNextStep}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{t('doctor_reg.next_btn', "Keyingisi: Hujjatlarni yuklash")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          3-BOSQICH: HUJJATLAR (JPG, PNG, PDF, MAX 5MB)
         ══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Diplom va litsenziya nusxalarini yuklang (Maksimal 5 MB, faqat JPG, PNG, PDF). Hujjatlar faqat ma'muriyat tomonidan ko'rib chiqiladi.
          </p>

          {/* DIPLOM YUKLASH */}
          <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 transition bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>{t('doctor_reg.diploma_file', "Diplom nusxasi")} *</span>
              </label>
              {diplomaFile && (
                <button
                  type="button"
                  onClick={() => setDiplomaFile(null)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>O'chirish</span>
                </button>
              )}
            </div>

            {diplomaFile ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-bold truncate flex-1">{diplomaFile.name}</span>
                <span className="text-[11px] text-slate-400">{(diplomaFile.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <label className="cursor-pointer block text-center py-4">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-teal-600 hover:underline">Fayl tanlang yoki sudrab olib keling</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">JPG, PNG yoki PDF (max 5 MB)</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileUpload(e, 'diploma')}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* LITSENZIYA YUKLASH */}
          <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 transition bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>{t('doctor_reg.license_file', "Litsenziya / Sertifikat nusxasi")} *</span>
              </label>
              {licenseFile && (
                <button
                  type="button"
                  onClick={() => setLicenseFile(null)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>O'chirish</span>
                </button>
              )}
            </div>

            {licenseFile ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-bold truncate flex-1">{licenseFile.name}</span>
                <span className="text-[11px] text-slate-400">{(licenseFile.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <label className="cursor-pointer block text-center py-4">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-teal-600 hover:underline">Fayl tanlang yoki sudrab olib keling</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">JPG, PNG yoki PDF (max 5 MB)</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileUpload(e, 'license')}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* PASPORT YOKI SELFIE RASMI YUKLASH */}
          <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 transition bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Pasport yoki shaxsni tasdiqlovchi selfie rasmi *</span>
              </label>
              {passportFile && (
                <button
                  type="button"
                  onClick={() => setPassportFile(null)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>O'chirish</span>
                </button>
              )}
            </div>

            {passportFile ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-bold truncate flex-1">{passportFile.name}</span>
                <span className="text-[11px] text-slate-400">{(passportFile.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <label className="cursor-pointer block text-center py-4">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-teal-600 hover:underline">Pasport / Selfie rasmini yuklang</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">JPG, PNG yoki PDF (max 5 MB)</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileUpload(e, 'passport')}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* XUSUSIY FAOLIYAT LITSENZIYASI / RUXSATNOMASI YUKLASH (Talab 4) */}
          {practiceType !== 'hospital' && (
            <div className="p-3.5 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 transition bg-purple-50/40 dark:bg-purple-950/20 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Xususiy tibbiy faoliyat litsenziyasi/ruxsatnomasi *</span>
                </label>
                {privateLicenseFile && (
                  <button
                    type="button"
                    onClick={() => setPrivateLicenseFile(null)}
                    className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>O'chirish</span>
                  </button>
                )}
              </div>

              {privateLicenseFile ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="font-bold truncate flex-1">{privateLicenseFile.name}</span>
                  <span className="text-[11px] text-slate-400">{(privateLicenseFile.size / 1024).toFixed(0)} KB</span>
                </div>
              ) : (
                <label className="cursor-pointer block text-center py-4">
                  <Upload className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-purple-600 hover:underline">Xususiy faoliyat litsenziyasi faylini yuklang</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">JPG, PNG yoki PDF (max 5 MB)</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload(e, 'private_license')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* SHIFOKOR SURATI (IXTIYORIY) */}
          <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span>{t('doctor_reg.avatar_file', "O'z suratingiz (ixtiyoriy)")}</span>
              </label>
              {avatarFile && (
                <button
                  type="button"
                  onClick={() => setAvatarFile(null)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>O'chirish</span>
                </button>
              )}
            </div>

            {avatarFile ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <img src={avatarFile.dataUrl} alt="Avatar preview" className="w-8 h-8 rounded-full object-cover" />
                <span className="font-bold truncate flex-1">{avatarFile.name}</span>
                <span className="text-[11px] text-slate-400">{(avatarFile.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <label className="cursor-pointer block text-center py-2">
                <span className="text-xs font-bold text-teal-600 hover:underline">+ Fotosurat yuklash</span>
                <span className="block text-[11px] text-slate-400">JPG yoki PNG (max 5 MB)</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextStep}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{t('doctor_reg.next_btn', "Keyingisi: Parol va Rozilik")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4-BOSQICH: PAROL YARATISH VA MAJBURIY ROZILIKLAR
         ══════════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('doctor_reg.password', "Parol (kamida 8 belgi, harf va raqam)")} *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 8 belgi"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('doctor_reg.password_confirm', "Parolni takrorlang")} *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Parolni qayta kiriting"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* ROZILIK KATAKCHALARI */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentPersonalData}
                onChange={(e) => setConsentPersonalData(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
              />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                <strong>{t('doctor_reg.consent_data', "Shaxsiy ma'lumotlarimni qayta ishlashga roziman")}</strong> (O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi qonuniga muvofiq tibbiy faoliyat uchun).
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
              />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                <strong>{t('doctor_reg.consent_terms', "MedNavbat platformasidan foydalanish shartlariga")}</strong> va shifokorlar etika qoidalariga roziman.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !consentPersonalData || !consentTerms || !password || password !== confirmPassword}
            className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition active:scale-98"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Ariza yuborilmoqda...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>{t('doctor_reg.submit_btn', "Arizani Yuborish")}</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default DoctorRegistrationForm;
