'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, Activity, User, ShieldCheck, Flame } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { currentUser } = useApp();

  const navItems = [
    { href: '/', label: 'Xếp Hạng', icon: Trophy },
    { href: '/challenges', label: 'Giải Đấu', icon: Flame },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/activities', label: 'Hoạt Động', icon: Activity },
    { href: '/profile', label: 'Cá Nhân', icon: User },
    ...(currentUser?.role && ['admin', 'organizer'].includes(currentUser.role) ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F17]/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
                isActive ? 'text-[#CCFF00] font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl ${
                  isActive ? 'bg-[#CCFF00]/10 border border-[#CCFF00]/30 shadow-md shadow-[#CCFF00]/10' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#CCFF00]' : 'text-slate-400'}`} />
              </div>
              <span className="text-[11px] mt-1 whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
