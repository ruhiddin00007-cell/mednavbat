import React, { useRef, useEffect } from 'react';

/**
 * MedNavbat — 6-digit OTP Input Component
 * ───────────────────────────────────────
 * Imkoniyatlar:
 *  - 6 ta alohida katak
 *  - Raqam kiritilganda avtomatik keyingi katakka o'tish
 *  - Backspace bosilganda avvalgisiga o'tish
 *  - Clipboard dan 6 xonali kodni birdaniga paste qilish
 *  - Mobil qurilmalarda raqamli klaviatura (inputMode="numeric")
 */
export const OtpInput = ({
  value = '',
  onChange,
  onComplete,
  disabled = false,
  isError = false,
  length = 6
}) => {
  const inputRefs = useRef([]);

  // Qiymatni massivga aylantirish
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Birinchi bo'sh katakka fokus qo'yish
    if (!disabled && inputRefs.current[0]) {
      const firstEmptyIndex = digits.findIndex(d => !d);
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[targetIndex]?.focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const rawVal = e.target.value;
    const cleanDigit = rawVal.replace(/\D/g, '').slice(-1); // Faqat oxirgi raqam

    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    const newCombined = newDigits.join('');

    onChange?.(newCombined);

    // Agar raqam kiritilgan bo'lsa, keyingi katakka fokus
    if (cleanDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // 6 ta to'liq bo'lsa onComplete chaqirish
    if (newCombined.length === length && !newDigits.includes('')) {
      onComplete?.(newCombined);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Hozirgi katak bo'sh bo'lsa, avvalgisini tozalash va unga fokus
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange?.(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange?.(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedText) return;

    onChange?.(pastedText);

    // Eng oxirgi to'ldirilgan katakka yoki oxirgisiga fokus
    const nextFocusIndex = Math.min(pastedText.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();

    if (pastedText.length === length) {
      onComplete?.(pastedText);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => {
        const hasValue = Boolean(digits[idx]);

        return (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[idx]}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            disabled={disabled}
            aria-label={`${idx + 1}-raqam`}
            className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 transition-all outline-hidden ${
              isError
                ? 'border-rose-400 bg-rose-50/50 text-rose-700 dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-200'
                : hasValue
                ? 'border-teal-500 bg-teal-50/40 text-slate-900 dark:border-teal-400 dark:bg-teal-950/40 dark:text-white shadow-xs'
                : 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white hover:border-slate-300'
            } focus:border-teal-600 focus:ring-4 focus:ring-teal-500/20 disabled:opacity-50`}
          />
        );
      })}
    </div>
  );
};
