'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { SportRule, UserRole, Profile } from '@/types';
import { ShieldCheck, ShieldAlert, Save, Sliders, Users, Dices, CheckCircle2, UserCheck, RefreshCw, Sparkles, Building, ChevronRight, Lock, PlusCircle, Trash2, X, AlertCircle, Edit3, UserMinus } from 'lucide-react';

const PRESET_SPORTS = [
  { code: 'TrailRun', name: 'Chạy Địa Hình (Trail Run)', icon: '🌲', mult: 1.2, elev: 0.5 },
  { code: 'VirtualRide', name: 'Đạp Xe Virtual / Zwift', icon: '🚴', mult: 0.3, elev: 0.1 },
  { code: 'Walk', name: 'Đi Bộ (Walk)', icon: '🚶', mult: 0.8, elev: 0.1 },
  { code: 'Hike', name: 'Leo Núi (Hike)', icon: '🥾', mult: 1.0, elev: 0.5 },
  { code: 'Swim', name: 'Bơi Lội (Swim)', icon: '🏊', mult: 4.0, elev: 0.0 },
  { code: 'Badminton', name: 'Cầu Lông (Badminton)', icon: '🏸', mult: 1.0, elev: 0.0 },
  { code: 'Tennis', name: 'Quần Vợt (Tennis)', icon: '🎾', mult: 1.0, elev: 0.0 },
  { code: 'Soccer', name: 'Bóng Đá (Soccer)', icon: '⚽', mult: 1.0, elev: 0.0 },
  { code: 'Yoga', name: 'Yoga / Thiền', icon: '🧘', mult: 0.5, elev: 0.0 },
  { code: 'Workout', name: 'Tập Luyện (Workout)', icon: '💪', mult: 1.0, elev: 0.0 },
  { code: 'WeightTraining', name: 'Gym / Thể Hình (Weights)', icon: '🏋️', mult: 1.0, elev: 0.0 },
  { code: 'Rowing', name: 'Chèo Thuyền (Rowing)', icon: '🚣', mult: 2.0, elev: 0.0 },
];

export default function AdminPage() {
  const { rules, updateRules, profiles, teams, updateMemberRole, assignMemberTeam, updateMemberProfile, deleteMemberProfile, randomTeamDraft, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'members' | 'draft'>('rules');

  // Rules tab state
  const [editedRules, setEditedRules] = useState<SportRule[]>(rules);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Thêm môn thể thao mới state
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [newSportName, setNewSportName] = useState('');
  const [newSportCode, setNewSportCode] = useState('');
  const [newSportIcon, setNewSportIcon] = useState('🏃');
  const [newSportMultiplier, setNewSportMultiplier] = useState('1.0');
  const [newSportElevation, setNewSportElevation] = useState('0.0');

  // Quản lý thành viên state (Sửa / Xóa)
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editTeamId, setEditTeamId] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [memberActionStatus, setMemberActionStatus] = useState<string | null>(null);

  // Cập nhật editedRules khi rules từ cloud/context thay đổi
  useEffect(() => {
    if (rules && rules.length > 0) {
      setEditedRules(rules);
    }
  }, [rules]);

  // Handlers Quản lý thành viên
  const handleOpenEditMember = (p: Profile) => {
    setEditingMember(p);
    setEditFullName(p.full_name);
    setEditEmail(p.email || '');
    setEditDepartment(p.department || '');
    setEditRole(p.role || 'member');
    setEditTeamId(p.team_id || '');
    setEditAvatarUrl(p.avatar_url || '');
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editFullName.trim()) return;

    await updateMemberProfile({
      id: editingMember.id,
      full_name: editFullName.trim(),
      email: editEmail.trim() || undefined,
      department: editDepartment.trim() || undefined,
      role: editRole,
      team_id: editTeamId || undefined,
      avatar_url: editAvatarUrl.trim() || undefined,
    });

    setEditingMember(null);
    setMemberActionStatus(`🎉 Đã cập nhật thông tin thành viên "${editFullName.trim()}" thành công!`);
    setTimeout(() => setMemberActionStatus(null), 4000);
  };

  const handleDeleteMember = async (p: Profile) => {
    if (
      !confirm(
        `⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA THÀNH VIÊN:\n\n"${p.full_name}" (${p.email || p.username || p.id})?\n\nToàn bộ dữ liệu bài tập và liên kết của thành viên này sẽ được gỡ bỏ khỏi hệ thống.`
      )
    ) {
      return;
    }

    await deleteMemberProfile(p.id);
    setMemberActionStatus(`🗑️ Đã xóa thành viên "${p.full_name}" khỏi hệ thống thành công!`);
    setTimeout(() => setMemberActionStatus(null), 4000);
  };

  // Draft tab state
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(profiles.map((p) => p.id));
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(teams.map((t) => t.id));
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftResultStatus, setDraftResultStatus] = useState<string | null>(null);

  // Kiểm tra phân quyền: Chỉ cho phép Admin hoặc Ban Tổ Chức (Organizer) truy cập
  if (!currentUser || !['admin', 'organizer'].includes(currentUser.role)) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-6">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-red-500/30 space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">TRUY CẬP BỊ TỪ CHỐI</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Trang quản trị này dành riêng cho <strong className="text-white">Admin & Ban Tổ Chức Cisco</strong>. Tài khoản của bạn hiện là <span className="text-[#CCFF00] font-bold">{currentUser?.role === 'captain' ? 'Đội Trưởng (Captain)' : 'Vận Động Viên (Athlete)'}</span> và không có quyền truy cập.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-[#00BCEB] hover:bg-[#00a3cc] text-slate-950 font-extrabold text-sm shadow-lg shadow-[#00BCEB]/20 transition-all btn-interactive"
          >
            <span>Quay Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleMultiplierChange = (type: string, val: string) => {
    const num = parseFloat(val) || 0;
    setEditedRules((prev) => prev.map((r) => (r.activity_type === type ? { ...r, multiplier: num } : r)));
  };

  const handleElevationChange = (type: string, val: string) => {
    const num = parseFloat(val) || 0;
    setEditedRules((prev) => prev.map((r) => (r.activity_type === type ? { ...r, bonus_per_100m_elevation: num } : r)));
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateRules(editedRules);
    setSaveStatus('Đã cập nhật hệ số quy đổi điểm thành công! Điểm bài tập toàn giải đã tự động tính lại.');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleAddSportRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportCode.trim() || !newSportName.trim()) {
      alert('Vui lòng điền tên môn và mã Strava!');
      return;
    }

    const cleanCode = newSportCode.trim();
    if (editedRules.some((r) => r.activity_type.toLowerCase() === cleanCode.toLowerCase())) {
      alert(`Mã môn thể thao "${cleanCode}" đã tồn tại trên hệ thống! Vui lòng chọn hoặc nhập mã khác.`);
      return;
    }

    const newRule: SportRule = {
      id: `rule-${cleanCode.toLowerCase()}`,
      activity_type: cleanCode,
      display_name: newSportName.trim(),
      multiplier: parseFloat(newSportMultiplier) || 1.0,
      bonus_per_100m_elevation: parseFloat(newSportElevation) || 0.0,
      icon: newSportIcon.trim() || '🏅',
    };

    const updated = [...editedRules, newRule];
    setEditedRules(updated);
    updateRules(updated);
    setShowAddSportModal(false);
    setNewSportName('');
    setNewSportCode('');
    setNewSportIcon('🏃');
    setNewSportMultiplier('1.0');
    setNewSportElevation('0.0');

    setSaveStatus(`🎉 Đã thêm môn "${newRule.display_name}" thành công! Điểm các bài tập thuộc môn này đã được tính.`);
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleDeleteSportRule = (activityType: string, displayName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa môn "${displayName}" (${activityType}) khỏi hệ thống?`)) return;
    const updated = editedRules.filter((r) => r.activity_type !== activityType);
    setEditedRules(updated);
    updateRules(updated);
    setSaveStatus(`🗑️ Đã xóa môn "${displayName}" khỏi bảng quy đổi điểm.`);
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleSelectPreset = (p: (typeof PRESET_SPORTS)[0]) => {
    setNewSportCode(p.code);
    setNewSportName(p.name);
    setNewSportIcon(p.icon);
    setNewSportMultiplier(String(p.mult));
    setNewSportElevation(String(p.elev));
  };

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectTeam = (id: string) => {
    setSelectedTeamIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleStartRandomDraft = () => {
    if (selectedMemberIds.length === 0 || selectedTeamIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thành viên và 1 team để bốc thăm!');
      return;
    }

    setIsDrafting(true);
    setDraftResultStatus(null);

    setTimeout(() => {
      randomTeamDraft(selectedMemberIds, selectedTeamIds);
      setIsDrafting(false);
      setDraftResultStatus(`🎉 Bốc thăm ngẫu nhiên thành công! Đã chia đều ${selectedMemberIds.length} thành viên vào ${selectedTeamIds.length} team Cisco.`);
    }, 1800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#00BCEB] font-extrabold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
            <span>CISCO ADMIN CONTROL CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">QUẢN TRỊ QUY TẮC & ĐỘI NHÓM CISCO</h1>
          <p className="text-sm text-slate-400 mt-1">Cấu hình điểm số linh hoạt theo môn thể thao, phân quyền thành viên và bốc thăm chia đội.</p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-slate-900 text-[#00BCEB] border border-[#00BCEB]/30 text-xs font-bold">
          Quản trị viên: {currentUser?.full_name || 'BQT Cisco'}
        </span>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'rules'
              ? 'bg-[#00BCEB] text-slate-950 shadow-md shadow-[#00BCEB]/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Quy Tắc Điểm Số ({editedRules.length} Môn)</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'members'
              ? 'bg-[#00BCEB] text-slate-950 shadow-md shadow-[#00BCEB]/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản Lý Thành Viên ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('draft')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'draft'
              ? 'bg-gradient-to-r from-[#FC4C02] to-orange-500 text-white shadow-md shadow-[#FC4C02]/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dices className="w-4 h-4" />
          <span>🎲 Bốc Thăm Online Chia Đội</span>
        </button>
      </div>

      {/* TAB 1: QUY TẮC ĐIỂM SỐ */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveRules} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          {saveStatus && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#FC4C02]" />
                <span>Hệ Số Quy Đổi Thể Thao (1 km = X Điểm)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Admin có thể thêm bất kỳ môn thể thao Strava nào mà không bị giới hạn cố định.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowAddSportModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#00BCEB] font-extrabold text-xs border border-[#00BCEB]/30 transition-all btn-interactive"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Thêm Môn Thể Thao Mới</span>
              </button>

              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FC4C02] to-orange-500 hover:from-orange-500 hover:to-[#FC4C02] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#FC4C02]/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Điểm</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {editedRules.map((rule) => (
              <div
                key={rule.activity_type}
                className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{rule.icon}</span>
                    <div>
                      <h3 className="font-bold text-sm text-white">{rule.display_name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">Strava: {rule.activity_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900 text-xs font-bold text-[#CCFF00]">
                      {rule.multiplier}x
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSportRule(rule.activity_type, rule.display_name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title={`Xóa môn ${rule.display_name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Hệ số 1 km (Điểm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rule.multiplier}
                      onChange={(e) => handleMultiplierChange(rule.activity_type, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-[#00BCEB]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Thưởng / 100m Leo Dốc</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rule.bonus_per_100m_elevation}
                      onChange={(e) => handleElevationChange(rule.activity_type, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-[#00BCEB]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Thêm Môn Thể Thao Mới */}
          {showAddSportModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <PlusCircle className="w-5 h-5 text-[#00BCEB]" />
                    <h3 className="font-extrabold text-lg text-white">Thêm Môn Thể Thao Mới</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddSportModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Gợi Ý Nhanh Môn Strava */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Chọn Nhanh Môn Thể Thao Strava Phổ Biến:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {PRESET_SPORTS.map((p) => {
                      const isSelected = newSportCode === p.code;
                      return (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => handleSelectPreset(p)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                            isSelected
                              ? 'bg-[#00BCEB] text-slate-950 font-bold'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <span>{p.icon}</span>
                          <span>{p.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tên Hiển Thị</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Cầu Lông, Leo Núi..."
                        value={newSportName}
                        onChange={(e) => setNewSportName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#00BCEB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Icon Emoji</label>
                      <input
                        type="text"
                        required
                        value={newSportIcon}
                        onChange={(e) => setNewSportIcon(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-center text-lg focus:outline-none focus:border-[#00BCEB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Mã Hoạt Động Strava (Activity Type Code)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: TrailRun, Badminton, Tennis, Swim..."
                      value={newSportCode}
                      onChange={(e) => setNewSportCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#00BCEB]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mã này cần trùng khớp với loại bài tập trả về từ Strava (VD: Run, Ride, Swim, Walk, Hike, Badminton, Tennis, VirtualRide, TrailRun...)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Hệ Số 1 km = X Điểm</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={newSportMultiplier}
                        onChange={(e) => setNewSportMultiplier(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#00BCEB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Thưởng / 100m Leo Dốc</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={newSportElevation}
                        onChange={(e) => setNewSportElevation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#00BCEB]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddSportModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold hover:bg-slate-900"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSportRule}
                    className="px-5 py-2 rounded-xl bg-[#00BCEB] hover:bg-[#00a3cc] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00BCEB]/20"
                  >
                    Lưu Môn Thể Thao Mới
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: QUẢN LÝ THÀNH VIÊN */}
      {activeTab === 'members' && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          {memberActionStatus && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{memberActionStatus}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#00BCEB]" />
                <span>Danh Sách Thành Viên & Phân Đội Cisco</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Admin có toàn quyền chỉnh sửa thông tin hoặc xóa thành viên khỏi hệ thống.
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-[#CCFF00]">
              Tổng: {profiles.length} thành viên
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-900/50 border-b border-slate-800">
                  <th className="py-3.5 px-4 font-semibold">Thành Viên</th>
                  <th className="py-3.5 px-4 font-semibold">Phòng Ban</th>
                  <th className="py-3.5 px-4 font-semibold">Vai Trò (Role)</th>
                  <th className="py-3.5 px-4 font-semibold">Đội Nhóm (Team)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={p.full_name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-white">{p.full_name}</p>
                          <p className="text-xs text-slate-400">{p.email || (p.strava_id ? `Strava ID: ${p.strava_id}` : 'Chưa có email')}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-300">{p.department || '—'}</td>

                    <td className="py-4 px-4">
                      <select
                        value={p.role}
                        onChange={(e) => updateMemberRole(p.id, e.target.value as UserRole)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-[#00BCEB]"
                      >
                        <option value="member">🏃 Vận Động Viên (Default)</option>
                        <option value="captain">👑 Trưởng Nhóm (Leader)</option>
                        <option value="organizer">🎪 Ban Tổ Chức (BTC)</option>
                        <option value="admin">⚡ Quản Trị Viên (Admin)</option>
                      </select>
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={p.team_id || ''}
                        onChange={(e) => assignMemberTeam(p.id, e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-[#00BCEB]"
                      >
                        <option value="">Chưa chọn team</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMember(p)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-[#00BCEB] text-slate-300 hover:text-slate-950 border border-slate-700 hover:border-[#00BCEB] transition-all flex items-center gap-1 text-xs font-bold"
                          title={`Sửa thông tin ${p.full_name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMember(p)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 transition-all flex items-center gap-1 text-xs font-bold"
                          title={`Xóa thành viên ${p.full_name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Chỉnh Sửa Thông Tin Thành Viên */}
          {editingMember && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-5 h-5 text-[#00BCEB]" />
                    <h3 className="font-extrabold text-lg text-white">Chỉnh Sửa Thành Viên</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveMember} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Họ Và Tên</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#00BCEB]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="athlete@cisco.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phòng Ban</label>
                      <input
                        type="text"
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                        placeholder="VD: GSC, Software, Sales..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Vai Trò Hệ Thống</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#00BCEB]"
                      >
                        <option value="member">🏃 Vận Động Viên (Default)</option>
                        <option value="captain">👑 Trưởng Nhóm (Leader)</option>
                        <option value="organizer">🎪 Ban Tổ Chức (BTC)</option>
                        <option value="admin">⚡ Quản Trị Viên (Admin)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Đội Nhóm (Team)</label>
                      <select
                        value={editTeamId}
                        onChange={(e) => setEditTeamId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#00BCEB]"
                      >
                        <option value="">Chưa chọn team</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">URL Ảnh Đại Diện (Avatar URL)</label>
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-[#00BCEB]"
                    />
                  </div>

                  <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingMember(null)}
                      className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold hover:bg-slate-900"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#00BCEB] hover:bg-[#00a3cc] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00BCEB]/20"
                    >
                      Lưu Thay Đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BỐC THĂM CHIA ĐỘI ONLINE */}
      {activeTab === 'draft' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[#FC4C02] font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#CCFF00]" />
              <span>RANDOM DRAFT ENGINE</span>
            </div>
            <h2 className="text-2xl font-black text-white">BỐC THĂM TỰ ĐỘNG CHIA ĐỘI CISCO</h2>
            <p className="text-sm text-slate-400">Chọn danh sách thành viên đăng ký và thuật toán sẽ phân bổ ngẫu nhiên đều vào các team.</p>
          </div>

          {draftResultStatus && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{draftResultStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chọn Thành Viên Tham Gia Draft */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-white">1. Chọn Thành Viên Đã Đăng Ký ({selectedMemberIds.length}/{profiles.length})</h3>
                <button
                  type="button"
                  onClick={() => setSelectedMemberIds(selectedMemberIds.length === profiles.length ? [] : profiles.map((p) => p.id))}
                  className="text-xs font-bold text-[#00BCEB] hover:underline"
                >
                  {selectedMemberIds.length === profiles.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {profiles.map((p) => {
                  const isChecked = selectedMemberIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelectMember(p.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked ? 'bg-[#00BCEB]/10 border-[#00BCEB]/50' : 'bg-slate-900/50 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img src={p.avatar_url} alt={p.full_name} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-xs text-white">{p.full_name}</p>
                          <p className="text-[10px] text-slate-400">{p.team?.name || 'Chưa phân team'}</p>
                        </div>
                      </div>
                      <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-[#00BCEB]" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chọn Team Đích */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-white">2. Chọn Team Cisco Nhận VĐV ({selectedTeamIds.length}/{teams.length})</h3>
              </div>

              <div className="space-y-2">
                {teams.map((t) => {
                  const isChecked = selectedTeamIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleSelectTeam(t.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked ? 'bg-[#FC4C02]/10 border-[#FC4C02]/50' : 'bg-slate-900/50 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img src={t.avatar_url} alt={t.name} className="w-8 h-8 rounded-xl object-cover" />
                        <span className="font-bold text-xs text-white">{t.name}</span>
                      </div>
                      <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-[#FC4C02]" />
                    </div>
                  );
                })}
              </div>

              {/* Nút Bắt Đầu Bốc Thăm */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleStartRandomDraft}
                  disabled={isDrafting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FC4C02] via-[#CCFF00] to-[#00BCEB] text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-[#FC4C02]/20 hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                >
                  <Dices className={`w-5 h-5 ${isDrafting ? 'animate-spin' : ''}`} />
                  <span>{isDrafting ? 'ĐANG QUAY SỐ BỐC THĂM...' : 'QUAY SỐ BỐC THĂM CHIA ĐỘI 🎲'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
