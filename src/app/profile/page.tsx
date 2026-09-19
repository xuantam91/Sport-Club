'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Shield, Activity, CheckCircle2, Building, Mail, Settings, RefreshCw, Zap, Bug, ChevronRight, Eye, EyeOff, Lock, LogIn, LogOut, ListFilter, Calendar, Clock, PieChart, BarChart2 } from 'lucide-react';
import { Certificate, Activity as ActivityType } from '@/types';

export default function ProfilePage() {
  const { currentUser, activities, setShowOnboardingModal, refreshData, logout, t } = useApp();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // State Bộ Lọc Thời Gian
  type TimeFilterType = 'all' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // State quản lý xem chi tiết môn thể thao
  const [activeCategoryModal, setActiveCategoryModal] = useState<{
    type: string;
    name: string;
    list: ActivityType[];
  } | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel text-center rounded-3xl space-y-6 shadow-2xl border border-slate-800">
        <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[#FFFFFF]">Chưa Đăng Nhập</h2>
          <p className="text-sm text-slate-400">Vui lòng đăng nhập bằng tài khoản Strava để tham gia tính điểm & xếp hạng Cisco.</p>
        </div>
        <a
          href="/api/strava/auth"
          className="w-full py-3.5 px-6 rounded-2xl bg-[#FC4C02] hover:bg-[#e04300] text-white font-extrabold text-sm shadow-lg shadow-[#FC4C02]/20 transition-all flex items-center justify-center space-x-2 btn-interactive"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Đăng Nhập bằng Strava</span>
        </a>
      </div>
    );
  }

  const isStravaLinked = Boolean(currentUser.strava_id && currentUser.strava_id > 0);
  const defaultUserPassword = 'Cisco2026$';

  const handleManualSync = async () => {
    setIsSyncing(true);
    setDebugOutput(null);
    try {
      await refreshData();
      const token = typeof window !== 'undefined' ? localStorage.getItem('cisco_strava_token') : null;
      if (token) {
        const res = await fetch(`/api/strava/user-activities?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        setDebugOutput(JSON.stringify(json, null, 2));
      } else {
        setDebugOutput('Chưa tìm thấy Strava Token trong trình duyệt. Vui lòng bấm Ủi Quyền bên dưới.');
      }
    } catch (e: any) {
      console.error(e);
      setDebugOutput(`Lỗi đồng bộ: ${e.message || String(e)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const rawUserActivities = activities.filter(
    (a) =>
      (a.profile_id === currentUser.id ||
        a.profile?.id === currentUser.id ||
        (currentUser.strava_id && a.profile?.strava_id === currentUser.strava_id)) &&
      !a.id.startsWith('act-')
  );

  // Lọc bài tập theo mốc thời gian đã chọn
  const userActivities = rawUserActivities.filter((a) => {
    if (timeFilter === 'all') return true;
    const actDate = new Date(a.start_date);
    const now = new Date();

    if (timeFilter === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Thứ Hai
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return actDate >= startOfWeek;
    }

    if (timeFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return actDate >= startOfMonth;
    }

    if (timeFilter === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      return actDate >= startOfQuarter;
    }

    if (timeFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return actDate >= startOfYear;
    }

    if (timeFilter === 'custom') {
      if (customStart && actDate < new Date(customStart)) return false;
      if (customEnd) {
        const endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
        if (actDate > endDate) return false;
      }
      return true;
    }

    return true;
  });

  const totalDistMeters = userActivities.reduce((acc, a) => acc + a.distance, 0);
  const totalPoints = userActivities.reduce((acc, a) => acc + a.calculated_points, 0);
  const totalElevation = userActivities.reduce((acc, a) => acc + (a.total_elevation_gain || 0), 0);
  const totalMovingTimeSec = userActivities.reduce((acc, a) => acc + (a.moving_time || a.elapsed_time || 0), 0);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Phân loại hoạt động theo từng chủng loại môn thể thao & phân bổ thời gian
  const sportCategories = [
    { type: 'Run', name: '🏃 Chạy Bộ (Run)', color: 'from-[#FC4C02]/20 to-[#ff6a26]/5', border: 'border-[#FC4C02]/40', badge: 'text-[#FC4C02]', barColor: 'bg-[#FC4C02]' },
    { type: 'Ride', name: '🚴 Đạp Xe (Ride)', color: 'from-[#00BCEB]/20 to-[#00f0ff]/5', border: 'border-[#00BCEB]/40', badge: 'text-[#00BCEB]', barColor: 'bg-[#00BCEB]' },
    { type: 'Walk', name: '🚶 Đi Bộ (Walk)', color: 'from-[#CCFF00]/20 to-[#b8e600]/5', border: 'border-[#CCFF00]/40', badge: 'text-[#CCFF00]', barColor: 'bg-[#CCFF00]' },
    { type: 'Swim', name: '🏊 Bơi Lội (Swim)', color: 'from-blue-500/20 to-cyan-600/5', border: 'border-blue-500/40', badge: 'text-blue-400', barColor: 'bg-blue-500' },
    { type: 'Hike', name: '🥾 Leo Núi (Hike)', color: 'from-emerald-500/20 to-teal-600/5', border: 'border-emerald-500/40', badge: 'text-emerald-400', barColor: 'bg-emerald-500' },
  ];

  const groupedStats = sportCategories.map((cat) => {
    const list = userActivities.filter((a) => a.type === cat.type);
    const distMeters = list.reduce((sum, a) => sum + a.distance, 0);
    const points = list.reduce((sum, a) => sum + a.calculated_points, 0);
    const timeSec = list.reduce((sum, a) => sum + (a.moving_time || a.elapsed_time || 0), 0);
    const elevGain = list.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
    const count = list.length;
    const timePercent = totalMovingTimeSec > 0 ? (timeSec / totalMovingTimeSec) * 100 : 0;

    return {
      ...cat,
      list,
      count,
      km: (distMeters / 1000).toFixed(1),
      points: points.toFixed(1),
      timeSec,
      elevGain: Math.round(elevGain),
      timePercent,
    };
  });

  const activeGroupedStats = groupedStats.filter((item) => item.count > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00BCEB]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.full_name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-[#00BCEB] shadow-2xl"
          />

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{currentUser.full_name}</h1>
              <span className="px-3 py-1 rounded-full bg-[#CCFF00]/15 border border-[#CCFF00]/30 text-[#CCFF00] font-extrabold text-xs uppercase">
                {currentUser.role === 'admin'
                  ? t('profile', 'adminRole')
                  : currentUser.role === 'organizer'
                  ? t('profile', 'organizerRole')
                  : currentUser.role === 'captain'
                  ? t('profile', 'captainRole')
                  : 'Vận động viên'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#00BCEB]" /> {currentUser.department || 'Cisco GSC Vietnam'}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#00BCEB]" /> {currentUser.email}</span>
            </div>

            {/* Team & Setup Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {currentUser.team ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200">
                  <span>Team Cisco:</span>
                  <strong className="text-[#CCFF00] font-bold">{currentUser.team.name}</strong>
                </span>
              ) : (
                <span className="text-xs text-slate-500 italic">Chưa gia nhập đội nhóm nào</span>
              )}

              {/* Nút Hoàn thiện Hồ sơ & Mật khẩu */}
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#00BCEB]/20 hover:bg-[#00BCEB]/30 text-[#00BCEB] border border-[#00BCEB]/40 text-xs font-bold transition-all btn-interactive"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cấu Hình Hồ Sơ & Mật Khẩu</span>
              </button>

              {/* NÚT ĐĂNG XUẤT (LOGOUT BUTTON) */}
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn ĐĂNG XUẤT khỏi tài khoản hiện tại không?')) {
                    logout();
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all btn-interactive"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>

          {/* Strava Connect Widget */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-2 text-center w-full sm:w-auto">
            {isStravaLinked ? (
              <>
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã Kết Nối Strava</span>
                </div>
                <p className="text-[11px] text-slate-400">Strava ID: #{currentUser.strava_id}</p>
                <a
                  href="/api/strava/auth"
                  className="w-full px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors btn-interactive flex items-center justify-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#00BCEB]" />
                  <span>Cập Nhật Token</span>
                </a>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-bold">
                  <Zap className="w-4 h-4 fill-amber-400" />
                  <span>Chưa Kết Nối Strava</span>
                </div>
                <p className="text-[11px] text-slate-400">Đăng nhập để tự động sync bài tập</p>
                <a
                  href="/api/strava/auth"
                  className="w-full px-4 py-2 rounded-xl bg-[#FC4C02] text-white font-extrabold text-xs hover:bg-[#e04300] shadow-lg shadow-[#FC4C02]/20 transition-all btn-interactive flex items-center justify-center space-x-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập bằng Strava</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* THÔNG TIN TÀI KHOẢN & MẬT KHẨU MẶC ĐỊNH CARD */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tài Khoản Đăng Nhập</span>
            <span className="text-sm font-bold text-white block mt-0.5 truncate">{currentUser.email || currentUser.username}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Mật Khẩu Đăng Nhập Mặc Định</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="font-mono font-bold text-[#CCFF00] text-sm">
                {showPassword ? defaultUserPassword : '••••••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-[#CCFF00]" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Quyền Hạn Mặc Định</span>
            <span className="text-xs font-bold text-slate-200 block mt-1 capitalize">
              {currentUser.role === 'admin'
                ? ' Ban Tổ Chức / Admin'
                : currentUser.role === 'captain'
                ? ' Đội Trưởng Team'
                : '🏃 Vận Động Viên (Default)'}
            </span>
          </div>
        </div>
      </div>

      {/* BỘ LỌC THỜI GIAN (Time Range Filter Bar) */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#00BCEB]" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Bộ Lọc Thời Gian Thống Kê</h3>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {timeFilter === 'all' && 'Hiển thị tất cả lịch sử tập luyện'}
            {timeFilter === 'week' && 'Thời gian: Tuần này'}
            {timeFilter === 'month' && 'Thời gian: Tháng này'}
            {timeFilter === 'quarter' && 'Thời gian: Quý này'}
            {timeFilter === 'year' && 'Thời gian: Năm 2026'}
            {timeFilter === 'custom' && 'Thời gian: Khoảng tùy chọn'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: 'all', label: '🌐 Tất Cả' },
            { id: 'week', label: '📅 Tuần Này' },
            { id: 'month', label: '📆 Tháng Này' },
            { id: 'quarter', label: '📊 Quý Này' },
            { id: 'year', label: '🏆 Năm 2026' },
            { id: 'custom', label: '🗓️ Tùy Chỉnh...' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id as TimeFilterType)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-interactive ${
                timeFilter === item.id
                  ? 'bg-[#00BCEB] text-slate-950 font-black shadow-lg shadow-[#00BCEB]/20 scale-105'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {timeFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <span>Từ ngày:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#00BCEB]"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <span>Đến ngày:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#00BCEB]"
              />
            </div>

            {(customStart || customEnd) && (
              <button
                onClick={() => {
                  setCustomStart('');
                  setCustomEnd('');
                }}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Xóa mốc ngày
              </button>
            )}
          </div>
        )}
      </div>

      {/* Personal Stats Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
          <p className="text-xs text-slate-400 font-medium">{t('profile', 'totalDistance')}</p>
          <p className="text-2xl font-extrabold text-[#CCFF00] mt-1">{(totalDistMeters / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span></p>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
          <p className="text-xs text-slate-400 font-medium">{t('profile', 'totalPoints')}</p>
          <p className="text-2xl font-extrabold text-[#FC4C02] mt-1">{totalPoints.toFixed(1)} <span className="text-xs font-normal text-slate-400">pts</span></p>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
          <p className="text-xs text-slate-400 font-medium">{t('profile', 'totalElevation')}</p>
          <p className="text-2xl font-extrabold text-[#00BCEB] mt-1">{Math.round(totalElevation).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">m</span></p>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
          <p className="text-xs text-slate-400 font-medium">{t('profile', 'totalWorkouts')}</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{userActivities.length} <span className="text-xs font-normal text-slate-400">lần</span></p>
        </div>
      </div>

      {/* BIỂU ĐỒ PHÂN BỐ THỜI GIAN THEO MÔN THỂ THAO */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-[#CCFF00]" />
              <h2 className="text-lg font-extrabold text-white">Biểu Đồ Phân Bổ Thời Gian Theo Môn</h2>
            </div>
            <p className="text-xs text-slate-400">Tỷ lệ thời gian vận động (Moving Time) phân bổ theo từng bộ môn thể thao</p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2 text-xs">
            <Clock className="w-4 h-4 text-[#00BCEB]" />
            <span className="text-slate-400">Tổng thời gian:</span>
            <strong className="text-[#CCFF00] font-bold">{formatDuration(totalMovingTimeSec)}</strong>
          </div>
        </div>

        {/* Multi-Segment Stacked Bar Chart */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Tỷ lệ phân bổ tổng thể (100%)</span>
            <span>{userActivities.length} bài tập</span>
          </div>

          <div className="h-6 w-full bg-slate-950 rounded-2xl overflow-hidden p-1 flex border border-slate-800 shadow-inner">
            {groupedStats.map((cat) => {
              if (cat.timePercent <= 0) return null;
              return (
                <div
                  key={cat.type}
                  style={{ width: `${cat.timePercent}%` }}
                  className={`h-full ${cat.barColor} transition-all duration-500 first:rounded-l-xl last:rounded-r-xl relative group cursor-pointer`}
                  title={`${cat.name}: ${cat.timePercent.toFixed(1)}% (${formatDuration(cat.timeSec)})`}
                >
                  {cat.timePercent > 8 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-950 truncate px-1">
                      {cat.timePercent.toFixed(0)}%
                    </span>
                  )}
                </div>
              );
            })}
            {totalMovingTimeSec === 0 && (
              <div className="h-full w-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                Chưa có dữ liệu thời gian trong khoảng chọn
              </div>
            )}
          </div>
        </div>

        {/* Sport Breakdown Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {groupedStats.map((cat) => (
            <div
              key={cat.type}
              className={`p-4 rounded-2xl bg-slate-900/80 border ${cat.count > 0 ? cat.border : 'border-slate-800/50 opacity-60'} space-y-3 transition-all hover:bg-slate-900`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-white">{cat.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-950 border border-slate-800 ${cat.badge}`}>
                  {cat.timePercent.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar per sport */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${cat.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${cat.timePercent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1 text-center pt-1 border-t border-slate-800/60 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Thời gian</span>
                  <strong className="text-white font-bold">{formatDuration(cat.timeSec)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Quãng đường</span>
                  <strong className="text-[#CCFF00] font-bold">{cat.km} km</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Leo dốc</span>
                  <strong className="text-[#00BCEB] font-bold">{cat.elevGain} m</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* THỐNG KÊ GỌN THEO CHỦNG LOẠI MÔN THỂ THAO (Grouped Activity Summaries) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-[#00BCEB]" />
            <span>Phân Loại Theo Chủng Loại Thể Thao ({activeGroupedStats.length} Bộ Môn)</span>
          </h2>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#00BCEB] border border-slate-700 text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Cập Nhật Lịch Sử'}</span>
            </button>
          </div>
        </div>

        {/* Live Debug Result Box */}
        {debugOutput && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00BCEB] flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-[#CCFF00]" />
                KẾT QUẢ PHẢN HỒI TỪ STRAVA API (DEBUG):
              </span>
              <button onClick={() => setDebugOutput(null)} className="text-slate-400 hover:text-white text-xs">
                ✕ Đóng
              </button>
            </div>
            <pre className="text-[11px] font-mono text-emerald-400 bg-slate-900 p-3 rounded-xl overflow-x-auto max-h-60 border border-slate-800">
              {debugOutput}
            </pre>
          </div>
        )}

        {userActivities.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-4">
            <Activity className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Chưa ghi nhận bài tập nào từ Strava</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Nếu bạn vừa kết nối Strava lần đầu, vui lòng nhấn nút bên dưới để cấp quyền đọc toàn bộ bài tập và tải dữ liệu vận động mới nhất về ứng dụng.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="/api/strava/auth"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FC4C02] to-[#ff6a26] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FC4C02]/20 hover:opacity-95 transition-all btn-interactive"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Ủy Quyền & Tải Dữ Liệu Strava Ngay</span>
              </a>

              <button
                onClick={handleManualSync}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[#00BCEB] font-bold text-xs border border-slate-700 transition-all btn-interactive"
              >
                <Bug className="w-4 h-4 text-[#CCFF00]" />
                <span>Chẩn Đoán Kết Nối Strava (Debug)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedStats
              .filter((item) => item.count > 0)
              .map((cat) => (
                <div
                  key={cat.type}
                  className={`p-5 rounded-3xl bg-gradient-to-br ${cat.color} border ${cat.border} space-y-4 shadow-lg hover:scale-[1.01] transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-white">{cat.name}</h3>
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-xs font-bold text-slate-300 border border-slate-800">
                      {cat.count} bài tập
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Tổng cự ly</p>
                      <p className={`font-black text-lg ${cat.badge} mt-0.5`}>
                        {cat.km} <span className="text-[10px] font-normal text-slate-400">km</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Tổng điểm</p>
                      <p className="font-black text-lg text-white mt-0.5">
                        +{cat.points} <span className="text-[10px] font-normal text-slate-400">pts</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveCategoryModal({ type: cat.type, name: cat.name, list: cat.list })}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors flex items-center justify-center space-x-1.5 btn-interactive border border-slate-800"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#00BCEB]" />
                    <span>Xem Chi Tiết Tất Cả ({cat.count}) ➔</span>
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* CHỨNG CHỈ & THÀNH TÍCH ĐIỆN TỬ (Certificates Section) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#CCFF00]" />
            <span>{t('profile', 'certTitle')} ({currentUser.certificates?.length || 0})</span>
          </h2>
          <span className="text-xs text-[#00BCEB] font-bold">Cấp bởi Ban Tổ Chức Cisco GSC</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(currentUser.certificates || []).map((cert) => (
            <div
              key={cert.id}
              onClick={() => setSelectedCert(cert)}
              className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 hover:border-amber-400/60 shadow-lg cursor-pointer transition-all duration-300 group btn-interactive"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase">
                    CHỨNG CHỈ THỂ THAO
                  </span>
                  <h3 className="font-bold text-base text-white group-hover:text-[#CCFF00] transition-colors">{cert.title}</h3>
                  <p className="text-xs text-slate-400">{cert.achievement_detail}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 text-lg font-black group-hover:scale-110 transition-transform">
                  📜
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Ngày cấp: {cert.issue_date}</span>
                <span className="text-[#00BCEB] font-semibold underline group-hover:text-[#CCFF00]">Xem Bằng Khen ➔</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DANH SÁCH BÀI TẬP CHI TIẾT KHI NHẤP CHI TIẾT MÔN THỂ THAO */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-[#00BCEB] uppercase tracking-wider">DANH SÁCH CHI TIẾT BÀI TẬP</span>
                <h3 className="font-extrabold text-xl text-white mt-0.5">{activeCategoryModal.name}</h3>
              </div>

              <button
                onClick={() => setActiveCategoryModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Workout List */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {activeCategoryModal.list.map((act) => (
                <div key={act.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white">{act.name}</h4>
                    <p className="text-xs text-slate-400">
                      📅 {new Date(act.start_date).toLocaleDateString('vi-VN')} • ⏱️ {Math.floor(act.moving_time / 60)} phút • 🏔️ Leo dốc: {act.total_elevation_gain || 0}m
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-base text-[#CCFF00]">
                      {(act.distance / 1000).toFixed(2)} km
                    </span>
                    <p className="text-xs font-bold text-[#FC4C02]">+{act.calculated_points} pts</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                onClick={() => setActiveCategoryModal(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Đóng Màn Hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP CHỨNG CHỈ VINH DANH (Digital Certificate Viewer) */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header Badge */}
            <div className="space-y-2">
              <span className="px-4 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-widest">
                CISCO GSC VIETNAM ATHLETIC CERTIFICATE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 uppercase tracking-wide">
                BẰNG KHEN THÀNH TÍCH
              </h2>
            </div>

            {/* Certificate Body */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <p className="text-xs uppercase text-slate-400 font-bold tracking-wider">Chứng nhận Vận động viên</p>
              <h3 className="text-2xl font-black text-white">{selectedCert.recipient_name}</h3>
              <p className="text-sm font-semibold text-[#CCFF00]">{selectedCert.title}</p>
              <div className="py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                {selectedCert.achievement_detail}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Ngày cấp: {selectedCert.issue_date}</span>
                <span className="text-[#00BCEB] font-bold">{selectedCert.verified_by}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => alert('Đã lưu Bằng Khen Thể Thao thành công!')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all"
              >
                Tải Bằng Khen (PDF HD)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
