import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { getYandexMapUrl, resolveClinicLocation } from '../../utils/yandexMaps';

/**
 * ClinicLocationLink — Klinika nomini Yandex Xaritalarga to'g'ridan-to'g'ri ochuvchi komponent
 *
 * Xususiyatlari:
 * 1. Oddiy <a href target="_blank" rel="noopener noreferrer"> ishlatadi.
 *    - window.open ishlatilmaydi (telefon brauzerlari uni bloklamaydi).
 *    - yandexmaps:// ishlatilmaydi (ilovasi yo'q iPhone da xato chiqarmaydi).
 *    - Telefonda Yandex Maps ilovasi bo'lsa, OS (Universal Link) orqali o'zi ilovani ochadi.
 *    - PWA (o'rnatilgan ilova) rejimida ham yangi oynada Yandex'ni ochadi, sayt yopilmaydi.
 * 2. Telefonda qulay:
 *    - Bosiladigan joy kamida 44px (min-h-[44px])
 *    - Matn tanlanib qolmaydi (select-none)
 *    - Bosganda yengil rang/kichrayish (active:scale-[0.98] active:opacity-80) bilan javob beradi.
 * 3. Mavjud dizayn, ranglar va joylashuv 100% saqlangan.
 */
export const ClinicLocationLink = ({
  hospital,
  name,
  address,
  lat,
  lon,
  className = '',
  linkClassName = '',
  iconClassName = 'w-3.5 h-3.5 text-rose-500 mr-1.5 flex-shrink-0',
  showPin = true,
  showRouteAction = false,
  routeText = "Yo'l ko'rsatish",
  children,
  onClick,
}) => {
  const hospitalData = hospital || { name, address, lat, lon };
  const url = getYandexMapUrl(hospitalData);
  const loc = resolveClinicLocation(hospitalData);
  const displayName = children || name || loc.name || 'Klinika';

  const handleClick = (e) => {
    // Kartochka yoki ota elementning boshqa hodisalari (masalan modal ochish) ishlab ketmasligi uchun
    e.stopPropagation();
    if (onClick) onClick(e);
    // e.preventDefault QILINMAYDI — havola o'zi to'g'ridan-to'g'ri ochiladi
  };

  const titleText = `📍 ${loc.name} — Yandex Xaritalarda yo'l ko'rsatish (${
    loc.hasCoordinates ? 'Koordinata bilan' : 'Manzil qidiruvi'
  })`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title={titleText}
      aria-label={titleText}
      className={`inline-flex items-center min-h-[44px] py-0.5 cursor-pointer select-none rounded-lg text-left group transition-all duration-150 active:scale-[0.98] active:opacity-80 focus:outline-none focus:ring-1 focus:ring-teal-500/50 ${className}`}
    >
      <span className={`inline-flex items-center min-w-0 max-w-full ${linkClassName}`}>
        {showPin && (
          <MapPin
            className={`transition-transform duration-150 group-hover:scale-110 group-active:scale-95 ${iconClassName}`}
            aria-hidden="true"
          />
        )}
        <span className="truncate group-hover:underline underline-offset-2 font-medium">
          {displayName}
        </span>
      </span>

      {showRouteAction && (
        <span
          className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 group-hover:bg-teal-100 dark:group-hover:bg-teal-900 border border-teal-200 dark:border-teal-800 px-2 py-1 rounded-md transition-colors flex-shrink-0"
        >
          <Navigation className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          <span>{routeText}</span>
        </span>
      )}
    </a>
  );
};

export default ClinicLocationLink;
