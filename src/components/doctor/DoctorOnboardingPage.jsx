/**
 * DoctorOnboardingPage — Shifokorlar uchun Tanishtiruv Sahifasi
 * Shifokor kirish oynasidan oldin yoki "Shifokorlar uchun" havolasi orqali ochiladi.
 */
import React, { useState } from 'react';
import {
  Stethoscope, Calendar, CheckCircle2, Shield, UserCircle,
  Phone, ChevronRight, BookOpen, Clock, Users, Star,
  HeartPulse, LogIn, UserPlus, Globe, Sun, Moon, Coffee
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const STEPS = [
  {
    icon: <HeartPulse className="w-7 h-7" />,
    color: 'teal',
    title_uz: "Bu sayt nima?",
    title_ru: "Что такое сайт?",
    title_en: "What is this site?",
    desc_uz: "Med Navbat — bemorlar sizning ish vaqtingizga onlayn navbat oladigan platforma. Siz shifoxonada yoki shaxsiy kabinetingizda qabul qilasiz, bemorlar esa uydan chiqmasdan navbat oladi.",
    desc_ru: "Med Navbat — платформа, где пациенты могут записаться к вам онлайн. Вы принимаете в больнице или кабинете, пациенты записываются не выходя из дома.",
    desc_en: "Med Navbat is a platform where patients book appointments online. You see patients in your clinic or office; they book from home.",
  },
  {
    icon: <BookOpen className="w-7 h-7" />,
    color: 'indigo',
    title_uz: "Siz nima qilasiz?",
    title_ru: "Что вы делаете?",
    title_en: "What do you do?",
    desc_uz: "1) Ro'yxatdan o'tasiz va hujjatlaringizni yuklaydiz.\n2) Admin hujjatlaringizni tekshiradi (1-2 ish kuni).\n3) Ish jadvalingiz belgilanadi va bemorlar navbat ola boshlaydi.",
    desc_ru: "1) Регистрируетесь и загружаете документы.\n2) Администратор проверяет документы (1-2 рабочих дня).\n3) Устанавливается расписание, и пациенты начинают записываться.",
    desc_en: "1) Register and upload your documents.\n2) Admin verifies documents (1-2 business days).\n3) Your schedule is set and patients start booking.",
  },
  {
    icon: <Calendar className="w-7 h-7" />,
    color: 'emerald',
    title_uz: "Har kuni nima qilasiz?",
    title_ru: "Что делать каждый день?",
    title_en: "Daily routine?",
    desc_uz: "Ertalab: «Bugun ishga keldim» tugmasini bosasiz.\nNavbatlar ro'yxatini ko'rib, bemorlarni qabul qilasiz.\nKun oxirida: «Ertaga kelasizmi?» savoliga javob berasiz.\nBu bemorlar tushunmovchilikka tushmasa, navbat albatta yangilanadi.",
    desc_ru: "Утром: нажимаете «Я сегодня на работе».\nСмотрите список записей, принимаете пациентов.\nВечером: отвечаете на вопрос «Придёте завтра?»\nЭто помогает пациентам и обновляет расписание.",
    desc_en: "Morning: tap 'I'm at work today'.\nView appointment list, see patients.\nEvening: answer 'Coming tomorrow?'\nThis keeps patients informed and updates the schedule.",
  },
  {
    icon: <Coffee className="w-7 h-7" />,
    color: 'amber',
    title_uz: "Dam olmoqchi bo'lsangiz?",
    title_ru: "Хотите взять выходной?",
    title_en: "Want time off?",
    desc_uz: "Ertangi kun uchun dam olish so'rovini bugun kun oxirigacha yuboring. Admin tasdiqlashini kuting. Tasdiqlangach, o'sha kunlar yopiladi — yangi bemorlar yoza olmaydi. Arizalar 1-2 soat ichida ko'rib chiqiladi.",
    desc_ru: "Отправьте заявку на выходной до конца сегодняшнего дня. Дождитесь подтверждения администратора. После подтверждения дни будут закрыты — новые записи не принимаются.",
    desc_en: "Submit a leave request by end of today for tomorrow. Wait for admin approval. Once approved, those days are closed — no new bookings accepted.",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    color: 'rose',
    title_uz: "Maxfiylik",
    title_ru: "Конфиденциальность",
    title_en: "Privacy",
    desc_uz: "Siz faqat o'zingizga yozilgan bemorlarni ko'rasiz. Boshqa shifokorlarning bemorlari ko'rinmaydi. Bemorlarning tibbiy ma'lumotlarini (tashxis, retsept) hech kimga bermaysiz — bu qonuniy talabdir.",
    desc_ru: "Вы видите только своих пациентов. Пациенты других врачей не отображаются. Медицинские данные пациентов (диагнозы, рецепты) нельзя передавать третьим лицам.",
    desc_en: "You only see your own patients. Other doctors' patients are not visible. Medical data (diagnoses, prescriptions) must not be shared with anyone.",
  },
  {
    icon: <UserCircle className="w-7 h-7" />,
    color: 'purple',
    title_uz: "Profilingiz",
    title_ru: "Ваш профиль",
    title_en: "Your profile",
    desc_uz: "Profilga surating va ma'lumotlaringizni qo'shing. Rasm admin tomonidan tekshiriladi. Tasdiqlangunga qadar bemorlar umumiy avatarni ko'radi. Mutaxassislik, narx, ish jadvali profilda ko'rinadi.",
    desc_ru: "Добавьте фото и информацию в профиль. Фото проверяет администратор. До подтверждения пациенты видят стандартный аватар. Специализация, цена и расписание отображаются в профиле.",
    desc_en: "Add your photo and details to the profile. Admin reviews the photo. Until approved, patients see a default avatar. Specialty, price, and schedule appear in the profile.",
  },
];

const COLOR_CLASSES = {
  teal:    { bg: 'bg-teal-100 dark:bg-teal-950/60',    text: 'text-teal-600 dark:text-teal-400',    ring: 'ring-teal-500' },
  indigo:  { bg: 'bg-indigo-100 dark:bg-indigo-950/60',text: 'text-indigo-600 dark:text-indigo-400',ring: 'ring-indigo-500' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-950/60',text: 'text-emerald-600 dark:text-emerald-400',ring: 'ring-emerald-500' },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-950/60',  text: 'text-amber-600 dark:text-amber-400',  ring: 'ring-amber-500'  },
  rose:    { bg: 'bg-rose-100 dark:bg-rose-950/60',    text: 'text-rose-600 dark:text-rose-400',    ring: 'ring-rose-500'   },
  purple:  { bg: 'bg-purple-100 dark:bg-purple-950/60',text: 'text-purple-600 dark:text-purple-400',ring: 'ring-purple-500' },
};

export const DoctorOnboardingPage = ({ onLogin, onRegister }) => {
  const { language = 'uz-Latn', theme, toggleTheme } = useApp();
  const isRu = language.startsWith('ru');
  const isEn = language.startsWith('en');

  const title = (step) => isRu ? step.title_ru : isEn ? step.title_en : step.title_uz;
  const desc  = (step) => isRu ? step.desc_ru  : isEn ? step.desc_en  : step.desc_uz;

  const heading = isRu ? 'Med Navbat shifokorlar uchun'
    : isEn ? 'Med Navbat for Doctors'
    : "Med Navbat — Shifokorlar Uchun";

  const subtitle = isRu ? 'Простая платформа для управления записями пациентов'
    : isEn ? 'Simple platform for managing patient appointments'
    : "Bemorlar bilan navbat tizimi — oddiy, qulay, xavfsiz";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white">
              Med<span className="text-teal-600 dark:text-teal-400">Navbat</span>
            </span>
            <span className="hidden sm:block text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              Shifokorlar
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 flex items-center justify-center transition">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold transition"
              style={{ minHeight: 36 }}
            >
              <LogIn className="w-3.5 h-3.5" />
              {isRu ? 'Войти' : isEn ? 'Login' : 'Kirish'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* ── Hero ── */}
        <div className="text-center space-y-4 py-6">
          <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-4 py-1.5 rounded-full text-xs font-extrabold border border-teal-200 dark:border-teal-800">
            <Stethoscope className="w-4 h-4" />
            <span>{isRu ? 'Для врачей' : isEn ? 'For doctors' : 'Shifokorlar uchun'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            {heading}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            {subtitle}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 pt-4">
            {[
              { val: '150+', label: isRu ? 'Врачей' : isEn ? 'Doctors' : 'Shifokor' },
              { val: '45+',  label: isRu ? 'Клиник' : isEn ? 'Clinics' : 'Klinika' },
              { val: '99%',  label: isRu ? 'Довольных' : isEn ? 'Satisfied' : 'Mamnun' },
            ].map(s => (
              <div key={s.val} className="text-center">
                <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{s.val}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Steps ── */}
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {isRu ? 'Как это работает' : isEn ? 'How it works' : 'Qanday ishlaydi'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STEPS.map((step, i) => {
              const cc = COLOR_CLASSES[step.color] || COLOR_CLASSES.teal;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${cc.bg} ${cc.text}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
                          {i + 1}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">{title(step)}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                    {desc(step)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-extrabold text-lg">
              {isRu ? 'Есть вопросы?' : isEn ? 'Have questions?' : 'Savollar bormi?'}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              {isRu ? 'Свяжитесь с нами' : isEn ? 'Contact us' : "Biz bilan bog'laning"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:+998951411007"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold transition border border-white/20"
              style={{ minHeight: 44 }}
            >
              <Phone className="w-4 h-4" />
              +998 95 141-10-07
            </a>
          </div>
        </div>

        {/* ── CTA Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-4 pb-8">
          <button
            onClick={onRegister}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-teal-500/25 transition transform active:scale-95"
            style={{ minHeight: 52 }}
          >
            <UserPlus className="w-5 h-5" />
            {isRu ? "Зарегистрироваться" : isEn ? "Register" : "Ro'yxatdan o'tish"}
          </button>
          <button
            onClick={onLogin}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-700 transition transform active:scale-95"
            style={{ minHeight: 52 }}
          >
            <LogIn className="w-5 h-5" />
            {isRu ? 'Войти' : isEn ? 'Login' : 'Kirish'}
          </button>
        </div>
      </main>
    </div>
  );
};
