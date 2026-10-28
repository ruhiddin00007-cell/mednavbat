/**
 * PhoneLink — Universal telefon havola komponenti
 * ──────────────────────────────────────────────────────
 * Xususiyatlar:
 *  1. tel: havolasini avtomatik yasaydi (probel, qavs, chiziqchasiz)
 *  2. Mobil: bosilganda darhol qo'ng'iroq, min 44px touch target
 *  3. Kompyuter: bosilganda raqam nusxalash tugmasi chiqadi
 *  4. iPhone Safari avtomatik havolasiga qarshi (format-detection=no bilan birgalikda)
 *  5. Active holat: yengil rang o'zgarishi
 */
import React, { useState, useCallback } from 'react';
import { phoneToTelHref } from '../../utils/phoneFormatter';
import { Copy, Check, Phone } from 'lucide-react';

export const PhoneLink = ({
  phone,           // Ko'rinadigan raqam matni, masalan "+998 (95) 141-10-07" yoki "103"
  href,            // Ixtiyoriy: tayyor tel: havola (bo'lmasa phone dan yasaladi)
  className = '',  // Qo'shimcha CSS klasslar
  children,        // Ixtiyoriy: raqam o'rniga boshqa tarkib
  showIcon = false,// Telefon ikonini ko'rsatish
  emergency = false, // Tez yordam (103) — alohida ko'zga tashlanaigan stil
  copyOnDesktop = true, // Kompyuterda nusxalash tugmasini ko'rsatish
  style,
  onClick,
  ...rest
}) => {
  const [copied, setCopied] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  const telHref = href || phoneToTelHref(phone);
  const displayText = children || phone || '';

  // Nusxalash (kompyuter uchun)
  const handleCopy = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const textToCopy = phone || telHref.replace('tel:', '');
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API yo'q bo'lsa — hech narsa
    }
  }, [phone, telHref]);

  const handleClick = useCallback((e) => {
    if (onClick) onClick(e);
  }, [onClick]);

  return (
    <span
      className={`inline-flex items-center gap-1 group relative ${emergency ? 'font-extrabold' : ''}`}
      onMouseEnter={() => copyOnDesktop && setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {showIcon && (
        <Phone className={`w-3.5 h-3.5 flex-shrink-0 ${emergency ? 'text-rose-500' : 'text-teal-500'}`} aria-hidden="true" />
      )}
      <a
        href={telHref}
        className={`
          inline-flex items-center
          min-h-[44px] py-1
          transition-colors duration-150
          active:opacity-70
          select-text
          ${emergency
            ? 'text-rose-400 hover:text-rose-300 active:text-rose-200'
            : 'hover:opacity-80 active:opacity-60'
          }
          ${className}
        `}
        style={style}
        onClick={handleClick}
        {...rest}
      >
        {displayText}
      </a>
      {/* Kompyuterda hover bosilganda raqam nusxalash tugmasi */}
      {copyOnDesktop && showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          title="Raqamni nusxalash"
          aria-label="Raqamni nusxalash"
          className="hidden md:inline-flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] font-bold transition-all duration-150 active:scale-95 border border-slate-200 dark:border-slate-700 select-none flex-shrink-0"
        >
          {copied
            ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Nusxalandi!</span></>
            : <><Copy className="w-3 h-3" /><span>Nusxalash</span></>
          }
        </button>
      )}
    </span>
  );
};

export default PhoneLink;
