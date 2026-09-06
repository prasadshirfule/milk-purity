import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 4000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-900/90 text-white border-emerald-700',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
    },
    error: {
      bg: 'bg-rose-900/90 text-white border-rose-700',
      icon: <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
    },
    warning: {
      bg: 'bg-amber-900/90 text-white border-amber-700',
      icon: <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
    },
    info: {
      bg: 'bg-slate-900/90 text-white border-slate-700',
      icon: <Info className="w-5 h-5 text-sky-300 shrink-0" />
    }
  };

  const { bg, icon } = config[type];

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md border text-xs font-medium transition-all animate-in fade-in slide-in-from-bottom-2 ${bg}`}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="leading-snug">{message}</span>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-white/60 hover:text-white rounded-lg p-1 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
