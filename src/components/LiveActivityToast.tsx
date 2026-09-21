'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Activity, Profile, Team } from '@/types';
import { X, Zap } from 'lucide-react';
import Link from 'next/link';

// Helper định dạng thời gian tương đối bằng tiếng Việt
function formatRelativeTime(isoString: string): string {
  if (!isoString) return 'Vừa xong';
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSeconds < 60) return 'Vừa xong';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} giờ trước`;
  }
  
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (diffSeconds < 172800) {
    return `Hôm qua ${timeStr}`;
  }

  return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} lúc ${timeStr}`;
}

// Icon & Tên tiếng Việt fallback cho các môn thể thao
const SPORT_META: Record<string, { label: string; icon: string; color: string; badgeBg: string }> = {
  Run: { label: 'Chạy bộ', icon: '🏃', color: 'text-amber-400', badgeBg: 'bg-amber-500/20 border-amber-500/40' },
  Ride: { label: 'Đạp xe', icon: '🚴', color: 'text-sky-400', badgeBg: 'bg-sky-500/20 border-sky-500/40' },
  Walk: { label: 'Đi bộ', icon: '🚶', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 border-emerald-500/40' },
  Hike: { label: 'Leo núi', icon: '🥾', color: 'text-orange-400', badgeBg: 'bg-orange-500/20 border-orange-500/40' },
  Swim: { label: 'Bơi lội', icon: '🏊', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/20 border-cyan-500/40' },
};

export const LiveActivityToast: React.FC = () => {
  const { activities, profiles, teams, rules } = useApp();
  const [mounted, setMounted] = useState(false);
  const [activeItem, setActiveItem] = useState<Activity | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissedSession, setIsDismissedSession] = useState(false);
  
  const lastIndexRef = useRef<number>(-1);
  const [progressPercent, setProgressPercent] = useState<number>(100);

  // Lọc lấy 10 hoạt động gần nhất theo start_date giảm dần
  const recentActivities = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    const sorted = [...activities].sort(
      (a, b) => new Date(b.start_date || b.created_at).getTime() - new Date(a.start_date || a.created_at).getTime()
    );
    return sorted.slice(0, 10);
  }, [activities]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hàm chọn hoạt động tiếp theo (ngẫu nhiên hoặc xoay tua tránh trùng lặp liên tiếp)
  const pickNextActivity = () => {
    if (recentActivities.length === 0) return null;
    if (recentActivities.length === 1) return recentActivities[0];

    let nextIndex = Math.floor(Math.random() * recentActivities.length);
    // Nếu trùng với hoạt động vừa hiện, thử lại để tăng tính đa dạng
    if (nextIndex === lastIndexRef.current) {
      nextIndex = (nextIndex + 1) % recentActivities.length;
    }
    lastIndexRef.current = nextIndex;
    return recentActivities[nextIndex];
  };

  // Quản lý chu kỳ hiển thị (Hiển thị 5.5s -> Nghỉ 5s -> Hiện tiếp)
  useEffect(() => {
    if (!mounted || isDismissedSession || recentActivities.length === 0) return;

    let showTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const SHOW_DURATION = 5500; // 5.5s hiển thị
    const INTERVAL_PAUSE = 5000; // 5s nghỉ trước khi hiện tiếp

    const startCycle = (delay: number) => {
      showTimeout = setTimeout(() => {
        const next = pickNextActivity();
        if (!next) return;

        setActiveItem(next);
        setIsVisible(true);
        setProgressPercent(100);

        // Cập nhật thanh tiến trình mượt mà
        let elapsed = 0;
        progressInterval = setInterval(() => {
          if (!isPausedRef.current) {
            elapsed += 100;
            const remaining = Math.max(0, 100 - (elapsed / SHOW_DURATION) * 100);
            setProgressPercent(remaining);

            if (elapsed >= SHOW_DURATION) {
              clearInterval(progressInterval);
              setIsVisible(false);
              // Bắt đầu chu kỳ tiếp theo sau thời gian nghỉ
              startCycle(INTERVAL_PAUSE);
            }
          }
        }, 100);
      }, delay);
    };

    // Lần đầu tiên: hiện sau 1.5 giây vào trang
    startCycle(1500);

    return () => {
      clearTimeout(showTimeout);
      clearInterval(progressInterval);
    };
  }, [mounted, isDismissedSession, recentActivities.length]);

  const handleMouseEnter = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  // Nếu chưa mount, hoặc bị tắt cả phiên, hoặc không có hoạt động thì không render
  if (!mounted || isDismissedSession || !activeItem || recentActivities.length === 0) {
    return null;
  }

  // Tìm profile tương ứng
  const athleteProfile = activeItem.profile || profiles.find((p) => p.id === activeItem.profile_id);
  const athleteName = athleteProfile?.full_name || 'Vận động viên Cisco';
  const avatarUrl = athleteProfile?.avatar_url;
  const initials = athleteName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  // Tìm team tương ứng
  const athleteTeam = athleteProfile?.team_id
    ? teams.find((t) => t.id === athleteProfile.team_id)
    : null;

  // Lấy icon và thông tin môn thể thao từ custom rules hoặc fallback
  const matchedRule = rules.find((r) => r.activity_type.toLowerCase() === activeItem.type.toLowerCase());
  const sportMeta = SPORT_META[activeItem.type] || {
    label: matchedRule?.display_name || activeItem.type,
    icon: matchedRule?.icon || '🏅',
    color: 'text-[#00BCEB]',
    badgeBg: 'bg-[#00BCEB]/20 border-[#00BCEB]/40',
  };

  const distanceKm = (activeItem.distance / 1000).toFixed(1);
  const points = activeItem.calculated_points;

  return (
    <aside
      aria-label="Thông báo hoạt động thể thao mới nhất"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      className={`fixed top-20 right-4 sm:top-20 sm:right-6 z-50 max-w-[calc(100vw-2rem)] sm:max-w-md transition-all duration-500 ease-out transform ${
        isVisible
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="relative group overflow-hidden bg-slate-900/95 backdrop-blur-xl border border-slate-800 hover:border-[#00BCEB]/60 rounded-2xl shadow-2xl shadow-black/80 p-3.5 sm:p-4 transition-all duration-300">
        {/* Glow ambient background effect */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-[#00BCEB]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[#CCFF00]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          {/* Avatar & Sport Badge */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={athleteName}
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 group-hover:border-[#00BCEB] transition-colors"
                onError={(e) => {
                  // Fallback khi ảnh lỗi
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-white text-sm">
                {initials}
              </div>
            )}
            {/* Sport Icon Badge on bottom right of avatar */}
            <span
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs border ${sportMeta.badgeBg} shadow-sm backdrop-blur-md`}
              title={sportMeta.label}
            >
              {sportMeta.icon}
            </span>
          </div>

          {/* Activity Info Details */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-white text-sm truncate max-w-[150px] sm:max-w-[180px]">
                {athleteName}
              </span>
              <span className="text-[11px] text-slate-400">•</span>
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                {formatRelativeTime(activeItem.start_date || activeItem.created_at)}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              Vừa hoàn thành{' '}
              <span className="font-bold text-[#CCFF00] tracking-wide">
                {distanceKm} km
              </span>{' '}
              <span className="font-medium text-slate-200">
                {sportMeta.label}
              </span>
            </p>

            {/* Team & Points Chips */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {athleteTeam && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300 border border-slate-700/60 font-medium truncate max-w-[140px]">
                  🛡️ {athleteTeam.name}
                </span>
              )}
              {points > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#00BCEB]/10 text-[10px] text-[#00BCEB] border border-[#00BCEB]/30 font-semibold">
                  <Zap className="w-2.5 h-2.5 fill-[#00BCEB]" /> +{points} pts
                </span>
              )}
            </div>
          </div>

          {/* Quick Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors -mr-1 -mt-1"
            title="Đóng thông báo này"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Link xem tất cả hoạt động */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
          <Link
            href="/activities"
            className="text-slate-400 hover:text-[#00BCEB] flex items-center gap-1 transition-colors group/link"
          >
            <span>Xem feed hoạt động</span>
            <span className="group-hover/link:translate-x-0.5 transition-transform">→</span>
          </Link>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              setIsDismissedSession(true);
            }}
            className="text-slate-500 hover:text-slate-400 transition-colors"
            title="Không hiện pop-up trong phiên làm việc này"
          >
            Ẩn trong phiên này
          </button>
        </div>

        {/* Progress Bar line at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-[#00BCEB] to-[#CCFF00] transition-all ease-linear"
            style={{
              width: `${progressPercent}%`,
              transitionDuration: isPaused ? '0ms' : '100ms',
            }}
          />
        </div>
      </div>
    </aside>
  );
};
