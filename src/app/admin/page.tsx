'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SportRule, UserRole } from '@/types';
import { ShieldCheck, Save, Sliders, Users, Dices, CheckCircle2, UserCheck, RefreshCw, Sparkles, Building, ChevronRight } from 'lucide-react';

export default function AdminPage() {
  const { rules, updateRules, profiles, teams, updateMemberRole, assignMemberTeam, randomTeamDraft, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'members' | 'draft'>('rules');

  // Rules tab state
  const [editedRules, setEditedRules] = useState<SportRule[]>(rules);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Draft tab state
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(profiles.map((p) => p.id));
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(teams.map((t) => t.id));
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftResultStatus, setDraftResultStatus] = useState<string | null>(null);

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
          <p className="text-sm text-slate-400 mt-1">Cấu hình điểm số, phân quyền thành viên và bốc thăm chia đội ngẫu nhiên.</p>
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
          <span>Quy Tắc Điểm Số</span>
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

          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#FC4C02]" />
              <span>Hệ Số Quy Đổi Thể Thao (1 km = X Điểm)</span>
            </h2>

            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FC4C02] to-orange-500 hover:from-orange-500 hover:to-[#FC4C02] text-white font-extrabold text-sm shadow-lg shadow-[#FC4C02]/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Lưu & Tự Động Tính Lại Điểm</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editedRules.map((rule) => (
              <div
                key={rule.activity_type}
                className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{rule.icon}</span>
                    <div>
                      <h3 className="font-bold text-base text-white">{rule.display_name}</h3>
                      <p className="text-xs text-slate-400 font-mono">Code: {rule.activity_type}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-900 text-xs font-bold text-[#CCFF00]">
                    {rule.multiplier}x multiplier
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Hệ số 1 km (Điểm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rule.multiplier}
                      onChange={(e) => handleMultiplierChange(rule.activity_type, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-[#00BCEB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Thưởng / 100m Leo Dốc</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rule.bonus_per_100m_elevation}
                      onChange={(e) => handleElevationChange(rule.activity_type, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-[#00BCEB]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>
      )}

      {/* TAB 2: QUẢN LÝ THÀNH VIÊN */}
      {activeTab === 'members' && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#00BCEB]" />
            <span>Danh Sách Thành Viên & Phân Đội Cisco</span>
          </h2>

          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-900/50 border-b border-slate-800">
                  <th className="py-3.5 px-4 font-semibold">Thành Viên</th>
                  <th className="py-3.5 px-4 font-semibold">Phòng Ban</th>
                  <th className="py-3.5 px-4 font-semibold">Vai Trò (Role)</th>
                  <th className="py-3.5 px-4 font-semibold">Đội Nhóm (Team)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <img src={p.avatar_url} alt={p.full_name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                        <div>
                          <p className="font-bold text-white">{p.full_name}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-300">{p.department}</td>

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
