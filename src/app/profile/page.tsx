'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { User, Shield, Activity, CheckCircle2, Building, Mail, Lock, Settings } from 'lucide-react';
import { getStravaOAuthUrl } from '@/lib/strava';

export default function ProfilePage() {
  const { currentUser, activities, setShowOnboardingModal, t } = useApp();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel text-center rounded-3xl space-y-4">
        <User className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Chưa chọn thành viên</h2>
        <p className="text-sm text-slate-400">Vui lòng đăng nhập hoặc chọn hồ sơ cá nhân.</p>
      </div>
    );
  }

  const userActivities = activities.filter((a) => a.profile_id === currentUser.id);

  const totalDistMeters = userActivities.reduce((acc, a) => acc + a.distance, 0);
  const totalPoints = userActivities.reduce((acc, a) => acc + a.calculated_points, 0);
  const totalElevation = userActivities.reduce((acc, a) => acc + (a.total_elevation_gain || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
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
                  : currentUser.role === 'captain'
                  ? t('profile', 'captainRole')
                  : t('profile', 'memberRole')}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#00BCEB]" /> {currentUser.department}</span>
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
            </div>
          </div>

          {/* Strava Connect Widget */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-2 text-center w-full sm:w-auto">
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('profile', 'stravaConnected')}</span>
            </div>
            <p className="text-[11px] text-slate-400">Strava ID: #{currentUser.strava_id || '998811'}</p>
            <a
              href="/api/strava/auth"
              className="w-full px-3 py-1.5 rounded-xl bg-[#FC4C02] text-white font-bold text-xs hover:bg-[#e04300] transition-colors btn-interactive"
            >
              {t('profile', 'updateOAuth')}
            </a>
          </div>
        </div>
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
          <p className="text-2xl font-extrabold text-[#00BCEB] mt-1">{totalElevation} <span className="text-xs font-normal text-slate-400">m</span></p>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
          <p className="text-xs text-slate-400 font-medium">{t('profile', 'totalWorkouts')}</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{userActivities.length} <span className="text-xs font-normal text-slate-400">lần</span></p>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#FC4C02]" />
          <span>{t('profile', 'historyTitle')}</span>
        </h2>

        <div className="space-y-3">
          {userActivities.map((act) => (
            <div key={act.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{act.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {act.type} • {(act.distance / 1000).toFixed(2)} km • {new Date(act.start_date).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-base text-[#CCFF00]">+{act.calculated_points} pts</span>
                <p className="text-[10px] text-slate-500">Leo dốc: {act.total_elevation_gain || 0}m</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
