'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Activity as ActivityIcon, Zap, RefreshCw, PlusCircle, Calendar, Clock, Filter, Search, ChevronRight, Eye, Trophy, Flame, MapPin, Award, User, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Profile, Activity, SportType } from '@/types';

export default function ActivitiesPage() {
  const { activities, profiles, currentUser, addActivity, refreshData } = useApp();

  const [selectedType, setSelectedType] = useState<SportType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthleteDetail, setSelectedAthleteDetail] = useState<Profile | null>(null);

  // Modal Ghi Hoạt Động Mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [actName, setActName] = useState('');
  const [actType, setActType] = useState<'Run' | 'Ride' | 'Walk' | 'Swim' | 'Hike'>('Run');
  const [actDistanceKm, setActDistanceKm] = useState('');
  const [actDurationMin, setActDurationMin] = useState('');
  const [actElevation, setActElevation] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await refreshData();
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseFloat(actDistanceKm) || 0;
    const mins = parseFloat(actDurationMin) || 0;
    const elev = parseFloat(actElevation) || 0;

    addActivity({
      name: actName || `Hoạt động ${actType}`,
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

  // Helper định dạng pace / tốc độ
  const formatPace = (distanceMeters: number, seconds: number, type: SportType) => {
    if (!distanceMeters || !seconds) return '-';
    const km = distanceMeters / 1000;
    if (km <= 0) return '-';

    if (type === 'Ride') {
      const speed = (km / (seconds / 3600)).toFixed(1);
      return `${speed} km/h`;
    }

    const totalMinutes = seconds / 60;
    const paceDecimal = totalMinutes / km;
    const paceMin = Math.floor(paceDecimal);
    const paceSec = Math.round((paceDecimal - paceMin) * 60);
    return `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} /km`;
  };

  // Helper thời gian di chuyển
  const formatTime = (seconds: number) => {
    if (!seconds) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Helper định dạng ngày tương đối (Ví dụ: "10 phút trước", "Hôm nay 08:30")
  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Vừa xong';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} giờ trước`;
    }
    if (diffSeconds < 172800) return 'Hôm qua';

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Nhóm các hoạt động theo Vận Động Viên & Sắp Xếp theo Cập Nhật Gần Nhất
  const athleteRows = useMemo(() => {
    // 1. Filter tất cả hoạt động theo môn chọn nếu selectedType !== 'All'
    const filteredGlobalActivities = selectedType === 'All'
      ? activities
      : activities.filter((a) => a.type === selectedType);

    // Map các profile kèm danh sách hoạt động tương ứng
    const rows = profiles.map((prof) => {
      const profActs = filteredGlobalActivities.filter(
        (a) => a.profile_id === prof.id || a.profile?.id === prof.id
      );

      // Sắp xếp các hoạt động của VĐV này theo thời gian giảm dần
      profActs.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

      const totalDist = profActs.reduce((acc, curr) => acc + (curr.distance || 0), 0);
      const totalElev = profActs.reduce((acc, curr) => acc + (curr.total_elevation_gain || 0), 0);
      const totalPts = profActs.reduce((acc, curr) => acc + (curr.calculated_points || 0), 0);
      const latestAct = profActs.length > 0 ? profActs[0] : null;
      const latestTimestamp = latestAct ? new Date(latestAct.start_date).getTime() : 0;

      return {
        profile: prof,
        activities: profActs,
        totalCount: profActs.length,
        totalDistanceKm: (totalDist / 1000).toFixed(1),
        totalElevationM: Math.round(totalElev),
        totalPoints: totalPts,
        latestActivity: latestAct,
        latestTimestamp: latestTimestamp,
      };
    });

    // 2. Lọc theo từ khóa tìm kiếm (Tên VĐV hoặc Tên Team)
    const searchedRows = rows.filter((r) => {
      if (selectedType !== 'All' && r.totalCount === 0) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchName = r.profile.full_name.toLowerCase().includes(query);
      const matchTeam = (r.profile.team?.name || '').toLowerCase().includes(query);
      return matchName || matchTeam;
    });

    // 3. SẮP XẾP: Vận động viên có HOẠT ĐỘNG CẬP NHẬT GẦN NHẤT lên đầu tiên!
    searchedRows.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

    return searchedRows;
  }, [profiles, activities, selectedType, searchQuery]);

  // Hoạt động của VĐV đang chọn trong Modal Chi Tiết
  const selectedAthleteActivities = useMemo(() => {
    if (!selectedAthleteDetail) return [];
    return activities
      .filter((a) => a.profile_id === selectedAthleteDetail.id || a.profile?.id === selectedAthleteDetail.id)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [activities, selectedAthleteDetail]);

  const sportCategories: { type: SportType; name: string }[] = [
    { type: 'All', name: 'Tất Cả Môn' },
    { type: 'Run', name: '🏃 Chạy Bộ' },
    { type: 'Ride', name: '🚴 Đạp Xe' },
    { type: 'Walk', name: '🚶 Đi Bộ' },
    { type: 'Swim', name: '🏊 Bơi Lội' },
    { type: 'Hike', name: '🥾 Leo Núi' },
  ];

  const getSportBadge = (type: SportType) => {
    switch (type) {
      case 'Run':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-1">🏃 Chạy bộ</span>;
      case 'Ride':
        return <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold inline-flex items-center gap-1">🚴 Đạp xe</span>;
      case 'Walk':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold inline-flex items-center gap-1">🚶 Đi bộ</span>;
      case 'Swim':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold inline-flex items-center gap-1">🏊 Bơi lội</span>;
      case 'Hike':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold inline-flex items-center gap-1">🥾 Leo núi</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">⚡ Khác</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Strava Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[#FC4C02] font-extrabold text-xs uppercase tracking-wider">
            <ActivityIcon className="w-4 h-4" />
            <span>ĐỒNG BỘ STRAVA & HOẠT ĐỘNG THỂ THAO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">NHẬT KÝ HOẠT ĐỘNG THỂ THAO</h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Danh sách rèn luyện theo từng Vận động viên Cisco GSC. Tự động đồng bộ từ Strava hoặc ghi nhận hoạt động trực tiếp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <a
            href="/api/strava/auth"
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#e04300] text-white font-extrabold text-sm shadow-lg shadow-[#FC4C02]/20 transition-all btn-interactive"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Kết Nối Strava</span>
          </a>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all btn-interactive"
          >
            <RefreshCw className={`w-4 h-4 text-[#00BCEB] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Ngay'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-extrabold text-sm shadow-lg shadow-[#CCFF00]/20 transition-all btn-interactive"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ghi Hoạt Động Mới</span>
          </button>
        </div>
      </div>

      {/* Bộ Lọc Môn Thể Thao & Thanh Tìm Kiếm */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
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

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên VĐV hoặc Team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00BCEB] transition-colors"
          />
        </div>
      </div>

      {/* BẢNG NHẬT KÝ THEO VẬN ĐỘNG VIÊN (MỖI VĐV 1 DÒNG) */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FC4C02]" />
              <span>Bảng Nhật Ký Hoạt Động Theo Vận Động Viên ({athleteRows.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sắp xếp ưu tiên VĐV có <span className="text-[#CCFF00] font-bold">hoạt động cập nhật mới nhất</span> lên trên cùng.
            </p>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400">
            Click vào dòng để xem chi tiết
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Vận Động Viên</th>
                <th className="py-3.5 px-4">Đội Nhóm</th>
                <th className="py-3.5 px-4">Hoạt Động Gần Nhất</th>
                <th className="py-3.5 px-4 text-center">Tổng Số</th>
                <th className="py-3.5 px-4 text-right">Tổng Cự Ly</th>
                <th className="py-3.5 px-4 text-right">Leo Dốc</th>
                <th className="py-3.5 px-4 text-right">Tổng Điểm</th>
                <th className="py-3.5 px-4 text-center">Cập Nhật</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {athleteRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy vận động viên hoặc hoạt động nào phù hợp.
                  </td>
                </tr>
              ) : (
                athleteRows.map(({ profile, activities: profActs, totalCount, totalDistanceKm, totalElevationM, totalPoints, latestActivity, latestTimestamp }) => {
                  const isCurrent = currentUser?.id === profile.id;

                  return (
                    <tr
                      key={profile.id}
                      onClick={() => setSelectedAthleteDetail(profile)}
                      className={`group hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-[#00BCEB]/5' : ''
                      }`}
                    >
                      {/* Cột 1: Vận Động Viên */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={profile.full_name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 group-hover:border-[#00BCEB] transition-colors"
                            />
                            {profile.strava_id && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FC4C02] text-[9px] font-black text-white flex items-center justify-center border border-slate-900" title="Đã kết nối Strava">
                                ⚡
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white group-hover:text-[#00BCEB] transition-colors">
                                {profile.full_name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#CCFF00] text-black">
                                  BẠN
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5 capitalize">
                              {profile.role === 'admin' ? ' Ban Tổ Chức' : profile.role === 'captain' ? ' Đội Trưởng' : ' VĐV GSC'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Đội Nhóm */}
                      <td className="py-4 px-4">
                        {profile.team ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
                            {profile.team.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Cá nhân</span>
                        )}
                      </td>

                      {/* Cột 3: Hoạt Động Gần Nhất */}
                      <td className="py-4 px-4">
                        {latestActivity ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {getSportBadge(latestActivity.type)}
                              <span className="font-semibold text-slate-200 text-xs line-clamp-1 max-w-[180px]">
                                {latestActivity.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                              <span className="text-[#CCFF00] font-bold">{(latestActivity.distance / 1000).toFixed(2)} km</span>
                              <span>•</span>
                              <span>{formatTime(latestActivity.moving_time)}</span>
                              <span>•</span>
                              <span>{formatPace(latestActivity.distance, latestActivity.moving_time, latestActivity.type)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Chưa có hoạt động</span>
                        )}
                      </td>

                      {/* Cột 4: Tổng Số Hoạt Động */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200">
                          {totalCount} log
                        </span>
                      </td>

                      {/* Cột 5: Tổng Cự Ly */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-extrabold text-[#CCFF00]">
                          {totalDistanceKm} <span className="text-[10px] text-slate-400 font-normal">km</span>
                        </span>
                      </td>

                      {/* Cột 6: Leo Dốc */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-slate-300">
                          {totalElevationM} <span className="text-[10px] text-slate-500 font-normal">m</span>
                        </span>
                      </td>

                      {/* Cột 7: Tổng Điểm */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-extrabold text-[#FC4C02]">
                          +{totalPoints} <span className="text-[10px] text-[#FC4C02]/70 font-normal">pts</span>
                        </span>
                      </td>

                      {/* Cột 8: Cập Nhật */}
                      <td className="py-4 px-4 text-center">
                        {latestActivity ? (
                          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                            {formatRelativeTime(latestActivity.start_date)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>

                      {/* Cột 9: Thao Tác */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedAthleteDetail(profile)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-[#00BCEB] hover:text-slate-950 text-slate-200 text-xs font-bold transition-all border border-slate-700 inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi Tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT HOẠT ĐỘNG CỦA MỘT VẬN ĐỘNG VIÊN */}
      {selectedAthleteDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/80">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedAthleteDetail.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={selectedAthleteDetail.full_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#00BCEB] shadow-lg shadow-[#00BCEB]/20"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-xl text-white">{selectedAthleteDetail.full_name}</h3>
                    {selectedAthleteDetail.team && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                        {selectedAthleteDetail.team.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>VĐV Cisco GSC Vietnam</span>
                    {selectedAthleteDetail.strava_id && (
                      <span className="text-[#FC4C02] font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-[#FC4C02]" /> Đã kết nối Strava
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAthleteDetail(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Summary Quick Cards */}
            <div className="p-6 grid grid-cols-3 gap-3 bg-slate-950/40 border-b border-slate-800">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Tổng Cự Ly</p>
                <p className="font-extrabold text-lg text-[#CCFF00] mt-0.5">
                  {(selectedAthleteActivities.reduce((acc, curr) => acc + (curr.distance || 0), 0) / 1000).toFixed(2)} km
                </p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Tổng Leo Dốc</p>
                <p className="font-extrabold text-lg text-slate-200 mt-0.5">
                  {Math.round(selectedAthleteActivities.reduce((acc, curr) => acc + (curr.total_elevation_gain || 0), 0))} m
                </p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Tổng Điểm Tích Lũy</p>
                <p className="font-extrabold text-lg text-[#FC4C02] mt-0.5">
                  +{selectedAthleteActivities.reduce((acc, curr) => acc + (curr.calculated_points || 0), 0)} pts
                </p>
              </div>
            </div>

            {/* Body: Danh sách tất cả hoạt động của VĐV này */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="font-extrabold text-sm text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Danh Sách Hoạt Động ({selectedAthleteActivities.length})</span>
                <span className="text-xs text-slate-500 font-normal">Mới nhất xếp trên</span>
              </h4>

              {selectedAthleteActivities.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Vận động viên này chưa recorded hoạt động nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAthleteActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getSportBadge(act.type)}
                          <span className="font-bold text-white text-sm">{act.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center space-x-2">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(act.start_date).toLocaleString('vi-VN')}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-right w-full sm:w-auto bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Cự ly</p>
                          <p className="font-extrabold text-xs text-[#CCFF00]">{(act.distance / 1000).toFixed(2)} km</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Thời gian</p>
                          <p className="font-bold text-xs text-slate-300">{formatTime(act.moving_time)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Pace</p>
                          <p className="font-bold text-xs text-slate-300">{formatPace(act.distance, act.moving_time, act.type)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Điểm</p>
                          <p className="font-extrabold text-xs text-[#FC4C02]">+{act.calculated_points}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setSelectedAthleteDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Đóng Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GHI HOẠT ĐỘNG THỂ THAO MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xl text-white">GHI HOẠT ĐỘNG THỂ THAO MỚI</h3>
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
                  <option value="Hike">🥾 Leo núi (Hike)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tên Hoạt Động</label>
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
                  className="px-5 py-2 rounded-xl bg-[#CCFF00] text-black text-sm font-extrabold shadow-lg shadow-[#CCFF00]/20 btn-interactive"
                >
                  Lưu Hoạt Động & Tính Điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
