'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Activity as ActivityIcon, Zap, RefreshCw, PlusCircle, CheckCircle2, Flame, MapPin, Calendar, Clock, ArrowUpRight, Filter } from 'lucide-react';
import { getStravaOAuthUrl } from '@/lib/strava';

export default function ActivitiesPage() {
  const { activities, currentUser, addActivity, refreshData } = useApp();

  const [selectedType, setSelectedType] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actName, setActName] = useState('');
  const [actType, setActType] = useState<'Run' | 'Ride' | 'Walk' | 'Swim'>('Run');
  const [actDistanceKm, setActDistanceKm] = useState('');
  const [actDurationMin, setActDurationMin] = useState('');
  const [actElevation, setActElevation] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      refreshData();
      setIsSyncing(false);
    }, 1200);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseFloat(actDistanceKm) || 0;
    const mins = parseFloat(actDurationMin) || 0;
    const elev = parseFloat(actElevation) || 0;

    addActivity({
      name: actName || `Bài tập ${actType}`,
      type: actType,
      distance: km * 1000,
      moving_time: mins * 60,
      elapsed_time: mins * 60 + 60,
      total_elevation_gain: elev,
      start_date: new Date().toISOString(),
    });

    setShowAddModal(false);
    setActName('');
    setActDistanceKm('');
    setActDurationMin('');
    setActElevation('');
  };

  const formatPace = (distanceMeters: number, seconds: number) => {
    if (!distanceMeters || !seconds) return '-';
    const km = distanceMeters / 1000;
    const totalMinutes = seconds / 60;
    const paceDecimal = totalMinutes / km;
    const paceMin = Math.floor(paceDecimal);
    const paceSec = Math.round((paceDecimal - paceMin) * 60);
    return `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} /km`;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const filteredActivities = selectedType === 'All' 
    ? activities 
    : activities.filter((a) => a.type === selectedType);

  const sportCategories = [
    { type: 'All', name: 'Tất Cả Môn' },
    { type: 'Run', name: '🏃 Chạy Bộ' },
    { type: 'Ride', name: '🚴 Đạp Xe' },
    { type: 'Walk', name: '🚶 Đi Bộ' },
    { type: 'Swim', name: '🏊 Bơi Lội' },
    { type: 'Hike', name: '🥾 Leo Núi' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Strava Connect */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[#FC4C02] font-extrabold text-xs uppercase tracking-wider">
            <ActivityIcon className="w-4 h-4" />
            <span>ĐỒNG BỘ STRAVA & BÀI TẬP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">NHẬT KÝ VẬN ĐỘNG CÔNG TY</h1>
          <p className="text-sm text-slate-400">Tự động lấy log từ Strava Webhook hoặc nhập bài tập rèn luyện.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Nút Kết nối Strava OAuth */}
          <a
            href="/api/strava/auth"
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#e04300] text-white font-extrabold text-sm shadow-lg shadow-[#FC4C02]/20 transition-all"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Kết Nối Strava</span>
          </a>

          {/* Nút Tải Lại / Đồng Bộ Ngay */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-[#00F0FF] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Ngay'}</span>
          </button>

          {/* Nút Thêm Bài Tập */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-extrabold text-sm shadow-lg shadow-[#CCFF00]/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ghi Bài Tập Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs By Sport Category */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
        <Filter className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
        {sportCategories.map((cat) => (
          <button
            key={cat.type}
            onClick={() => setSelectedType(cat.type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap btn-interactive ${
              selectedType === cat.type
                ? 'bg-[#00BCEB] text-slate-950 shadow-md shadow-[#00BCEB]/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid Feed Nhật Ký Hoạt Động */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-xl text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FC4C02]" />
            <span>Nhật Ký ({filteredActivities.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Phân loại theo môn</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="glass-card p-5 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              {/* Header Feed Item */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={act.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={act.profile?.full_name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-slate-700"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-white">{act.profile?.full_name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[10px]">
                        {act.profile?.team?.name || 'Cá nhân'}
                      </span>
                      <span>•</span>
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(act.start_date).toLocaleDateString('vi-VN')}</span>
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-[#FC4C02]/15 border border-[#FC4C02]/30 text-[#FC4C02] text-xs font-bold">
                  {act.type === 'Run' ? '🏃 Chạy bộ' : act.type === 'Ride' ? '🚴 Đạp xe' : act.type === 'Walk' ? '🚶 Đi bộ' : act.type === 'Swim' ? '🏊 Bơi lội' : '🥾 Leo núi'}
                </div>
              </div>

              {/* Activity Name */}
              <p className="font-semibold text-base text-slate-100">{act.name}</p>

              {/* Activity Stats Grid */}
              <div className="grid grid-cols-4 gap-2 bg-slate-900/70 p-3 rounded-2xl border border-slate-800/80 text-center">
                <div>
                  <p className="text-[10px] text-slate-400">Cự ly</p>
                  <p className="font-extrabold text-sm text-[#CCFF00] mt-0.5">
                    {(act.distance / 1000).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">km</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Thời gian</p>
                  <p className="font-bold text-sm text-slate-200 mt-0.5">{formatTime(act.moving_time)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Pace / Tốc độ</p>
                  <p className="font-bold text-sm text-slate-200 mt-0.5">{formatPace(act.distance, act.moving_time)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Điểm quy đổi</p>
                  <p className="font-extrabold text-sm text-[#FC4C02] mt-0.5">+{act.calculated_points} pts</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nhập Bài Tập Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xl text-white">GHI BÀI TẬP THỂ THAO</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Môn Thể Thao</label>
                <select
                  value={actType}
                  onChange={(e) => setActType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#CCFF00]"
                >
                  <option value="Run">🏃 Chạy bộ (Run)</option>
                  <option value="Walk">🚶 Đi bộ (Walk)</option>
                  <option value="Ride">🚴 Đạp xe (Ride)</option>
                  <option value="Swim">🏊 Bơi lội (Swim)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tên Tùy Chỉnh Bài Tập</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chạy sáng Hồ Tây"
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Cự Ly (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="10.5"
                    value={actDistanceKm}
                    onChange={(e) => setActDistanceKm(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Thời Gian (Phút)</label>
                  <input
                    type="number"
                    required
                    placeholder="55"
                    value={actDurationMin}
                    onChange={(e) => setActDurationMin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Độ Cao Leo Dốc (Mét)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={actElevation}
                  onChange={(e) => setActElevation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 text-sm font-semibold hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#CCFF00] text-black text-sm font-extrabold shadow-lg shadow-[#CCFF00]/20"
                >
                  Lưu Bài Tập & Tính Điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
