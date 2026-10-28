import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Award, 
  Building2, 
  Calendar, 
  Phone, 
  Mail, 
  Edit3, 
  LogOut, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { DoctorRegistrationForm } from '../auth/DoctorRegistrationForm';

export const DoctorPendingReviewView = ({ doctor }) => {
  const { t, logoutUser } = useApp();
  const [isEditingResubmit, setIsEditingResubmit] = useState(false);

  const isRejected = doctor?.status === 'rejected';

  if (isEditingResubmit) {
    return (
      <div className="py-8 bg-slate-100 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Arizani Tuzatish va Qayta Topshirish
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Rad etish sababiga ko'ra ma'lumotlaringizni to'g'irlang va yangi fayllarni yuklab qayta yuboring.
              </p>
            </div>

            <DoctorRegistrationForm
              initialValues={doctor}
              onBack={() => setIsEditingResubmit(false)}
              onComplete={() => setIsEditingResubmit(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 bg-slate-100 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Status Header Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
          isRejected 
            ? 'bg-gradient-to-br from-rose-900 to-slate-900 border-rose-800 text-white' 
            : 'bg-gradient-to-br from-amber-900/90 via-slate-900 to-slate-900 border-amber-800/80 text-white'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                isRejected ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {isRejected ? <AlertTriangle className="w-8 h-8" /> : <Clock className="w-8 h-8 animate-pulse" />}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 mb-1">
                  <span>Holat:</span>
                  <span className={isRejected ? 'text-rose-300' : 'text-amber-300'}>
                    {isRejected ? "Rad etilgan" : "Tasdiqlanishi kutilmoqda"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  {isRejected ? t('doctor_reg.rejected_title', "Arizangiz rad etildi") : t('doctor_reg.under_review_title', "Arizangiz ko'rib chiqilmoqda")}
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                  {isRejected
                    ? "Arizangizda noaniqliklar yoki xatoliklar mavjudligi sababli ma'muriyat tomonidan rad etildi. Sababini o'rganib qayta topshirishingiz mumkin."
                    : t('doctor_reg.under_review_desc', "Arizangiz va yuklangan hujjatlaringiz ma'muriyat tomonidan ko'rib chiqilmoqda. Tasdiqlangach SMS yoki email orqali xabar beriladi.")}
                </p>
              </div>
            </div>

            <button
              onClick={() => logoutUser()}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition self-end sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>

          {/* Rad etish sababi qutisi */}
          {isRejected && doctor?.rejectionReason && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-700/80 space-y-1.5 animate-in fade-in">
              <span className="text-xs font-extrabold text-rose-300 uppercase tracking-wider block">
                Rad etish sababi:
              </span>
              <p className="text-sm font-bold text-white leading-relaxed">
                "{doctor.rejectionReason}"
              </p>
            </div>
          )}

          {/* Rad etilgan bo'lsa qayta topshirish tugmasi */}
          {isRejected && (
            <div className="mt-5 pt-4 border-t border-rose-800/60 flex justify-end">
              <button
                onClick={() => setIsEditingResubmit(true)}
                className="px-5 py-3 bg-white text-rose-900 hover:bg-rose-50 rounded-2xl text-xs font-extrabold shadow-lg flex items-center gap-2 transition active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t('doctor_reg.resubmit_btn', "Ma'lumotlarni tuzatish va qayta topshirish")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Maxfiylik va Xavfsizlik Eslatmasi */}
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
          <div className="space-y-1">
            <span className="font-extrabold block">Bemorlar maxfiyligi va himoyasi:</span>
            <p className="text-[11px] leading-relaxed opacity-90">
              O'zbekiston Respublikasi tibbiy me'yorlari va MedNavbat xavfsizlik qoidalariga muvofiq, ma'muriyat tomonidan litsenziyangiz to'liq tasdiqlanmaguncha bemorlar ma'lumotlari yopiq turadi, shuningdek shifokorlar umumiy ro'yxatida ko'rinmaysiz.
            </p>
          </div>
        </div>

        {/* Arizada topshirilgan ma'lumotlar ko'rinishi */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Arizada Topshirilgan Ma'lumotlar
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              ID: {doctor?.id || doctor?.doctorId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400 font-bold block">Shifokor ismi:</span>
              <p className="font-black text-slate-900 dark:text-white text-sm">
                {doctor?.fullName || doctor?.name}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400 font-bold block">Mutaxassislik:</span>
              <p className="font-black text-slate-900 dark:text-white text-sm">
                {doctor?.specialtyName || doctor?.specialty}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400 font-bold block">Ish tajribasi:</span>
              <p className="font-black text-slate-900 dark:text-white">
                {doctor?.experienceYears || 0} yil
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400 font-bold block">Shifoxona / Ish joyi:</span>
              <p className="font-black text-slate-900 dark:text-white">
                {doctor?.hospitalName || "Ko'rsatilmagan"}
                {doctor?.hospitalRegion ? ` (${doctor.hospitalRegion})` : ''}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400 font-bold block">Diplom raqami:</span>
              <p className="font-black text-slate-900 dark:text-white">
                {doctor?.diplomaNumber || "Mavjud"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400 font-bold block">Litsenziya raqami va muddati:</span>
              <p className="font-black text-slate-900 dark:text-white">
                {doctor?.licenseNumber || "Mavjud"} ({doctor?.licenseExpiry || "Amal qilish muddati belgilangan"})
              </p>
            </div>
          </div>

          {/* Yuklangan Hujjatlar Holati */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Yuklangan Hujjatlar Nusxalari:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span className="font-bold">Diplom nusxasi</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Yuklangan</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">Litsenziya nusxasi</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Yuklangan</span>
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorPendingReviewView;
