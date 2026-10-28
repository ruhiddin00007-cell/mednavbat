import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, 
  X, 
  Lock, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  User, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const AdminCardModal = () => {
  const { 
    activeModal, 
    setActiveModal, 
    adminCard, 
    saveAdminCard 
  } = useApp();

  const [cardNumber, setCardNumber] = useState(adminCard?.cardNumber || '8600492817264521');
  const [holderName, setHolderName] = useState(adminCard?.holderName || 'ADMINISTRATOR');
  const [expiryDate, setExpiryDate] = useState(adminCard?.expiryDate || '12/28');
  const [bankName, setBankName] = useState(adminCard?.bankName || 'Kapitalbank');
  const [cardType, setCardType] = useState(adminCard?.cardType || 'Uzcard');

  if (activeModal !== 'admin-card') return null;

  // Karta raqamini formatlash (har 4 ta raqamdan keyin bo'sh joy)
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(raw);

    // Karta turini avtomatik aniqlash
    if (raw.startsWith('8600')) setCardType('Uzcard');
    else if (raw.startsWith('9860')) setCardType('Humo');
    else if (raw.startsWith('4')) setCardType('Visa');
    else if (raw.startsWith('5')) setCardType('Mastercard');
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setExpiryDate(raw);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cardNumber.length < 16) {
      alert("Iltimos, to'liq 16 xonali karta raqamini kiriting.");
      return;
    }

    saveAdminCard({
      cardNumber,
      holderName: holderName.trim().toUpperCase(),
      expiryDate,
      bankName: bankName.trim(),
      cardType
    });

    setActiveModal(null);
  };

  // Maskalangan ko'rinish
  const formattedDisplayNumber = cardNumber.length === 16
    ? `${cardNumber.slice(0, 4)} •••• •••• ${cardNumber.slice(12, 16)}`
    : cardNumber.replace(/(\d{4})/g, '$1 ').trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 relative my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-900 text-white p-6 relative">
          <button
            onClick={() => setActiveModal(null)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Mening Bank Kartam
              </h3>
              <p className="text-xs text-teal-200/80">
                Tushgan pullarni shaxsiy hisobingizga chiqarib olish uchun karta
              </p>
            </div>
          </div>
        </div>

        {/* Card Live Preview Widget */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="w-full max-w-sm mx-auto h-48 rounded-3xl bg-gradient-to-tr from-slate-900 via-teal-950 to-emerald-800 text-white p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-teal-500/30">
            {/* Background design elements */}
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-teal-400/10 pointer-events-none" />

            <div className="flex items-center justify-between z-10">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black tracking-widest text-teal-300 uppercase">{bankName || 'BANK'}</span>
              </div>
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wider">
                {cardType}
              </span>
            </div>

            {/* Chip Icon */}
            <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-300 to-amber-500 border border-amber-200 shadow-sm flex items-center justify-center z-10 opacity-90">
              <div className="w-6 h-4 border border-amber-600/40 rounded-sm" />
            </div>

            {/* Card Number */}
            <div className="z-10">
              <div className="font-mono text-lg font-bold tracking-widest text-slate-100">
                {formattedDisplayNumber || '•••• •••• •••• ••••'}
              </div>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-between text-xs z-10">
              <div>
                <span className="text-[9px] text-teal-200/70 uppercase block font-semibold">Karta Egasi</span>
                <span className="font-bold tracking-wide uppercase truncate max-w-[170px] block">
                  {holderName || 'ADMINISTRATOR'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-teal-200/70 uppercase block font-semibold">Muddat</span>
                <span className="font-bold font-mono">
                  {expiryDate || 'MM/YY'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Karta Raqami (16 xonali):
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="8600 0000 0000 0000"
                maxLength={16}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Xavfsizlik: Tizimda karta raqami faqat oxirgi 4 xonasi ko'rinadigan qilib saqlanadi.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Karta Egasi F.I.Sh:
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                  placeholder="ADMINISTRATOR"
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amal qilish muddati (MM/YY):
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="12/28"
                  maxLength={5}
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Nomi:
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Kapitalbank, TBC, Ipak Yo'li"
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Karta Turi:
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Uzcard">Uzcard (8600)</option>
                <option value="Humo">Humo (9860)</option>
                <option value="Visa">Visa (4...)</option>
                <option value="Mastercard">Mastercard (5...)</option>
              </select>
            </div>
          </div>

          {/* Security Alert Badge */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Karta ma'lumotlari shifrlangan holda faqat admin sessiyasi uchun saqlanadi.</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center space-x-1.5 transition transform active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kartani Xavfsiz Saqlash</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
