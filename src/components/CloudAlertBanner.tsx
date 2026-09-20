'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertTriangle, X, Cloud } from 'lucide-react';

export const CloudAlertBanner: React.FC = () => {
  const { cloudAlert, dismissCloudAlert } = useApp();

  if (!cloudAlert) return null;

  const isSuccess = cloudAlert.type === 'success';

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
          isSuccess
            ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
            : 'bg-slate-900/95 border-rose-500/50 text-rose-300 shadow-rose-950/50'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
        </div>

        <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-wider text-[10px]">
            <Cloud className="w-3.5 h-3.5" />
            <span>{isSuccess ? 'Đồng Bộ Cloud Thành Công' : 'Cảnh Báo Cloud Database'}</span>
          </div>
          <p className="text-slate-200">{cloudAlert.message}</p>
        </div>

        <button
          onClick={dismissCloudAlert}
          className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
