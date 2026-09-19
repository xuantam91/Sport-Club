'use client';

import React from 'react';
import Link from 'next/link';
import { CiscoOfficialLogo } from '@/components/CiscoLogo';
import { useApp } from '@/context/AppContext';
import { Language } from '@/lib/translations';
import { Globe, Zap, Heart, Sparkles, Trophy, Dices, Sliders } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, setLanguage, t } = useApp();

  return (
    <footer className="bg-[#07090F] border-t border-slate-800/80 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Slogan */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 group">
              <CiscoOfficialLogo className="h-7 w-auto" />
              <div className="h-5 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-[#00BCEB]/35">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]"></span>
                <span className="font-extrabold text-xs tracking-widest uppercase bg-gradient-to-r from-white via-cyan-100 to-[#00BCEB] bg-clip-text text-transparent">
                  GSC VIETNAM
                </span>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-slate-400">
              {t('footer', 'tagline')}
            </p>

            {/* Language Switcher Dropdown */}
            <div className="pt-2">
              <div className="inline-flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Globe className="w-4 h-4 text-[#00BCEB]" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="zh">🇨🇳 中文 (Chinese)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-white">{t('footer', 'quickLinks')}</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-[#CCFF00] transition-colors">{t('nav', 'leaderboard')}</Link></li>
              <li><Link href="/challenges" className="hover:text-[#CCFF00] transition-colors">{t('nav', 'challenges')}</Link></li>
              <li><Link href="/teams" className="hover:text-[#CCFF00] transition-colors">{t('nav', 'teams')}</Link></li>
              <li><Link href="/activities" className="hover:text-[#CCFF00] transition-colors">{t('nav', 'activities')}</Link></li>
              <li><Link href="/profile" className="hover:text-[#CCFF00] transition-colors">{t('nav', 'profile')}</Link></li>
            </ul>
          </div>

          {/* Column 3: TÍNH NĂNG NỔI BẬT (Thay thế Công nghệ) */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>{t('footer', 'featuresTitle')}</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-[#FC4C02] flex-shrink-0" />
                <span>{t('footer', 'featStrava')}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Trophy className="w-3.5 h-3.5 text-[#CCFF00] flex-shrink-0" />
                <span>{t('footer', 'featLeaderboard')}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Dices className="w-3.5 h-3.5 text-[#00BCEB] flex-shrink-0" />
                <span>{t('footer', 'featRandomDraft')}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{t('footer', 'featFlexiblePoints')}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Strava Status */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-white">{t('footer', 'support')}</h4>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Zap className="w-4 h-4 fill-emerald-400" />
                <span>Strava API Live Sync</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Tự động kết nối bài tập cho cán bộ nhân viên Cisco GSC Vietnam.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{t('footer', 'copyright')}</p>
          <div className="flex items-center space-x-1 text-slate-400 font-medium">
            <span>Powered for Cisco GSC Vietnam by</span>
            <span className="font-extrabold text-[#CCFF00]">Tommy</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline ml-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
};
