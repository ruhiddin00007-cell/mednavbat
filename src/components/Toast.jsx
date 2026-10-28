import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-900/90 border-emerald-500 text-emerald-100',
    info: 'bg-sky-900/90 border-sky-500 text-sky-100',
    warning: 'bg-amber-900/90 border-amber-500 text-amber-100',
    error: 'bg-rose-900/90 border-rose-500 text-rose-100'
  }[toast.type || 'info'];

  const Icons = {
    success: CheckCircle2,
    info: Info,
    warning: AlertCircle,
    error: AlertCircle
  }[toast.type || 'info'];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short max-w-md w-full px-4">
      <div className={`flex items-center space-x-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md ${bgStyles}`}>
        <Icons className="w-6 h-6 flex-shrink-0 text-emerald-400" />
        <div className="flex-1 text-sm font-medium">
          {toast.message}
        </div>
      </div>
    </div>
  );
};
