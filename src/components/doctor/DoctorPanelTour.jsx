/**
 * DoctorPanelTour — Shifokor Paneli Ko'rsatmasi (Onboarding Tour)
 * Birinchi marta kirgan shifokorga 4-5 qadam ko'rsatma
 */
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const TOUR_KEY = 'mednavbat_doctor_tour_done';

const STEPS = [
  {
    title: "Xush kelibsiz, shifokor! 👋",
    desc: "Bu — sizning shaxsiy boshqaruv panelingiz. Keling, asosiy imkoniyatlar bilan tanishtiramiz.",
    target: null,
  },
  {
    title: "📅 Bugungi navbatlar",
    desc: "\"Bugungi bemorlar navbati\" tabida sizga yozilgan bemorlarni ko'rasiz. Qabul yakunlangach \"Tekshirildi\" tugmasini bosing.",
    target: 'timeline',
  },
  {
    title: "🔔 Xabarlar markazi",
    desc: "\"Xabarlar\" tabida yangi navbat, admin xabarlari, ariza natijalari va boshqa muhim bildirishnomalar keladi.",
    target: 'notifications',
  },
  {
    title: "📊 Davomat va dam olish",
    desc: "\"Davomat\" tabida ertalabgi \"Ishga keldim\" va kunlik eslatmalarga javob bering. Dam olish so'rovini ham shu yerdan yuboring.",
    target: 'attendance',
  },
  {
    title: "⭐ Sharhlar va reyting",
    desc: "Bemorlar qoldirgan baholarni \"Sharhlar\" tabida ko'rasiz. Reytingiz bemorlarga ko'rinadi.",
    target: 'reviews',
  },
];

export const DoctorPanelTour = ({ onTabChange }) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      const target = STEPS[step + 1].target;
      if (target && onTabChange) onTabChange(target);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(s => s - 1);
      const target = STEPS[step - 1].target;
      if (target && onTabChange) onTabChange(target);
    }
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-teal-500' : i < step ? 'w-3 bg-teal-300 dark:bg-teal-700' : 'w-3 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{current.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">{current.desc}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={prev}
              className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              style={{ minHeight: 44 }}
            >
              <ChevronLeft className="w-4 h-4" />
              Orqaga
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition"
            style={{ minHeight: 44 }}
          >
            {step === STEPS.length - 1 ? (
              <><Check className="w-4 h-4" /> Boshlash</>
            ) : (
              <>Keyingisi <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        <button
          onClick={dismiss}
          className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          O'tkazib yuborish
        </button>
      </div>
    </div>
  );
};

export function resetDoctorTour() {
  localStorage.removeItem(TOUR_KEY);
}
