import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Stethoscope, 
  Activity, 
  Heart, 
  Brain, 
  Sparkles, 
  UserCheck, 
  Baby, 
  Sun, 
  Eye, 
  User, 
  ShieldAlert, 
  Thermometer, 
  Droplet, 
  Droplets,
  Smile,
  ChevronRight,
  CheckCircle2,
  SlidersHorizontal,
  Layers
} from 'lucide-react';

const ICON_MAP = {
  Stethoscope,
  Activity,
  Heart,
  Brain,
  Sparkles,
  UserCheck,
  Baby,
  Sun,
  Eye,
  User,
  ShieldAlert,
  Thermometer,
  Droplet,
  Droplets,
  Smile
};

export const SpecialtiesSection = ({ onSpecialtySelect }) => {
  const { t, specialties, selectedSpecialty, setSelectedSpecialty, doctors, getLocalized } = useApp();
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const activeSpecialtyObj = specialties.find(s => s.id === selectedSpecialty);

  return (
    <section id="specialties-section" className="py-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <div className="inline-flex items-center space-x-2 text-teal-700 dark:text-teal-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>{t('specialties.title')}</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('specialties.subtitle')}
            </h2>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedSpecialty(null);
                setSelectedSubcategory(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedSpecialty === null 
                  ? 'bg-teal-600 text-white shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t('specialties.all')} ({doctors.length} {t('specialties.doctors_count')})
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          {specialties.map((spec) => {
            const IconComponent = ICON_MAP[spec.icon] || Stethoscope;
            const isSelected = selectedSpecialty === spec.id;
            
            // Count doctors in this specialty
            const docCount = doctors.filter(d => d.specialtyId === spec.id).length;
            const localizedName = getLocalized(spec, 'name');

            return (
              <div
                key={spec.id}
                onClick={() => {
                  // Open the new specialty doctors view
                  if (onSpecialtySelect) {
                    onSpecialtySelect(spec.id);
                    return;
                  }
                  // Fallback: old filter behaviour
                  if (isSelected) {
                    setSelectedSpecialty(null);
                    setSelectedSubcategory(null);
                  } else {
                    setSelectedSpecialty(spec.id);
                    setSelectedSubcategory(null);
                  }
                  const el = document.getElementById('doctors-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-40 ${
                  isSelected 
                    ? 'bg-teal-700 text-white border-teal-800 shadow-lg scale-102 ring-2 ring-teal-500/30' 
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-teal-600 dark:text-teal-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 group-hover:text-teal-700 dark:group-hover:text-teal-300'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    )}
                  </div>

                  <h3 className={`font-bold text-xs sm:text-sm leading-tight transition ${
                    isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300'
                  }`}>
                    {localizedName.split('(')[0]}
                  </h3>

                  {/* Short description — 2 lines max */}
                  <p className={`text-[10px] leading-tight mt-1.5 line-clamp-2 transition ${
                    isSelected
                      ? 'text-teal-100/90'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'
                  }`}>
                    {getLocalized(spec, 'description')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100/30 dark:border-slate-700/50">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {docCount > 0 ? `${docCount} ${t('specialties.doctors_count')}` : spec.badge}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300 dark:text-slate-600 group-hover:text-teal-500 dark:group-hover:text-teal-400'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Specialty Subcategory Filter pills */}
        {activeSpecialtyObj && activeSpecialtyObj.subcategories && (
          <div className="mt-6 p-4 bg-teal-50/80 dark:bg-teal-900/20 rounded-2xl border border-teal-200/80 dark:border-teal-800/50 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span className="text-xs font-bold text-teal-900 dark:text-teal-300 uppercase">
                  {getLocalized(activeSpecialtyObj, 'name')}:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubcategory(null)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    selectedSubcategory === null ? 'bg-teal-700 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-900/50'
                  }`}
                >
                  {t('specialties.all')}
                </button>
                {activeSpecialtyObj.subcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      selectedSubcategory === sub 
                        ? 'bg-teal-700 text-white font-bold' 
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
