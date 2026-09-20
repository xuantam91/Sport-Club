'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Client Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-rose-500/30 max-w-md w-full text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Đã xảy ra sự cố hiển thị</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Hệ thống đã tự động ghi nhận lỗi. Bạn có thể bấm Thử lại hoặc quay về Trang chủ.
          </p>
          {error?.message && (
            <p className="text-[11px] font-mono text-rose-300/80 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50 break-words mt-3 text-left">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[#00BCEB] text-slate-950 font-bold text-xs hover:bg-[#00d0ff] transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-[#00BCEB]/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử Lại</span>
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center space-x-1.5"
          >
            <Home className="w-3.5 h-3.5 text-[#00BCEB]" />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
