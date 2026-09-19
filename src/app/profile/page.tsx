'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Profile, Certificate, Activity as ActivityType } from '@/types';
import { User, Shield, Activity, CheckCircle2, Building, Mail, Settings, RefreshCw, Zap, Bug, ChevronRight, Eye, EyeOff, Lock, LogIn, LogOut, ListFilter, Calendar, Clock, PieChart, BarChart2 } from 'lucide-react';

function UnauthenticatedLoginForm({ profiles, setCurrentUser }: { profiles: Profile[]; setCurrentUser: (user: Profile | null) => void }) {
  const [loginMode, setLoginMode] = useState<'strava' | 'password'>('strava');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<Profile[]>([]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('cisco_saved_accounts');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSavedAccounts(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToSavedAccounts = (prof: Profile) => {
    if (typeof window === 'undefined' || !prof) return;
    try {
      const raw = localStorage.getItem('cisco_saved_accounts');
      let list: Profile[] = raw ? JSON.parse(raw) : [];
      list = list.filter((p) => p.id !== prof.id && (p.email !== prof.email || !prof.email));
      list.unshift(prof);
      list = list.slice(0, 5);
      localStorage.setItem('cisco_saved_accounts', JSON.stringify(list));
      setSavedAccounts(list);
    } catch (e) {
      console.error(e);
    }
  };

  const removeSavedAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter((p) => p.id !== id);
    setSavedAccounts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cisco_saved_accounts', JSON.stringify(updated));
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!identity.trim()) {
      setLoginError('Vui lòng nhập Email hoặc Username!');
      return;
    }

    const query = identity.trim().toLowerCase();
    const found = profiles.find(
      (p) =>
        (p.email && p.email.toLowerCase() === query) ||
        (p.username && p.username.toLowerCase() === query) ||
        p.full_name.toLowerCase().includes(query)
    );

    const userToSet: Profile = found || {
      id: `usr-${Date.now()}`,
      full_name: identity.split('@')[0] || 'Vận Động Viên Cisco',
      username: query.split('@')[0],
      email: identity.includes('@') ? identity : `${query}@cisco.com`,
      role: 'member',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      created_at: new Date().toISOString(),
    };

    setCurrentUser(userToSet);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cisco_sport_user', JSON.stringify(userToSet));
      saveToSavedAccounts(userToSet);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-10 glass-card rounded-3xl p-5 sm:p-8 border border-[#00BCEB]/30 space-y-5 shadow-2xl relative overflow-hidden bg-slate-900/95">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FC4C02]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00BCEB]/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand Header */}
      <div className="text-center space-y-2 relative z-10">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950 border border-[#00BCEB]/40 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse"></span>
          <span className="font-extrabold text-[10px] sm:text-xs uppercase tracking-widest bg-gradient-to-r from-white via-cyan-100 to-[#00BCEB] bg-clip-text text-transparent">
            CISCO GSC KINETIC SPORTS HUB
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          CỔNG ĐĂNG NHẬP VẬN ĐỘNG VIÊN
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Đồng bộ hoạt động thể thao tự động từ <strong className="text-[#FC4C02]">Strava</strong>
        </p>
      </div>

      {/* PROMINENT STRAVA LOGIN BUTTON FRONT & CENTER */}
      <div className="space-y-3 relative z-10 pt-1">
        <a
          href="/api/strava/auth"
          className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-gradient-to-r from-[#FC4C02] via-orange-500 to-[#FC4C02] hover:opacity-95 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#FC4C02]/30 transition-all flex items-center justify-center space-x-2.5 btn-interactive text-center"
        >
          <Zap className="w-5 h-5 fill-white shrink-0 animate-bounce" />
          <span>Đăng Nhập Ngay bằng Strava</span>
        </a>
        <p className="text-[11px] text-center text-slate-400 font-medium">
          ⚡ Tự động lấy log Chạy, Đạp xe, Đi bộ & Bơi lội từ ứng dụng Strava
        </p>
      </div>

      {/* Alternative Email / Password Toggle */}
      <div className="relative z-10 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setLoginMode(loginMode === 'password' ? 'strava' : 'password')}
          className="w-full text-center text-xs font-bold text-slate-400 hover:text-[#00BCEB] flex items-center justify-center space-x-1.5 py-1 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-[#00BCEB]" />
          <span>{loginMode === 'password' ? 'Ẩn form đăng nhập Email' : 'Đăng nhập bằng Email & Mật khẩu phụ'}</span>
        </button>

        {loginMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3 pt-3">
            {loginError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Username hoặc Email Cisco
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#00BCEB] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="tommy.tran@cisco.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Mật Khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#00BCEB] absolute left-3 top-2.5" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5 rounded"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5 text-[#CCFF00]" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#00BCEB] hover:bg-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 btn-interactive"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>
          </form>
        )}
      </div>

      {/* Saved Accounts History Bar */}
      {savedAccounts.length > 0 && (
        <div className="pt-4 border-t border-slate-800/80 space-y-2.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Tài khoản đã đăng nhập gần đây trên trình duyệt này:</span>
            <span className="text-slate-500">Nhấp để vào lại</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {savedAccounts.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setCurrentUser(p);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('cisco_sport_user', JSON.stringify(p));
                    saveToSavedAccounts(p);
                  }
                }}
                className="p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-[#00BCEB]/50 cursor-pointer transition-all flex items-center justify-between group btn-interactive"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <img src={p.avatar_url} alt={p.full_name} className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-[#00BCEB]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white group-hover:text-[#00BCEB] truncate">{p.full_name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{p.email || p.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => removeSavedAccount(p.id, e)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition-colors ml-1"
                  title="Xóa khỏi lịch sử trình duyệt"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { currentUser, setCurrentUser, profiles, activities, setShowOnboardingModal, refreshData, logout, t } = useApp();
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
    return <UnauthenticatedLoginForm profiles={profiles} setCurrentUser={setCurrentUser} />;
  }

  const isStravaLinked = Boolean(currentUser.strava_id && currentUser.strava_id > 0);

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
        setDebugOutput('Chưa tìm thấy Strava Token trong trình duyệt. Vui lòng bấm Ủy Quyền bên dưới.');
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
                  <span>Cập Nhật Strava</span>
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

        {/* THÔNG TIN TÀI KHOẢN CARD */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tài Khoản Đăng Nhập</span>
            <span className="text-sm font-bold text-white block mt-0.5 truncate">{currentUser.email || currentUser.username}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Quyền Hạn Hệ Thống</span>
            <span className="text-xs font-bold text-slate-200 block mt-1 capitalize">
              {currentUser.role === 'admin'
                ? '👑 Ban Tổ Chức / Admin'
                : currentUser.role === 'captain'
                ? '🏆 Đội Trưởng Team'
                : '🏃 Vận Động Viên (Member)'}
            </span>
          </div>
        </div>
      </div>

      {/* BỘ LỌC THỜI GIAN (Time Range Filter Bar) */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#00BCEB]" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{t('profile', 'timeFilterTitle')}</h3>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {timeFilter === 'all' && t('profile', 'showingAllHistory')}
            {timeFilter === 'week' && t('profile', 'showingWeek')}
            {timeFilter === 'month' && t('profile', 'showingMonth')}
            {timeFilter === 'quarter' && t('profile', 'showingQuarter')}
            {timeFilter === 'year' && t('profile', 'showingYear')}
            {timeFilter === 'custom' && t('profile', 'showingCustom')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: 'all', label: t('profile', 'filterAll') },
            { id: 'week', label: t('profile', 'filterWeek') },
            { id: 'month', label: t('profile', 'filterMonth') },
            { id: 'quarter', label: t('profile', 'filterQuarter') },
            { id: 'year', label: t('profile', 'filterYear') },
            { id: 'custom', label: t('profile', 'filterCustom') },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id as TimeFilterType)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-interactive ${
                timeFilter === item.id
                  ? 'bg-[#00BCEB] text-slate-950 shadow-md shadow-[#00BCEB]/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {timeFilter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('profile', 'startDateLabel')}</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('profile', 'endDateLabel')}</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
              />
            </div>
          </div>
        )}
      </div>

      {/* TỔNG QUAN THÀNH TÍCH (Overall Stats Summary Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 text-center space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('profile', 'totalDistance')}</p>
          <p className="text-2xl font-black text-[#CCFF00]">{(totalDistMeters / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span></p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 text-center space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('profile', 'totalPoints')}</p>
          <p className="text-2xl font-black text-[#FC4C02]">+{totalPoints.toFixed(1)} <span className="text-xs font-normal text-[#FC4C02]/70">pts</span></p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 text-center space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('profile', 'totalElevation')}</p>
          <p className="text-2xl font-black text-slate-200">{Math.round(totalElevation)} <span className="text-xs font-normal text-slate-500">m</span></p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 text-center space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('profile', 'movingTime')}</p>
          <p className="text-2xl font-black text-[#00BCEB]">{formatDuration(totalMovingTimeSec)}</p>
        </div>
      </div>

      {/* PHÂN LOẠI & THỐNG KÊ CHI TIẾT THEO MÔN THỂ THAO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-xl text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#00BCEB]" />
            <span>Phân Loại & Thống Kê Theo Môn Thể Thao</span>
          </h2>
          <span className="text-xs text-slate-400">Nhấp vào thẻ môn để xem toàn bộ danh sách bài tập</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedStats.map((cat) => {
            const hasData = cat.count > 0;

            return (
              <div
                key={cat.type}
                onClick={() => {
                  if (hasData) {
                    setActiveCategoryModal({
                      type: cat.type,
                      name: cat.name,
                      list: cat.list,
                    });
                  }
                }}
                className={`glass-card p-5 rounded-3xl border transition-all ${cat.border} bg-gradient-to-b ${cat.color} ${
                  hasData ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl' : 'opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-black text-base ${cat.badge}`}>{cat.name}</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-bold text-white">
                    {cat.count} bài tập
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Cự ly</p>
                    <p className="font-black text-sm text-[#CCFF00] mt-0.5">{cat.km} km</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Điểm</p>
                    <p className="font-black text-sm text-[#FC4C02] mt-0.5">+{cat.points}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Thời gian</p>
                    <p className="font-bold text-sm text-slate-200 mt-0.5">{formatDuration(cat.timeSec)}</p>
                  </div>
                </div>

                {/* Thanh tỉ lệ % thời gian tập luyện */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Tỉ lệ phân bổ thời gian</span>
                    <span className={cat.badge}>{cat.timePercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.barColor} transition-all duration-500`} style={{ width: `${cat.timePercent}%` }}></div>
                  </div>
                </div>

                {hasData && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-white">
                    <span>Xem chi tiết danh sách {cat.count} bài tập</span>
                    <ChevronRight className="w-4 h-4 text-[#00BCEB]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT DANH SÁCH BÀI TẬP THEO MÔN */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="space-y-1">
                <h3 className="font-extrabold text-xl text-white flex items-center gap-2">
                  <span>{activeCategoryModal.name}</span>
                </h3>
                <p className="text-xs text-slate-400">Tổng cộng {activeCategoryModal.list.length} bài tập đã hoàn thành</p>
              </div>

              <button
                onClick={() => setActiveCategoryModal(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {activeCategoryModal.list.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">{act.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(act.start_date).toLocaleString('vi-VN')}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-right bg-slate-900 p-2.5 rounded-xl border border-slate-800 w-full sm:w-auto">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Cự ly</p>
                      <p className="font-extrabold text-xs text-[#CCFF00]">{(act.distance / 1000).toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Thời gian</p>
                      <p className="font-bold text-xs text-slate-300">{formatDuration(act.moving_time || act.elapsed_time)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Điểm</p>
                      <p className="font-extrabold text-xs text-[#FC4C02]">+{act.calculated_points}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setActiveCategoryModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
