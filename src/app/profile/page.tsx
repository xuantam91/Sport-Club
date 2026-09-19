'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Shield, Activity, CheckCircle2, Building, Mail, Settings, RefreshCw, Zap } from 'lucide-react';
import { Certificate } from '@/types';

export default function ProfilePage() {
  const { currentUser, activities, setShowOnboardingModal, refreshData, t } = useApp();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel text-center rounded-3xl space-y-4">
        <User className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Chưa chọn thành viên</h2>
        <p className="text-sm text-slate-400">Vui lòng đăng nhập hoặc chọn hồ sơ cá nhân.</p>
      </div>
    );
  }

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const userActivities = activities.filter(
    (a) =>
      (a.profile_id === currentUser.id ||
        a.profile?.id === currentUser.id ||
        (currentUser.strava_id && a.profile?.strava_id === currentUser.strava_id)) &&
      !a.id.startsWith('act-')
  );

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
                  : currentUser.role === 'organizer'
                  ? t('profile', 'organizerRole')
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
            <p className="text-[11px] text-slate-400">Strava ID: #{currentUser.strava_id || '162869534'}</p>
            <a
              href="/api/strava/auth"
              className="w-full px-3.5 py-1.5 rounded-xl bg-[#FC4C02] text-white font-extrabold text-xs hover:bg-[#e04300] transition-colors btn-interactive flex items-center justify-center space-x-1"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Tải Dữ Liệu Strava</span>
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

      {/* Activity Timeline */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FC4C02]" />
            <span>{t('profile', 'historyTitle')} ({userActivities.length})</span>
          </h2>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#00BCEB] border border-slate-700 text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Cập Nhật Lịch Sử'}</span>
          </button>
        </div>

        {userActivities.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-4">
            <Activity className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Chưa ghi nhận bài tập nào từ Strava</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Nếu bạn vừa kết nối Strava lần đầu, vui lòng nhấn nút bên dưới để cấp quyền đọc toàn bộ bài tập và tải dữ liệu vận động mới nhất về ứng dụng.
              </p>
            </div>

            <a
              href="/api/strava/auth"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FC4C02] to-[#ff6a26] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FC4C02]/20 hover:opacity-95 transition-all btn-interactive"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Ủy Quyền & Tải Dữ Liệu Strava Ngay</span>
            </a>
          </div>
        ) : (
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
        )}
      </div>

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
