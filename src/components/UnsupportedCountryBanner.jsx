import React from 'react';
import { Globe2, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { getVerifiedDoctors } from '../data/doctorsRepository';

export const UnsupportedCountryBanner = ({ 
  selectedCountry, 
  onSwitchToUzbekistan, 
  onChangeLocation,
  onDismiss
}) => {
  if (!selectedCountry || selectedCountry.code === 'UZ' || selectedCountry.iso2 === 'UZ') {
    return null;
  }

  const countryDoctors = getVerifiedDoctors().filter(
    d => d.countryId === (selectedCountry.code || selectedCountry.iso2)
  );

  return (
    <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border-b border-teal-200 dark:border-teal-800/80 px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2.5 text-teal-950 dark:text-teal-200 text-center sm:text-left">
          <span className="text-xl flex-shrink-0">{selectedCountry.flag}</span>
          <div className="leading-tight">
            <span className="font-extrabold">{selectedCountry.nameUz || selectedCountry.name}</span>:
            <span className="ml-1 opacity-90">
              {countryDoctors.length > 0 
                ? `Ushbu davlat bo'yicha ${countryDoctors.length} ta litsenziyalangan shifokor va mahalliy vaqt zonasi bo'yicha qabul mavjud.`
                : `Xalqaro tibbiy xizmatlar va konsultatsiyalar bo'limi.`}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={onSwitchToUzbekistan}
            className="flex items-center space-x-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <span>🇺🇿 O'zbekiston</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={onChangeLocation}
            className="px-2.5 py-1 bg-white/80 dark:bg-slate-800 hover:bg-white text-slate-700 dark:text-slate-300 rounded-lg font-semibold border border-teal-200 dark:border-teal-800 transition cursor-pointer"
          >
            Davlatni o'zgartirish
          </button>
        </div>
      </div>
    </div>
  );
};
