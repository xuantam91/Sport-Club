'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Zap, Mail, Lock, User, Users, ArrowRight, Camera, Upload } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { currentUser, teams, completeOnboarding, showOnboardingModal, setShowOnboardingModal } = useApp();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [password, setPassword] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(currentUser?.team_id || (teams[0] ? teams[0].id : ''));
  const [emailNotifications, setEmailNotifications] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setAvatarUrl(currentUser.avatar_url || '');
      setGender(currentUser.gender || 'male');
      
      const cleanSlug = (currentUser.username || currentUser.full_name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9.]/g, '.')
        .replace(/\.+/g, '.');

      setUsername(currentUser.username || cleanSlug);
      
      if (currentUser.email && !currentUser.email.includes('minh.nguyen')) {
        setEmail(currentUser.email);
      } else {
        setEmail(`${cleanSlug}@gmail.com`);
      }
    }
  }, [currentUser]);

  if (!showOnboardingModal || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboarding({
      fullName,
      username,
      email,
      avatarUrl,
      gender,
      teamId: selectedTeamId,
      emailNotifications,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-[#00BCEB]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glowing Background Blur */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#00BCEB]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-[#CCFF00] font-extrabold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-[#CCFF00]" />
              <span>STRAVA OAUTH SUCCESSFUL</span>
            </div>
            <h3 className="font-extrabold text-2xl text-white">HOÀN THIỆN HỒ SƠ CISCO GSC</h3>
          </div>

          <button onClick={() => setShowOnboardingModal(false)} className="text-slate-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        {/* Strava Imported Profile Preview & Avatar Upload */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center space-x-4">
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Nhấp để thay đổi ảnh đại diện từ máy tính hoặc điện thoại"
          >
            <img
              src={avatarUrl || currentUser.avatar_url}
              alt={fullName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00BCEB] shadow-md group-hover:opacity-75 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
              <span className="text-[9px] text-white font-bold mt-0.5">Sửa ảnh</span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-base truncate">{fullName || currentUser.full_name}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex-shrink-0">
                Strava ID: #{currentUser.strava_id || '998811'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#00BCEB] border border-slate-700 text-xs font-semibold transition-colors btn-interactive"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Đổi ảnh từ máy / điện thoại</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên Hiển Thị & Giới Tính */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Họ & Tên Hiển Thị (Display Name)</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#00BCEB] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn Minh"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Giới Tính</label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mã Username Strava</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="minh.nguyen"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">EMAIL</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tommy@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
                />
              </div>
            </div>
          </div>

          {/* Password (for password reset) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mật Khẩu (Để Reset & Đăng Nhập Web)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Sử dụng email & mật khẩu này để nhận thông báo giải đấu hoặc quên mật khẩu.</p>
          </div>

          {/* Team Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Chọn Đội Nhóm Cisco (Team)</label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#00BCEB]"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.member_count} VĐV)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email Notification Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="notifCheck"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="accent-[#00BCEB] w-4 h-4"
            />
            <label htmlFor="notifCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
              Nhận thông báo qua Email
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00BCEB] via-[#CCFF00] to-[#FC4C02] text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-[#00BCEB]/20 hover:opacity-95 transition-all flex items-center justify-center space-x-2 btn-interactive"
            >
              <span>HOÀN THÀNH SETUP & BẮT ĐẦU TÍCH ĐIỂM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
