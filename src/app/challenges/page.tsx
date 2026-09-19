'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Challenge, SportType } from '@/types';
import { Trophy, PlusCircle, Users, CheckCircle2, Calendar, Target, ArrowRight, Edit3, Eye, ShieldCheck, Flame, Sparkles, Medal, Crown, Clock, X } from 'lucide-react';

export default function ChallengesPage() {
  const { challenges, createChallenge, updateChallenge, joinChallenge, currentUser, profiles, activities, t } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // State cho Form Tạo mới / Chỉnh sửa
  const [chTitle, setChTitle] = useState('');
  const [chDesc, setChDesc] = useState('');
  const [chType, setChType] = useState<SportType>('Run');
  const [chTargetKm, setChTargetKm] = useState('100');
  const [chStartDate, setChStartDate] = useState('2026-10-01');
  const [chEndDate, setChEndDate] = useState('2026-10-31');
  const [chBannerUrl, setChBannerUrl] = useState('/images/cisco_sports_hero.jpg');
  const [chStatus, setChStatus] = useState<'active' | 'upcoming' | 'completed'>('active');

  const isAdminOrOrganizer = currentUser?.role === 'admin' || currentUser?.role === 'organizer';

  const openCreateModal = () => {
    setChTitle('');
    setChDesc('');
    setChType('Run');
    setChTargetKm('100');
    setChStartDate('2026-10-01');
    setChEndDate('2026-10-31');
    setChBannerUrl('/images/cisco_sports_hero.jpg');
    setChStatus('active');
    setShowCreateModal(true);
  };

  const openEditModal = (ch: Challenge) => {
    setEditingChallenge(ch);
    setChTitle(ch.title);
    setChDesc(ch.description);
    setChType(ch.type);
    setChTargetKm(String(ch.target_km));
    setChStartDate(ch.start_date);
    setChEndDate(ch.end_date);
    setChBannerUrl(ch.banner_url || '/images/cisco_sports_hero.jpg');
    setChStatus(ch.status);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chTitle.trim()) return;

    createChallenge({
      title: chTitle,
      description: chDesc,
      type: chType,
      target_km: parseFloat(chTargetKm) || 100,
      start_date: chStartDate,
      end_date: chEndDate,
      banner_url: chBannerUrl || '/images/cisco_sports_hero.jpg',
    });

    setShowCreateModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge || !chTitle.trim()) return;

    updateChallenge(editingChallenge.id, {
      title: chTitle,
      description: chDesc,
      type: chType,
      target_km: parseFloat(chTargetKm) || 100,
      start_date: chStartDate,
      end_date: chEndDate,
      banner_url: chBannerUrl || '/images/cisco_sports_hero.jpg',
      status: chStatus,
    });

    // Nếu đang xem modal chi tiết giải đấu này thì cập nhật state luôn
    if (selectedChallenge?.id === editingChallenge.id) {
      setSelectedChallenge({
        ...selectedChallenge,
        title: chTitle,
        description: chDesc,
        type: chType,
        target_km: parseFloat(chTargetKm) || 100,
        start_date: chStartDate,
        end_date: chEndDate,
        banner_url: chBannerUrl || '/images/cisco_sports_hero.jpg',
        status: chStatus,
      });
    }

    setEditingChallenge(null);
  };

  const getParticipantProgress = (ch: Challenge, userId?: string) => {
    if (!userId) return { km: '0.0', pct: 0 };
    const userActs = activities.filter(
      (a) =>
        (a.profile_id === userId || a.profile?.id === userId) &&
        (ch.type === 'All' || a.type.toLowerCase() === ch.type.toLowerCase())
    );
    const totalKm = userActs.reduce((acc, a) => acc + a.distance, 0) / 1000;
    const pct = Math.min(100, Math.round((totalKm / ch.target_km) * 100));
    return { km: totalKm.toFixed(1), pct };
  };

  // Tính danh sách thống kê xếp hạng VĐV tham gia giải đấu (Sắp xếp từ cao xuống thấp)
  const getChallengeLeaderboard = (ch: Challenge) => {
    const participants = profiles.filter((p) => ch.participant_ids.includes(p.id));

    const leaderboard = participants.map((profile) => {
      const userActs = activities.filter(
        (a) =>
          (a.profile_id === profile.id || a.profile?.id === profile.id) &&
          (ch.type === 'All' || a.type.toLowerCase() === ch.type.toLowerCase())
      );

      const totalDistMeters = userActs.reduce((sum, a) => sum + a.distance, 0);
      const totalKm = totalDistMeters / 1000;
      const totalPts = userActs.reduce((sum, a) => sum + a.calculated_points, 0);
      const totalElev = userActs.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
      const pct = Math.min(100, Math.round((totalKm / ch.target_km) * 100));

      return {
        profile,
        totalKm,
        totalPts,
        totalElev,
        pct,
        workoutCount: userActs.length,
        isCompleted: totalKm >= ch.target_km,
      };
    });

    // Sắp xếp danh sách thành tích từ cao xuống thấp
    leaderboard.sort((a, b) => b.totalKm - a.totalKm || b.totalPts - a.totalPts);

    return leaderboard.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[#00BCEB] font-extrabold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-[#CCFF00]" />
            <span>{t('challenges', 'tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{t('challenges', 'title')}</h1>
          <p className="text-sm text-slate-400">{t('challenges', 'desc')}</p>
        </div>

        {isAdminOrOrganizer && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FC4C02] to-orange-500 hover:from-orange-500 hover:to-[#FC4C02] text-white font-extrabold text-sm shadow-lg shadow-[#FC4C02]/20 transition-all btn-interactive"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo Giải Đấu Mới</span>
          </button>
        )}
      </div>

      {/* Challenge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((ch) => {
          const isJoined = currentUser ? ch.participant_ids.includes(currentUser.id) : false;
          const userProgress = getParticipantProgress(ch, currentUser?.id);

          return (
            <div
              key={ch.id}
              className="glass-card rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between hover:border-[#00BCEB]/50 transition-all group shadow-xl"
            >
              {/* Banner Top */}
              <div
                className="h-44 bg-cover bg-center relative p-4 flex flex-col justify-between cursor-pointer"
                onClick={() => setSelectedChallenge(ch)}
                style={{ backgroundImage: `url(${ch.banner_url || '/images/cisco_sports_hero.jpg'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-900/90 text-xs font-bold text-[#CCFF00] border border-slate-700">
                    {ch.type === 'Run' ? '🏃 Chạy bộ' : ch.type === 'Ride' ? '🚴 Đạp xe' : ch.type === 'Walk' ? '🚶 Đi bộ' : '🏊 Bơi lội'}
                  </span>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                    ch.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                    ch.status === 'upcoming' ? 'bg-[#00BCEB]/20 text-[#00BCEB] border-[#00BCEB]/40' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {ch.status === 'active' ? '🔴 Đang diễn ra' : ch.status === 'upcoming' ? '⏳ Sắp diễn ra' : '🏁 Đã kết thúc'}
                  </span>
                </div>

                <div className="relative z-10 space-y-1">
                  <h3 className="font-extrabold text-lg text-white group-hover:text-[#00BCEB] transition-colors">{ch.title}</h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>{ch.start_date} → {ch.end_date}</span>
                  </p>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{ch.description}</p>

                {/* Progress bar */}
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-[#FC4C02]" /> Mục tiêu: {ch.target_km} km
                    </span>
                    <span className="text-[#CCFF00] font-extrabold">
                      {isJoined ? `${userProgress.km} km (${userProgress.pct}%)` : t('challenges', 'notJoined')}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00BCEB] via-[#CCFF00] to-[#FC4C02] rounded-full transition-all duration-500"
                      style={{ width: `${isJoined ? userProgress.pct : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedChallenge(ch)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition-colors"
                      title="Xem BXH & Chi tiết giải đấu"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00BCEB]" />
                      <span>Chi Tiết & BXH</span>
                    </button>

                    {isAdminOrOrganizer && (
                      <button
                        onClick={() => openEditModal(ch)}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 transition-colors"
                        title="Chỉnh Sửa Giải Đấu"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isJoined ? (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã tham gia
                    </span>
                  ) : (
                    <button
                      onClick={() => joinChallenge(ch.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#00BCEB] hover:bg-[#00a3cc] text-slate-950 font-extrabold text-xs shadow-md transition-all btn-interactive"
                    >
                      <span>Tham Gia</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: TẠO HOẶC CHỈNH SỬA GIẢI ĐẤU (Admin/Organizer) */}
      {(showCreateModal || editingChallenge) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-[#FC4C02]" />
                <h3 className="font-extrabold text-xl text-white">
                  {editingChallenge ? 'Chỉnh Sửa Thông Tin Giải Đấu' : 'Tạo Giải Đấu Thể Thao Mới'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingChallenge(null);
                }}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingChallenge ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tên Giải Đấu / Sự Kiện</label>
                <input
                  type="text"
                  required
                  placeholder="CISCO KINETIC MARATHON 2026 🏆"
                  value={chTitle}
                  onChange={(e) => setChTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mô Tả / Thể Lệ Cuộc Thi</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả thể lệ giải đấu, phần thưởng và quy định..."
                  value={chDesc}
                  onChange={(e) => setChDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Bộ Môn Thể Thao</label>
                  <select
                    value={chType}
                    onChange={(e) => setChType(e.target.value as SportType)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                  >
                    <option value="Run">🏃 Chạy Bộ (Run)</option>
                    <option value="Ride">🚴 Đạp Xe (Ride)</option>
                    <option value="Walk">🚶 Đi Bộ (Walk)</option>
                    <option value="Swim">🏊 Bơi Lội (Swim)</option>
                    <option value="Hike">🥾 Leo Núi (Hike)</option>
                    <option value="All">🌐 Tất Cả Bộ Môn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mục Tiêu Cự Ly (km)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={chTargetKm}
                    onChange={(e) => setChTargetKm(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Ngày Bắt Đầu</label>
                  <input
                    type="date"
                    required
                    value={chStartDate}
                    onChange={(e) => setChStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Ngày Kết Thúc</label>
                  <input
                    type="date"
                    required
                    value={chEndDate}
                    onChange={(e) => setChEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                  />
                </div>
              </div>

              {editingChallenge && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Trạng Thái Giải Đấu</label>
                  <select
                    value={chStatus}
                    onChange={(e) => setChStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                  >
                    <option value="active">🔴 Đang diễn ra (Active)</option>
                    <option value="upcoming">⏳ Sắp diễn ra (Upcoming)</option>
                    <option value="completed">🏁 Đã kết thúc (Completed)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Đường Dẫn Hình Ảnh Banner</label>
                <input
                  type="text"
                  placeholder="/images/cisco_sports_hero.jpg"
                  value={chBannerUrl}
                  onChange={(e) => setChBannerUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingChallenge(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 text-sm font-semibold hover:bg-slate-900"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#FC4C02] to-orange-500 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-[#FC4C02]/20"
                >
                  {editingChallenge ? 'Cập Nhật Giải Đấu' : 'Xuất Bản Giải Đấu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM CHI TIẾT GIẢI ĐẤU & BANG XẾP HẠNG VĐV THAM GIA */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Header Banner Modal */}
            <div
              className="h-48 sm:h-56 bg-cover bg-center relative p-6 flex flex-col justify-between flex-shrink-0"
              style={{ backgroundImage: `url(${selectedChallenge.banner_url || '/images/cisco_sports_hero.jpg'})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-3.5 py-1 rounded-full bg-slate-900/90 text-xs font-bold text-[#CCFF00] border border-slate-700">
                    {selectedChallenge.type === 'Run' ? '🏃 Chạy bộ' : selectedChallenge.type === 'Ride' ? '🚴 Đạp xe' : '🚶 Đi bộ'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                    selectedChallenge.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                    selectedChallenge.status === 'upcoming' ? 'bg-[#00BCEB]/20 text-[#00BCEB] border-[#00BCEB]/40' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {selectedChallenge.status === 'active' ? '🔴 Đang diễn ra' : selectedChallenge.status === 'upcoming' ? '⏳ Sắp diễn ra' : '🏁 Đã kết thúc'}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="relative z-10 space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedChallenge.title}</h2>
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#CCFF00]" />
                  <span>Thời gian: {selectedChallenge.start_date} → {selectedChallenge.end_date}</span>
                  <span>•</span>
                  <Target className="w-4 h-4 text-[#FC4C02]" />
                  <span>Mục tiêu: {selectedChallenge.target_km} km</span>
                </p>
              </div>
            </div>

            {/* Modal Body Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Description & Action */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="space-y-1 max-w-xl">
                  <span className="text-[10px] font-extrabold text-[#00BCEB] uppercase tracking-wider">THỂ LỆ & MÔ TẢ</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedChallenge.description}</p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {isAdminOrOrganizer && (
                    <button
                      onClick={() => {
                        openEditModal(selectedChallenge);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-amber-500/40 flex items-center space-x-1.5"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Sửa Giải Đấu</span>
                    </button>
                  )}

                  {!selectedChallenge.participant_ids.includes(currentUser?.id || '') && (
                    <button
                      onClick={() => {
                        joinChallenge(selectedChallenge.id);
                        setSelectedChallenge({
                          ...selectedChallenge,
                          participant_ids: [...selectedChallenge.participant_ids, currentUser?.id || ''],
                        });
                      }}
                      className="px-5 py-2 rounded-xl bg-[#00BCEB] hover:bg-[#00a3cc] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00BCEB]/20 flex items-center space-x-1.5 btn-interactive"
                    >
                      <span>Tham Gia Ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Leaderboard Table Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#CCFF00]" />
                    <span>Thống Kê Thành Tích VĐV Tham Gia ({selectedChallenge.participant_ids.length} VĐV)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Sắp xếp từ thành tích cao nhất đến thấp nhất</span>
                </div>

                {/* Table */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-950 border-b border-slate-800">
                          <th className="py-3.5 px-4 font-semibold text-center w-16">Thứ Hạng</th>
                          <th className="py-3.5 px-4 font-semibold">Vận Động Viên</th>
                          <th className="py-3.5 px-4 font-semibold">Đội Nhóm</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Thành Tích (Cự Ly)</th>
                          <th className="py-3.5 px-4 font-semibold text-center w-36">Tiến Độ Target</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Leo Dốc</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Điểm Tích Lũy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {getChallengeLeaderboard(selectedChallenge).map((entry) => {
                          const isMe = currentUser?.id === entry.profile.id;
                          return (
                            <tr
                              key={entry.profile.id}
                              className={`hover:bg-slate-800/50 transition-colors ${
                                isMe ? 'bg-[#00BCEB]/10 border-l-4 border-l-[#00BCEB]' : ''
                              }`}
                            >
                              {/* Rank */}
                              <td className="py-3.5 px-4 text-center font-extrabold">
                                {entry.rank === 1 ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black">1</span>
                                ) : entry.rank === 2 ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black">2</span>
                                ) : entry.rank === 3 ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white font-black">3</span>
                                ) : (
                                  <span className="text-slate-400 font-bold">#{entry.rank}</span>
                                )}
                              </td>

                              {/* Athlete Profile */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={entry.profile.avatar_url}
                                    alt={entry.profile.full_name}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-700"
                                  />
                                  <div>
                                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                                      <span>{entry.profile.full_name}</span>
                                      {isMe && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00BCEB] text-slate-950 font-extrabold uppercase">
                                          Bạn
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[11px] text-slate-400">{entry.profile.department}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Team */}
                              <td className="py-3.5 px-4">
                                {entry.profile.team ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                                    {entry.profile.team.name}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-500 italic">Cá nhân</span>
                                )}
                              </td>

                              {/* Distance */}
                              <td className="py-3.5 px-4 text-right">
                                <strong className="text-white text-sm font-extrabold">{entry.totalKm.toFixed(1)}</strong>
                                <span className="text-xs text-slate-400 font-normal"> / {selectedChallenge.target_km} km</span>
                              </td>

                              {/* Progress bar */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-extrabold">
                                    <span className={entry.isCompleted ? 'text-emerald-400' : 'text-[#CCFF00]'}>
                                      {entry.isCompleted ? 'Hoàn thành 🎉' : `${entry.pct}%`}
                                    </span>
                                    <span className="text-slate-500">{entry.workoutCount} buổi</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                    <div
                                      className={`h-full ${entry.isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#00BCEB] to-[#CCFF00]'} rounded-full`}
                                      style={{ width: `${entry.pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Elevation */}
                              <td className="py-3.5 px-4 text-right text-xs text-slate-300 font-bold">
                                {entry.totalElev.toLocaleString('vi-VN')} m
                              </td>

                              {/* Points */}
                              <td className="py-3.5 px-4 text-right">
                                <span className="font-extrabold text-xs text-[#FC4C02]">
                                  +{entry.totalPts.toFixed(1)} pts
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {selectedChallenge.participant_ids.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500 text-xs font-semibold">
                              Chưa có vận động viên nào tham gia giải đấu này. Bấm nút Tham Gia để trở thành VĐV đầu tiên!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedChallenge(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Đóng Màn Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
