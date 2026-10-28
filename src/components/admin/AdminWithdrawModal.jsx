import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  ArrowDownCircle, 
  X, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Wallet
} from 'lucide-react';

export const AdminWithdrawModal = () => {
  const { 
    activeModal, 
    setActiveModal, 
    availableBalance, 
    adminCard, 
    requestWithdrawal 
  } = useApp();

  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (activeModal !== 'admin-withdraw') return null;

  const rawNum = adminCard?.cardNumber || '';
  const maskedCard = rawNum.length >= 8
    ? `${rawNum.slice(0, 4)} •••• •••• ${rawNum.slice(-4)}`
    : '8600 •••• •••• 4521';

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
    setErrorMsg('');
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const num = Number(amount);
    if (!num || num <= 0) {
      setErrorMsg("Iltimos, yechib olinadigan to'g'ri summani kiriting!");
      return;
    }

    if (num > availableBalance) {
      setErrorMsg("Kiritilgan summa mavjud balansdan ko'p!");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const success = requestWithdrawal(num);
      setIsProcessing(false);
      if (success) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (err) {
          console.error(err);
        }
        setActiveModal(null);
        setAmount('');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 relative my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={() => setActiveModal(null)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <ArrowDownCircle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
                Mablag' Chiqarish
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Pul Yechib Olish
              </h3>
            </div>
          </div>
        </div>

        {/* Current Available Balance Banner */}
        <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Yechib Olish Mumkin Bo'lgan Sof Balans:
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {availableBalance.toLocaleString()} <span className="text-sm font-bold">UZS</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleWithdraw} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Receiving Card Mini Widget */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Tushadigan Karta:</span>
                <span className="font-mono text-xs font-bold tracking-wider text-teal-300">
                  {maskedCard}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {adminCard?.bankName || 'Kapitalbank'} • {adminCard?.holderName || 'ADMIN'}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setActiveModal('admin-card')}
              className="text-[11px] font-bold text-teal-400 hover:text-teal-300 underline"
            >
              O'zgartirish
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Yechib Olinadigan Summa (UZS):
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min={10000}
                max={availableBalance}
                step={10000}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masalan: 1 000 000"
                className="w-full text-base font-extrabold pl-4 pr-16 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                UZS
              </span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Tezkor tanlov:
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(500000)}
                disabled={availableBalance < 500000}
                className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition disabled:opacity-40"
              >
                500 ming
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(1000000)}
                disabled={availableBalance < 1000000}
                className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition disabled:opacity-40"
              >
                1 mln
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(3000000)}
                disabled={availableBalance < 3000000}
                className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition disabled:opacity-40"
              >
                3 mln
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(availableBalance)}
                disabled={availableBalance <= 0}
                className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-800 rounded-xl text-[11px] font-extrabold transition disabled:opacity-40"
              >
                Hammasi
              </button>
            </div>
          </div>

          {/* Fee & Receipt Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Chiqarish komissiyasi:</span>
              <span className="font-bold text-emerald-600">0% (Bepul)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>O'tkazma muddati:</span>
              <span className="font-bold text-slate-800">1 - 3 daqiqa</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900">
              <span>Kartaga o'tadigan summa:</span>
              <span className="text-emerald-700 text-sm">
                {(Number(amount) || 0).toLocaleString()} UZS
              </span>
            </div>
          </div>

          {/* Actions */}
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
              disabled={isProcessing || availableBalance <= 0}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? "O'tkazilmoqda..." : "Kartaga O'tkazishni Tasdiqlash"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
