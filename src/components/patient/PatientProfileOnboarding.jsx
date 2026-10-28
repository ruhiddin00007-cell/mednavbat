/**
 * PatientProfileOnboarding.jsx
 * ──────────────────────────────────────────────────────────
 * Bemor birinchi marta tizimga kirganda majburiy profil to'ldirish ekrani.
 * 
 * Talablar:
 * 1. Majburiy maydonlar: Ism, Familiya, Tug'ilgan sana, Jinsi, Telefon (tasdiqlangan), Hudud.
 * 2. Ixtiyoriy tibbiy ma'lumotlar: Surunkali kasalliklar, Allergiya, Qon guruhi.
 * 3. Shaxsiy va tibbiy ma'lumotlarni qayta ishlashga majburiy rozilik.
 * 4. To'ldirilgach, oddiy bemor portaliga yo'l ochiladi.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  HeartPulse, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Activity,
  Droplet,
  Sparkles
} from 'lucide-react';

const REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand viloyati',
  'Andijon viloyati',
  'Farg\'ona viloyati',
  'Namangan viloyati',
  'Buxoro viloyati',
  'Qashqadaryo viloyati',
  'Surxondaryo viloyati',
  'Xorazm viloyati',
  'Navoiy viloyati',
  'Jizzax viloyati',
  'Sirdaryo viloyati',
  'Qoraqalpog\'iston Respublikasi'
];

const BLOOD_GROUPS = [
  'Aniqlanmagan',
  'O(I) Rh+',
  'O(I) Rh-',
  'A(II) Rh+',
  'A(II) Rh-',
  'B(III) Rh+',
  'B(III) Rh-',
  'AB(IV) Rh+',
  'AB(IV) Rh-'
];

export const PatientProfileOnboarding = ({ onCompleted }) => {
  const { userProfile, updateUserProfile, showToast } = useApp();

  const [firstName, setFirstName] = useState(userProfile?.firstName || userProfile?.name?.split(' ')?.[0] || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || userProfile?.name?.split(' ')?.[1] || '');
  const [birthDate, setBirthDate] = useState(userProfile?.birthDate || '');
  const [gender, setGender] = useState(userProfile?.gender || 'Erkak');
  const [region, setRegion] = useState(userProfile?.region || 'Toshkent shahri');
  
  // Ixtiyoriy tibbiy ma'lumotlar
  const [bloodGroup, setBloodGroup] = useState(userProfile?.bloodGroup || 'Aniqlanmagan');
  const [chronicDiseases, setChronicDiseases] = useState(userProfile?.chronicDiseases || '');
  const [allergies, setAllergies] = useState(userProfile?.allergies || '');

  // Majburiy rozilik
  const [consentGiven, setConsentGiven] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phone = userProfile?.phone || '+998 (90) 123-45-67';

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Iltimos, ism va familiyangizni to'liq kiriting.");
      return;
    }

    if (!birthDate) {
      setErrorMsg("Iltimos, tug'ilgan sanangizni kiriting.");
      return;
    }

    if (!consentGiven) {
      setErrorMsg("Shaxsiy ma'lumotlarni qayta ishlashga rozilik bildirish majburiydir.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        name: `${firstName.trim()} ${lastName.trim()}`,
        birthDate,
        gender,
        region,
        bloodGroup,
        chronicDiseases: chronicDiseases.trim(),
        allergies: allergies.trim(),
        consentGiven: true,
        consentDate: new Date().toISOString(),
        isProfileComplete: true,
        role: 'patient' // Bemor roliga qat'iy cheklov
      };

      if (typeof updateUserProfile === 'function') {
        updateUserProfile(updatedData);
      }

      showToast("Profil ma'lumotlaringiz muvaffaqiyatli saqlandi!", 'success');
      if (onCompleted) {
        onCompleted(updatedData);
      }
    } catch (err) {
      setErrorMsg("Xatolik yuz berdi: " + (err.message || "Qayta urinib ko'ring"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-teal-50/50 via-slate-50 to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Yuqori banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Bir martalik to'ldirish</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">
                Bemor Profilini Shakllantirish
              </h1>
            </div>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-teal-50 dark:text-teal-100/90 leading-relaxed">
            Shifokor qabuliga navbat olish va shifokor sizning tibbiy ma'lumotingizni to'g'ri ko'rishi uchun quyidagi ma'lumotlarni to'ldiring.
          </p>
        </div>

        {/* Form qismi */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1-BO'LIM: Asosiy shaxsiy ma'lumotlar */}
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>1. Asosiy Shaxsiy Ma'lumotlar (Majburiy)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ismingiz <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Masalan: Sardor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Familiyangiz <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Masalan: Karimov"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tug'ilgan sana <span className="text-rose-500">*</span>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jinsi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Erkak">Erkak</option>
                  <option value="Ayol">Ayol</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefon raqam (SMS orqali tasdiqlangan)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    type="text"
                    disabled
                    value={phone}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hudud / Viloyat <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2-BO'LIM: Ixtiyoriy tibbiy ma'lumotlar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Sog'liq Ma'lumotlari (Ixtiyoriy)</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Faqat sizga va shifokorga ko'rinadi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qon guruhi
                </label>
                <div className="relative">
                  <Droplet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Allergiya (dori vositalari, oziq-ovqat va boshqa)
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Masalan: Penitsillin, chang, yong'oq (mavjud bo'lmasa bo'sh qoldiring)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Surunkali kasalliklar (agar mavjud bo'lsa)
                </label>
                <input
                  type="text"
                  value={chronicDiseases}
                  onChange={(e) => setChronicDiseases(e.target.value)}
                  placeholder="Masalan: Qandli diabet, Gipertoniya, Bronxial astma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* 3-BO'LIM: Majburiy rozilik */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/70 cursor-pointer hover:bg-teal-50 transition">
              <input
                type="checkbox"
                required
                checked={consentGiven}
                onChange={(e) => {
                  setConsentGiven(e.target.checked);
                  setErrorMsg('');
                }}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer flex-shrink-0"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Shaxsiy va tibbiy ma'lumotlarimni qayta ishlashga roziman</strong> (O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi qonuniga muvofiq, ma'lumotlar faqat navbat olish va shifokor bilan konsultatsiya o'tkazish maqsadida ishlatiladi).
              </span>
            </label>
          </div>

          {/* Tugma */}
          <button
            type="submit"
            disabled={isSubmitting || !consentGiven || !firstName.trim() || !lastName.trim() || !birthDate}
            className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-teal-600/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? "Saqlanmoqda..." : "Profilni Tasdiqlash va Navbat Tizimiga O'tish"}</span>
          </button>
        </form>

      </div>
    </div>
  );
};

export default PatientProfileOnboarding;
