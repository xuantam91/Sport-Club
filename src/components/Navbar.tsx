'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, User, ShieldCheck, Activity, Flame, Zap, Globe } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Language } from '@/lib/translations';
import { CiscoOfficialLogo } from '@/components/CiscoLogo';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { currentUser, isDemoMode, language, setLanguage, t, cloudStatus } = useApp();

  const navLinks = [
    { href: '/', label: t('nav', 'leaderboard'), icon: Trophy },
    { href: '/challenges', label: t('nav', 'challenges'), icon: Flame },
    { href: '/teams', label: t('nav', 'teams'), icon: Users },
    { href: '/activities', label: t('nav', 'activities'), icon: Activity },
    { href: '/profile', label: t('nav', 'profile'), icon: User },
    ...(currentUser?.role && ['admin', 'organizer'].includes(currentUser.role) ? [{ href: '/admin', label: t('nav', 'admin'), icon: ShieldCheck }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Cisco GSC Vietnam */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group btn-interactive">
            <CiscoOfficialLogo className="h-6 sm:h-7 w-auto group-hover:scale-105 transition-transform duration-300" />
            
            {/* Elegant Vertical Glass Divider */}
            <div className="h-4 sm:h-5 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>

            {/* Pro High-Tech GSC VIETNAM Badge */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-900/90 border border-[#00BCEB]/35 shadow-inner group-hover:border-[#00BCEB]/70 group-hover:shadow-[#00BCEB]/10 transition-all duration-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse"></span>
                <span className="font-extrabold text-[10px] sm:text-xs tracking-wider sm:tracking-widest uppercase bg-gradient-to-r from-white via-cyan-100 to-[#00BCEB] bg-clip-text text-transparent">
                  GSC VIETNAM
                </span>
              </div>

              {isDemoMode && (
                <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 rounded-full">
                  DEMO
                </span>
              )}
            </div>
          </Link>

          {/* Nav Links mượt mà */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap btn-interactive ${
                    isActive
                      ? 'bg-slate-800 text-[#CCFF00] border border-[#CCFF00]/30 shadow-lg shadow-[#CCFF00]/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 hover:border-slate-700/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#CCFF00]' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & Language selector & Cloud Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Cloud DB Status Indicator */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                cloudStatus === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : cloudStatus === 'syncing'
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
              }`}
              title={
                cloudStatus === 'connected'
                  ? 'Supabase Cloud Database: Đã kết nối và đồng bộ Realtime'
                  : cloudStatus === 'syncing'
                  ? 'Đang kiểm tra kết nối Cloud Database...'
                  : 'Cảnh báo: Mất kết nối Cloud Database'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  cloudStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : cloudStatus === 'syncing'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-rose-400'
                }`}
              ></span>
              <span>{cloudStatus === 'connected' ? 'Cloud DB' : cloudStatus === 'syncing' ? 'Syncing...' : 'DB Error'}</span>
            </div>

            {/* Language dropdown */}
            <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-xs font-bold text-slate-200 hover:border-slate-700 transition-colors">
              <Globe className="w-3.5 h-3.5 text-[#00BCEB]" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer text-slate-200 hover:text-white"
              >
                <option value="vi">🇻🇳 VI</option>
                <option value="en">🇺🇸 EN</option>
                <option value="zh">🇨🇳 中文</option>
              </select>
            </div>

            {currentUser && (
              <Link href="/profile" className="flex items-center group btn-interactive">
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-slate-700 group-hover:border-[#00BCEB] group-hover:shadow-lg group-hover:shadow-[#00BCEB]/20 transition-all duration-300"
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
