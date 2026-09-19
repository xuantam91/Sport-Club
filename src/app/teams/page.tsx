'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Team, Profile } from '@/types';
import { Users, PlusCircle, UserPlus, CheckCircle2, Copy, Check, Sparkles, Edit3, Eye, LogOut, ArrowRight, ShieldCheck, Flame, Trophy, Calendar, Upload, Image as ImageIcon, UserMinus, UserCheck, Crown } from 'lucide-react';

const PRESET_TEAM_AVATARS = [
  { id: 'victory', name: '🏆 Cisco Victory Team', url: '/images/cisco_team_victory.jpg' },
  { id: 'hero', name: '⚡ Cisco Cyber Runners', url: '/images/cisco_sports_hero.jpg' },
  { id: 'run', name: '🏃 Speed Strikers', url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400' },
  { id: 'fitness', name: '🔥 Velocity Fitness', url: 'https://images.unsplash.com/photo-1517649763962-0c6232661c00?w=400' },
  { id: 'workout', name: '💪 Endurance Titans', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400' },
];

export default function TeamsPage() {
  const { teams, currentUser, profiles, activities, createTeam, updateTeam, joinTeam, joinTeamById, leaveTeam, t } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Form State cho Tạo / Sửa Team
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [teamAvatarUrl, setTeamAvatarUrl] = useState('/images/cisco_team_victory.jpg');

  // Modal Thêm Thành Viên VĐV
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>('');

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canEditTeam = (team: Team) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.team_id === team.id && currentUser.role === 'captain') return true;
    if (team.leader_id === currentUser.id) return true;
    return false;
  };

  const openCreateModal = () => {
    setTeamName('');
    setTeamDesc('');
    setTeamAvatarUrl('/images/cisco_team_victory.jpg');
    setShowCreateModal(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDesc(team.description || '');
    setTeamCode(team.code);
    setTeamAvatarUrl(team.avatar_url || '/images/cisco_team_victory.jpg');
    setSelectedMemberToAdd('');
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    const newTeam = createTeam({ name: teamName, description: teamDesc });
    if (teamAvatarUrl) {
      updateTeam(newTeam.id, { avatar_url: teamAvatarUrl });
    }

    setShowCreateModal(false);
    setMessage({ type: 'success', text: `Đã tạo team "${newTeam.name}" thành công! Mã gia nhập: ${newTeam.code}` });
  };

  const handleEditTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !teamName.trim()) return;

    updateTeam(editingTeam.id, {
      name: teamName,
      description: teamDesc,
      code: teamCode,
      avatar_url: teamAvatarUrl,
    });

    if (selectedTeam?.id === editingTeam.id) {
      setSelectedTeam({
        ...selectedTeam,
        name: teamName,
        description: teamDesc,
        code: teamCode,
        avatar_url: teamAvatarUrl,
      });
    }

    setEditingTeam(null);
    setMessage({ type: 'success', text: `Đã cập nhật thông tin và logo cho team "${teamName}"!` });
  };

  const handleJoinByCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    const success = joinTeam(joinCodeInput);
    if (success) {
      setShowJoinModal(false);
      setJoinCodeInput('');
      setMessage({ type: 'success', text: 'Bạn đã gia nhập đội nhóm Cisco GSC thành công!' });
    } else {
      setMessage({ type: 'error', text: 'Mã gia nhập không đúng hoặc không tồn tại!' });
    }
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File ảnh quá lớn (>8MB). Vui lòng chọn ảnh dung lượng nhỏ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setTeamAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddMemberToTeam = (teamId: string) => {
    if (!selectedMemberToAdd) return;
    joinTeamById(selectedMemberToAdd); // Add candidate to team
    const targetUser = profiles.find((p) => p.id === selectedMemberToAdd);
    setSelectedMemberToAdd('');
    setMessage({ type: 'success', text: `Đã thêm VĐV ${targetUser?.full_name || ''} vào team thành công!` });
  };

  const handleRemoveMemberFromTeam = (memberId: string, memberName: string) => {
    if (confirm(`Bạn có chắc chắn muốn mời VĐV ${memberName} rời khỏi team không?`)) {
      leaveTeam(memberId);
      setMessage({ type: 'success', text: `Đã mời VĐV ${memberName} rời khỏi team.` });
    }
  };

  const copyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Tính Bảng xếp hạng VĐV nội bộ trong Team (Xếp hạng từ cao xuống thấp)
  const getTeamMemberLeaderboard = (team: Team) => {
    const members = profiles.filter((p) => p.team_id === team.id || p.team?.id === team.id);

    const leaderboard = members.map((profile) => {
      const userActs = activities.filter(
        (a) => (a.profile_id === profile.id || a.profile?.id === profile.id) && !a.id.startsWith('act-')
      );

      const totalDistMeters = userActs.reduce((sum, a) => sum + a.distance, 0);
      const totalKm = totalDistMeters / 1000;
      const totalPts = userActs.reduce((sum, a) => sum + a.calculated_points, 0);
      const totalElev = userActs.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);

      return {
        profile,
        totalKm,
        totalPts,
        totalElev: Math.round(totalElev),
        workoutCount: userActs.length,
      };
    });

    // Sắp xếp thành tích VĐV từ cao xuống thấp
    leaderboard.sort((a, b) => b.totalKm - a.totalKm || b.totalPts - a.totalPts);

    return leaderboard.map((item, idx) => ({ ...item, rank: idx + 1 }));
  };

  // Nhật ký bài tập gần nhất của các thành viên trong Team
  const getTeamActivities = (team: Team) => {
    const memberIds = new Set(
      profiles.filter((p) => p.team_id === team.id || p.team?.id === team.id).map((p) => p.id)
    );
    return activities.filter((a) => memberIds.has(a.profile_id) || (a.profile && memberIds.has(a.profile.id)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cisco Team Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#00BCEB]/30 shadow-2xl bg-slate-900 group">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: "url('/images/cisco_team_victory.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17] via-[#0B0F17]/85 to-transparent"></div>

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2 text-[#00BCEB] font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#CCFF00]" />
              <span>{t('teams', 'tag')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{t('teams', 'title')}</h1>
            <p className="text-slate-300 text-sm leading-relaxed">{t('teams', 'desc')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 backdrop-blur-md transition-all btn-interactive"
            >
              <UserPlus className="w-4 h-4 text-[#00BCEB]" />
              <span>Nhập Mã Gia Nhập Team</span>
            </button>

            {(currentUser?.role === 'admin' || currentUser?.role === 'organizer' || !currentUser?.team_id) && (
              <button
                onClick={openCreateModal}
                className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FC4C02] to-orange-500 hover:from-orange-500 hover:to-[#FC4C02] text-white font-extrabold text-sm shadow-lg shadow-[#FC4C02]/20 transition-all btn-interactive"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('teams', 'createTeamBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Notification Box */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="text-xs sm:text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {message.text}
          </span>
          <button onClick={() => setMessage(null)} className="text-xs underline font-bold hover:text-white">
            Đóng
          </button>
        </div>
      )}

      {/* CURRENT USER TEAM CARD */}
      {currentUser?.team && (
        <div className="glass-card p-6 rounded-3xl border-2 border-[#00BCEB] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#00BCEB] text-slate-950 font-black text-xs rounded-bl-2xl uppercase tracking-wider shadow-md">
            ĐỘI NHÓM CỦA BẠN (CISCO)
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
            <div className="flex items-center space-x-4">
              <img
                src={currentUser.team.avatar_url || '/images/cisco_team_victory.jpg'}
                alt={currentUser.team.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#00BCEB] shadow-xl"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-xl sm:text-2xl text-white flex items-center gap-2">
                  <span>{currentUser.team.name}</span>
                  {currentUser.role === 'captain' && (
                    <span className="px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" /> ĐỘI TRƯỞNG
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300">{currentUser.team.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center space-x-4 bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Mã Gia Nhập</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-[#CCFF00] tracking-wider text-sm">
                      {currentUser.team.code}
                    </span>
                    <button
                      onClick={(e) => copyCode(currentUser.team!.code, e)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      title="Sao chép mã gia nhập"
                    >
                      {copiedCode === currentUser.team.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="border-l border-slate-800 pl-4">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Thành Viên</p>
                  <p className="font-extrabold text-white text-sm">{currentUser.team.member_count} VĐV</p>
                </div>
              </div>

              {/* Action Buttons for Current User Team */}
              <button
                onClick={() => setSelectedTeam(currentUser.team!)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs border border-slate-700 flex items-center space-x-1.5 transition-colors"
              >
                <Eye className="w-4 h-4 text-[#00BCEB]" />
                <span>Chi Tiết & BXH Team</span>
              </button>

              {canEditTeam(currentUser.team) && (
                <button
                  onClick={() => openEditModal(currentUser.team!)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs border border-amber-500/40 flex items-center space-x-1.5 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Sửa Team</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn RỜI KHỎI đội nhóm này không?')) {
                    leaveTeam();
                    setMessage({ type: 'success', text: 'Bạn đã rời khỏi đội nhóm thành công.' });
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center space-x-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Rời Team</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRID ALL CISCO TEAMS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xl text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00BCEB]" />
            <span>Danh Sách Đội Nhóm Cisco ({teams.length} Team)</span>
          </h2>
          <span className="text-xs text-slate-400">Bảng xếp hạng tổng điểm đội nhóm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const isMyTeam = currentUser?.team_id === team.id;
            const teamMembersCount = profiles.filter((p) => p.team_id === team.id || p.team?.id === team.id).length;

            return (
              <div
                key={team.id}
                className={`glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 border transition-all hover:border-[#00BCEB]/50 shadow-xl group ${
                  isMyTeam ? 'border-[#00BCEB]/60 bg-[#00BCEB]/5' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={team.avatar_url || '/images/cisco_team_victory.jpg'}
                      alt={team.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 group-hover:border-[#00BCEB] transition-colors"
                    />
                    <div>
                      <h3 className="font-extrabold text-base text-white group-hover:text-[#00BCEB] transition-colors">{team.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{teamMembersCount} VĐV Cisco</p>
                    </div>
                  </div>

                  {isMyTeam && (
                    <span className="px-3 py-1 rounded-full bg-[#00BCEB]/20 text-[#00BCEB] text-[11px] font-black border border-[#00BCEB]/40 uppercase">
                      Đội của bạn
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{team.description}</p>

                {/* Team Stats */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Tổng điểm Team</p>
                    <p className="font-black text-lg text-[#CCFF00] mt-0.5">{team.total_points || 0} <span className="text-[10px] font-normal text-slate-400">pts</span></p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Tổng cự ly</p>
                    <p className="font-black text-lg text-white mt-0.5">{((team.total_distance || 0) / 1000).toFixed(1)} <span className="text-[10px] font-normal text-slate-400">km</span></p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#00BCEB]" />
                    <span>Chi Tiết & BXH</span>
                  </button>

                  {canEditTeam(team) && (
                    <button
                      onClick={() => openEditModal(team)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 transition-colors"
                      title="Chỉnh Sửa Team & Thay Đổi Logo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {!isMyTeam && (
                    <button
                      onClick={() => {
                        joinTeamById(team.id);
                        setMessage({ type: 'success', text: `Bạn đã tham gia vào team "${team.name}" thành công!` });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#00BCEB] hover:bg-[#00a3cc] text-slate-950 font-black text-xs shadow-md transition-all btn-interactive flex items-center space-x-1"
                    >
                      <span>Tham Gia</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: TẠO HOẶC CHỈNH SỬA TEAM (Bao gồm thay đổi Ảnh Đại Diện) */}
      {(showCreateModal || editingTeam) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#00BCEB]" />
                <h3 className="font-extrabold text-xl text-white">
                  {editingTeam ? `Chỉnh Sửa Team "${editingTeam.name}"` : 'Tạo Đội Nhóm Cisco Mới'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTeam(null);
                }}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingTeam ? handleEditTeamSubmit : handleCreateTeam} className="space-y-4 overflow-y-auto pr-1.5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tên Đội Nhóm</label>
                <input
                  type="text"
                  required
                  placeholder="Cisco Cyber Runners ⚡"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mô Tả & Slogan Team</label>
                <textarea
                  rows={2}
                  placeholder="Slogan đội nhóm, tinh thần đồng đội..."
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                />
              </div>

              {editingTeam && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mã Gia Nhập Team (Invite Code)</label>
                  <input
                    type="text"
                    required
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-[#CCFF00] font-mono font-bold text-sm focus:outline-none focus:border-[#00BCEB]"
                  />
                </div>
              )}

              {/* THAY ĐỔI ẢNH ĐẠI DIỆN TEAM (Avatar / Logo Selector) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-[#00BCEB] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#CCFF00]" />
                    <span>Ảnh Đại Diện & Logo Team</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Chọn logo hoặc tải từ máy tính</span>
                </div>

                {/* Preset Avatars Grid */}
                <div>
                  <p className="text-[11px] text-slate-300 font-bold mb-2">1. Chọn Logo Mẫu Có Sẵn:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PRESET_TEAM_AVATARS.map((item) => {
                      const isSelected = teamAvatarUrl === item.url;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setTeamAvatarUrl(item.url)}
                          className={`relative h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                            isSelected
                              ? 'border-[#00BCEB] ring-2 ring-[#00BCEB]/40 scale-105'
                              : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                          }`}
                        >
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#00BCEB] text-slate-950 flex items-center justify-center font-black text-[10px]">
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upload custom file from computer */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-slate-300 font-bold">2. Hoặc Tải Logo Tùy Chỉnh Từ Máy Tính:</p>
                  <label className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-900 border-2 border-dashed border-slate-700 hover:border-[#00BCEB] text-slate-300 hover:text-white cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-[#00BCEB]" />
                    <span className="text-xs font-bold">Bấm để chọn file logo (.png, .jpg, .webp)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preview */}
                <div className="flex items-center space-x-3 pt-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <img src={teamAvatarUrl} alt="Logo Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                  <div className="flex-1 space-y-0.5">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">Live Preview Logo Team</span>
                    <input
                      type="text"
                      placeholder="Hoặc dán URL ảnh trực tiếp..."
                      value={teamAvatarUrl}
                      onChange={(e) => setTeamAvatarUrl(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-[#00BCEB]"
                    />
                  </div>
                </div>
              </div>

              {/* TÍNH NĂNG QUẢN LÝ QUÂN SỐ THÀNH VIÊN (Dành cho Admin/Captain trong Edit Modal) */}
              {editingTeam && canEditTeam(editingTeam) && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <label className="block text-xs font-extrabold text-[#CCFF00] uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#00BCEB]" />
                    <span>Thêm VĐV Mới Vào Team</span>
                  </label>

                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedMemberToAdd}
                      onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
                    >
                      <option value="">-- Chọn VĐV tự do để thêm vào team --</option>
                      {profiles
                        .filter((p) => p.team_id !== editingTeam.id && p.team?.id !== editingTeam.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} ({p.department || 'VĐV'}) {p.team ? `- Đang ở team ${p.team.name}` : '- Chưa có team'}
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAddMemberToTeam(editingTeam.id)}
                      disabled={!selectedMemberToAdd}
                      className="px-4 py-2 rounded-xl bg-[#00BCEB] disabled:opacity-50 text-slate-950 font-extrabold text-xs flex-shrink-0"
                    >
                      Thêm VĐV
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTeam(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 text-sm font-semibold hover:bg-slate-900"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#FC4C02] to-orange-500 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-[#FC4C02]/20"
                >
                  {editingTeam ? 'Lưu Thay Đổi Team' : 'Tạo Team Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GIA NHẬP TEAM BẰNG MÃ (Invite Code) */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xl text-white">Gia Nhập Team Cisco Bằng Mã</h3>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinByCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mã Gia Nhập (Invite Code)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: CYBER2026"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-[#CCFF00] font-mono font-bold text-sm uppercase focus:outline-none focus:border-[#00BCEB]"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 text-sm font-semibold hover:bg-slate-900"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#00BCEB] text-slate-950 text-sm font-extrabold shadow-lg shadow-[#00BCEB]/20"
                >
                  Tham Gia Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM CHI TIẾT TEAM & BẢNG XẾP HẠNG THÀNH VIÊN TRONG ĐỘI */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Header Banner */}
            <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedTeam.avatar_url || '/images/cisco_team_victory.jpg'}
                  alt={selectedTeam.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#00BCEB] shadow-xl"
                />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedTeam.name}</h2>
                  <p className="text-xs text-slate-300 mt-1">{selectedTeam.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {canEditTeam(selectedTeam) && (
                  <button
                    onClick={() => {
                      openEditModal(selectedTeam);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-amber-500/40 flex items-center space-x-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Sửa Team & Logo</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedTeam(null)}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Leaderboard Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#CCFF00]" />
                    <span>Bảng Xếp Hạng Thành Viên Nội Bộ Đội ({getTeamMemberLeaderboard(selectedTeam).length} VĐV)</span>
                  </h3>
                  <span className="text-xs text-slate-400">Sắp xếp từ thành tích cự ly cao nhất đến thấp nhất</span>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-950 border-b border-slate-800">
                          <th className="py-3.5 px-4 font-semibold text-center w-16">Hạng</th>
                          <th className="py-3.5 px-4 font-semibold">Vận Động Viên</th>
                          <th className="py-3.5 px-4 font-semibold">Vai Trò</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Cự Ly Tích Lũy</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Leo Dốc</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Điểm Tích Lũy</th>
                          {canEditTeam(selectedTeam) && (
                            <th className="py-3.5 px-4 font-semibold text-center w-28">Thao Tác</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {getTeamMemberLeaderboard(selectedTeam).map((entry) => {
                          const isMe = currentUser?.id === entry.profile.id;
                          const isCaptain = entry.profile.role === 'captain' || entry.profile.id === selectedTeam.leader_id;

                          return (
                            <tr
                              key={entry.profile.id}
                              className={`hover:bg-slate-800/50 transition-colors ${
                                isMe ? 'bg-[#00BCEB]/10 border-l-4 border-l-[#00BCEB]' : ''
                              }`}
                            >
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

                              <td className="py-3.5 px-4">
                                {isCaptain ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 w-fit">
                                    <Crown className="w-3 h-3 text-amber-400" /> Đội Trưởng
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                    VĐV Thể Thao
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <strong className="text-white text-sm font-extrabold">{entry.totalKm.toFixed(1)}</strong>
                                <span className="text-xs text-slate-400 font-normal"> km</span>
                              </td>

                              <td className="py-3.5 px-4 text-right text-xs text-slate-300 font-bold">
                                {entry.totalElev.toLocaleString('vi-VN')} m
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <span className="font-extrabold text-xs text-[#CCFF00]">
                                  +{entry.totalPts.toFixed(1)} pts
                                </span>
                              </td>

                              {canEditTeam(selectedTeam) && (
                                <td className="py-3.5 px-4 text-center">
                                  {!isCaptain && entry.profile.id !== currentUser?.id && (
                                    <button
                                      onClick={() => handleRemoveMemberFromTeam(entry.profile.id, entry.profile.full_name)}
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                      title="Mời VĐV rời khỏi Team"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}

                        {getTeamMemberLeaderboard(selectedTeam).length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500 text-xs font-semibold">
                              Chưa có vận động viên nào tham gia đội nhóm này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Team Activity Logs Feed */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FC4C02]" />
                  <span>Nhật Ký Hoạt Động Gần Đây Của Đội ({getTeamActivities(selectedTeam).length} bài tập)</span>
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {getTeamActivities(selectedTeam).map((act) => (
                    <div key={act.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <img src={act.profile?.avatar_url} alt={act.name} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-white">{act.profile?.full_name} • <span className="text-slate-400 font-normal">{act.name}</span></p>
                          <p className="text-[10px] text-slate-500">📅 {new Date(act.start_date).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <strong className="text-[#CCFF00] font-extrabold">{(act.distance / 1000).toFixed(2)} km</strong>
                        <p className="text-[10px] text-[#FC4C02] font-bold">+{act.calculated_points} pts</p>
                      </div>
                    </div>
                  ))}
                  {getTeamActivities(selectedTeam).length === 0 && (
                    <p className="text-xs text-slate-500 italic">Chưa ghi nhận hoạt động nào gần đây.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                {currentUser?.team_id === selectedTeam.id ? (
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn RỜI KHỎI đội nhóm này không?')) {
                        leaveTeam();
                        setSelectedTeam(null);
                        setMessage({ type: 'success', text: 'Bạn đã rời khỏi đội nhóm thành công.' });
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center space-x-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Rời Team Này</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      joinTeamById(selectedTeam.id);
                      setSelectedTeam(null);
                      setMessage({ type: 'success', text: `Bạn đã tham gia vào team "${selectedTeam.name}" thành công!` });
                    }}
                    className="px-5 py-2 rounded-xl bg-[#00BCEB] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00BCEB]/20 flex items-center space-x-1.5 btn-interactive"
                  >
                    <span>Tham Gia Team Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedTeam(null)}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
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
