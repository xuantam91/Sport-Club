'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Zap, Mail, Lock, User, Users, ArrowRight, Camera, Upload, Eye, EyeOff } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { currentUser, teams, completeOnboarding, showOnboardingModal, setShowOnboardingModal, t } = useApp();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [password, setPassword] = useState('Cisco2026$');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-[#00BCEB]/40 rounded-2xl sm:rounded-3xl p-4 sm:p-7 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative custom-scrollbar">
        {/* Glowing Background Blur */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#00BCEB]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 text-[#CCFF00] font-extrabold text-[10px] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-[#CCFF00]" />
              <span>{t('onboarding', 'tag')}</span>
            </div>
            <h3 className="font-black text-lg sm:text-xl text-white tracking-tight">{t('onboarding', 'title')}</h3>
          </div>

          <button
            onClick={() => setShowOnboardingModal(false)}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Profile Avatar & Strava Info Preview */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-3">
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title={t('onboarding', 'changeAvatarTooltip')}
          >
            <img
              src={avatarUrl || currentUser.avatar_url}
              alt={fullName}
              className="w-12 h-12 rounded-xl object-cover border-2 border-[#00BCEB] shadow-md"
            />
            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm truncate">{fullName || currentUser.full_name}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold shrink-0">
                Strava ID: #{currentUser.strava_id || '162869534'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[#00BCEB] border border-slate-700 text-[10px] font-semibold transition-colors"
            >
              <Upload className="w-3 h-3" />
              <span>{t('onboarding', 'changeAvatarBtn')}</span>
            </button>
          </div>
        </div>

        {/* Compact Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Tên Hiển Thị & Giới Tính */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">{t('onboarding', 'displayNameLabel')}</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#00BCEB] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tommy Tran"
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">{t('onboarding', 'genderLabel')}</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
              >
                <option value="male">{t('onboarding', 'male')}</option>
                <option value="female">{t('onboarding', 'female')}</option>
                <option value="other">{t('onboarding', 'other')}</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">{t('onboarding', 'emailLabel')}</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tommy.tran@cisco.com"
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
              />
            </div>
          </div>

          {/* Team Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">{t('onboarding', 'selectTeamLabel')}</label>
            <div className="relative">
              <Users className="w-3.5 h-3.5 text-[#00BCEB] absolute left-2.5 top-2.5" />
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00BCEB]"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.member_count} VĐV)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notification checkbox */}
          <div className="flex items-center space-x-2 pt-0.5">
            <input
              type="checkbox"
              id="notifCheck"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="accent-[#00BCEB] w-3.5 h-3.5 rounded"
            />
            <label htmlFor="notifCheck" className="text-[11px] text-slate-300 font-medium cursor-pointer">
              {t('onboarding', 'receiveNotifLabel')}
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FC4C02] via-orange-500 to-[#00BCEB] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FC4C02]/20 hover:opacity-95 transition-all flex items-center justify-center space-x-2 btn-interactive"
            >
              <span>{t('onboarding', 'submitBtn')}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
