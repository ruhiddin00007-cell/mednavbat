import React from 'react';
import { useApp } from '../context/AppContext';
import { Wifi, Battery, Signal, Home, Calendar, Stethoscope, ShieldCheck, Search, User } from 'lucide-react';

export const MobileSimulatorFrame = ({ children }) => {
  const { isMobileSimulated, currentRole, isAdminAuthenticated } = useApp();

  if (!isMobileSimulated) return <>{children}</>;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="py-10 bg-slate-950 min-h-screen flex items-center justify-center p-4">
      
      {/* Smartphone Container Shell */}
      <div className="mobile-frame-container bg-white flex flex-col justify-between shadow-2xl relative">
        
        {/* Top Smartphone Notch & Status bar */}
        <div className="bg-slate-900 text-white text-[11px] px-6 py-2 flex items-center justify-between z-50">
          <span className="font-bold">09:41</span>
          
          <div className="mobile-notch flex items-center justify-center">
            <div className="w-12 h-3 bg-slate-800 rounded-full" />
          </div>

          <div className="flex items-center space-x-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Scrollable Mobile Content viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>

        {/* Mobile App Bottom Navigation — Faqat ruxsat etilgan rol amallari */}
        <div className="bg-slate-900 text-slate-300 p-2 border-t border-slate-800 flex items-center justify-around z-50">
          {currentRole === 'patient' && (
            <>
              <button 
                onClick={() => scrollToSection('top')}
                className="flex flex-col items-center space-y-1 p-1 text-[10px] font-bold text-teal-400"
              >
                <Home className="w-5 h-5" />
                <span>Asosiy</span>
              </button>

              <button 
                onClick={() => scrollToSection('doctors-section')}
                className="flex flex-col items-center space-y-1 p-1 text-[10px] font-bold text-slate-400 hover:text-white"
              >
                <Search className="w-5 h-5" />
                <span>Shifokorlar</span>
              </button>

              <button 
                onClick={() => scrollToSection('my-appointments-section')}
                className="flex flex-col items-center space-y-1 p-1 text-[10px] font-bold text-slate-400 hover:text-white"
              >
                <Calendar className="w-5 h-5" />
                <span>Navbatlarim</span>
              </button>

              <button 
                onClick={() => scrollToSection('specialties-section')}
                className="flex flex-col items-center space-y-1 p-1 text-[10px] font-bold text-slate-400 hover:text-white"
              >
                <User className="w-5 h-5" />
                <span>Yo'nalishlar</span>
              </button>
            </>
          )}

          {currentRole === 'doctor' && (
            <div className="flex items-center justify-center gap-2 text-teal-400 text-xs font-bold py-1">
              <Stethoscope className="w-4 h-4" />
              <span>Shifokor Mobil Kabineti</span>
            </div>
          )}

          {currentRole === 'admin' && isAdminAuthenticated && (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold py-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Mobil Paneli</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
