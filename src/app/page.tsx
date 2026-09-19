'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeFilter, SportType, IndividualLeaderboardEntry, TeamLeaderboardEntry } from '@/types';
import { Trophy, Flame, Crown, Medal, Zap, TrendingUp, Users, Sparkles, HeartPulse } from 'lucide-react';
import Link from 'next/link';

function isActivityInTimeFilter(dateStr: string, filter: TimeFilter): boolean {
  if (filter === 'all') return true;
  const actDate = new Date(dateStr);
  const now = new Date();

  if (filter === 'week') {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return actDate >= startOfWeek;
  }

  if (filter === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return actDate >= startOfMonth;
  }

  if (filter === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
    return actDate >= startOfQuarter;
  }

  return true;
}

export default function LeaderboardPage() {
  const { profiles, teams, activities, currentUser, t } = useApp();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [sportFilter, setSportFilter] = useState<SportType>('All');
  const [viewMode, setViewMode] = useState<'individual' | 'team'>('individual');

  const individualLeaderboard = useMemo<IndividualLeaderboardEntry[]>(() => {
    const filteredActivities = activities.filter((act) => {
      if (sportFilter !== 'All' && act.type.toLowerCase() !== sportFilter.toLowerCase()) return false;
      if (!isActivityInTimeFilter(act.start_date, timeFilter)) return false;
      return true;
    });

    const statsMap = new Map<string, {
      totalDistance: number;
      totalPoints: number;
      totalElevation: number;
      totalTime: number;
      count: number;
    }>();

    filteredActivities.forEach((act) => {
      const existing = statsMap.get(act.profile_id) || {
        totalDistance: 0,
        totalPoints: 0,
        totalElevation: 0,
        totalTime: 0,
        count: 0,
      };
      statsMap.set(act.profile_id, {
        totalDistance: existing.totalDistance + act.distance,
        totalPoints: existing.totalPoints + act.calculated_points,
        totalElevation: existing.totalElevation + (act.total_elevation_gain || 0),
        totalTime: existing.totalTime + act.moving_time,
        count: existing.count + 1,
      });
    });

    const list: IndividualLeaderboardEntry[] = profiles.map((profile) => {
      const stat = statsMap.get(profile.id) || {
        totalDistance: 0,
        totalPoints: 0,
        totalElevation: 0,
        totalTime: 0,
        count: 0,
      };
      return {
        rank: 0,
        profile,
        total_distance: stat.totalDistance,
        total_points: Math.round(stat.totalPoints * 100) / 100,
        total_elevation: Math.round(stat.totalElevation),
        total_moving_time: stat.totalTime,
        activity_count: stat.count,
      };
    });

    list.sort((a, b) => b.total_points - a.total_points || b.total_distance - a.total_distance);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [profiles, activities, sportFilter, timeFilter]);

  const teamLeaderboard = useMemo<TeamLeaderboardEntry[]>(() => {
    const list: TeamLeaderboardEntry[] = teams.map((team) => {
      const teamProfiles = profiles.filter((p) => p.team_id === team.id);
      const teamProfileIds = new Set(teamProfiles.map((p) => p.id));

      const teamActivities = activities.filter(
        (act) =>
          teamProfileIds.has(act.profile_id) &&
          (sportFilter === 'All' || act.type.toLowerCase() === sportFilter.toLowerCase()) &&
          isActivityInTimeFilter(act.start_date, timeFilter)
      );

      const totalDist = teamActivities.reduce((acc, a) => acc + a.distance, 0);
      const totalPts = teamActivities.reduce((acc, a) => acc + a.calculated_points, 0);
      const totalElev = teamActivities.reduce((acc, a) => acc + (a.total_elevation_gain || 0), 0);
      const memberCount = Math.max(teamProfiles.length, 1);

      return {
        rank: 0,
        team,
        total_distance: totalDist,
        total_points: Math.round(totalPts * 100) / 100,
        total_elevation: Math.round(totalElev),
        member_count: memberCount,
        avg_points_per_member: Math.round((totalPts / memberCount) * 100) / 100,
        activity_count: teamActivities.length,
      };
    });

    list.sort((a, b) => b.total_points - a.total_points || b.avg_points_per_member - a.avg_points_per_member);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [teams, profiles, activities, sportFilter, timeFilter]);

  const totalStats = useMemo(() => {
    const filtered = activities.filter((act) => {
      if (sportFilter !== 'All' && act.type.toLowerCase() !== sportFilter.toLowerCase()) return false;
      if (!isActivityInTimeFilter(act.start_date, timeFilter)) return false;
      return true;
    });

    const distMeters = filtered.reduce((acc, a) => acc + a.distance, 0);
    const pts = filtered.reduce((acc, a) => acc + a.calculated_points, 0);
    return {
      km: (distMeters / 1000).toFixed(1),
      points: pts.toFixed(1),
      athletes: profiles.length,
      activitiesCount: filtered.length,
    };
  }, [activities, profiles, sportFilter, timeFilter]);

  const top3Individual = individualLeaderboard.slice(0, 3);
  const top3Team = teamLeaderboard.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* CISCO SPORTS HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-[#00BCEB]/30 shadow-2xl bg-slate-900 group">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: "url('/images/cisco_sports_hero.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17] via-[#0B0F17]/85 to-transparent"></div>

        <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#00BCEB]/20 border border-[#00BCEB]/40 text-[#00BCEB] text-xs font-black uppercase tracking-widest backdrop-blur-md">
              <HeartPulse className="w-4 h-4 text-[#CCFF00] animate-pulse" />
              <span>{t('hero', 'tag')}</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {t('hero', 'title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCEB] via-[#CCFF00] to-[#FC4C02]">
                  KINETIC
                </span>
              </h1>
              <p className="text-base sm:text-lg font-bold text-[#CCFF00] italic">&ldquo;{t('hero', 'slogan')}&rdquo;</p>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">{t('hero', 'desc')}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/activities"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FC4C02] to-orange-500 hover:from-orange-500 hover:to-[#FC4C02] text-white font-extrabold text-sm shadow-lg shadow-[#FC4C02]/25 transition-all transform hover:-translate-y-0.5"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>{t('hero', 'syncBtn')}</span>
              </Link>
              <Link
                href="/teams"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 backdrop-blur-md transition-all"
              >
                <Users className="w-4 h-4 text-[#00BCEB]" />
                <span>{t('hero', 'joinTeamBtn')}</span>
              </Link>
            </div>
          </div>

          {/* Pro Sports Metrics Widget with Sparkline Charts */}
          <div className="grid grid-cols-2 gap-3.5 w-full lg:w-auto">
            {/* Card 1: Distance */}
            <div className="glass-card p-4 rounded-2xl border border-[#CCFF00]/30 hover:border-[#CCFF00]/70 transition-all group relative overflow-hidden bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{t('hero', 'statsTotalDistance')}</p>
                <div className="p-1.5 rounded-lg bg-[#CCFF00]/15 text-[#CCFF00]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <p className="text-2xl font-black text-white group-hover:text-[#CCFF00] transition-colors">{totalStats.km}</p>
                <span className="text-xs font-bold text-slate-400">km</span>
              </div>
              {/* SVG Sparkline Chart */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">↑ +14.2%</span>
                <svg className="h-4 w-16 text-[#CCFF00]" viewBox="0 0 50 15" fill="none">
                  <path d="M0 12 L10 9 L20 11 L30 4 L40 6 L50 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Card 2: Points */}
            <div className="glass-card p-4 rounded-2xl border border-[#FC4C02]/30 hover:border-[#FC4C02]/70 transition-all group relative overflow-hidden bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{t('hero', 'statsTotalPoints')}</p>
                <div className="p-1.5 rounded-lg bg-[#FC4C02]/15 text-[#FC4C02]">
                  <Zap className="w-4 h-4 fill-[#FC4C02]" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <p className="text-2xl font-black text-white group-hover:text-[#FC4C02] transition-colors">{totalStats.points}</p>
                <span className="text-xs font-bold text-slate-400">pts</span>
              </div>
              {/* SVG Sparkline Chart */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-[#FC4C02] font-bold flex items-center gap-1">🔥 Top Score</span>
                <svg className="h-4 w-16 text-[#FC4C02]" viewBox="0 0 50 15" fill="none">
                  <path d="M0 14 L10 10 L20 12 L30 6 L40 2 L50 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Card 3: Athletes */}
            <div className="glass-card p-4 rounded-2xl border border-[#00BCEB]/30 hover:border-[#00BCEB]/70 transition-all group relative overflow-hidden bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{t('hero', 'statsTotalAthletes')}</p>
                <div className="p-1.5 rounded-lg bg-[#00BCEB]/15 text-[#00BCEB]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <p className="text-2xl font-black text-white group-hover:text-[#00BCEB] transition-colors">{totalStats.athletes}</p>
                <span className="text-xs font-bold text-slate-400">VĐV</span>
              </div>
              {/* Mini Bar Graph */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold">100% Active</span>
                <div className="flex items-end gap-1 h-3">
                  <span className="w-1.5 h-2 bg-[#00BCEB] rounded-sm"></span>
                  <span className="w-1.5 h-3 bg-[#00BCEB] rounded-sm"></span>
                  <span className="w-1.5 h-2.5 bg-[#00BCEB] rounded-sm"></span>
                  <span className="w-1.5 h-3.5 bg-[#CCFF00] rounded-sm"></span>
                </div>
              </div>
            </div>

            {/* Card 4: Workouts */}
            <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/70 transition-all group relative overflow-hidden bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{t('hero', 'statsTotalLogs')}</p>
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <p className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{totalStats.activitiesCount}</p>
                <span className="text-xs font-bold text-slate-400">log</span>
              </div>
              {/* Mini Bar Graph */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-emerald-400 font-bold">Live Strava</span>
                <div className="flex items-end gap-1 h-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></span>
                  <span className="w-1.5 h-2.5 bg-emerald-500 rounded-sm"></span>
                  <span className="w-1.5 h-3.5 bg-emerald-400 rounded-sm animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('individual')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold btn-interactive ${
              viewMode === 'individual'
                ? 'bg-gradient-to-r from-[#00BCEB] to-blue-600 text-white shadow-md shadow-[#00BCEB]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{t('filters', 'individual')}</span>
          </button>
          <button
            onClick={() => setViewMode('team')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold btn-interactive ${
              viewMode === 'team'
                ? 'bg-gradient-to-r from-[#00BCEB] to-blue-600 text-white shadow-md shadow-[#00BCEB]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('filters', 'team')}</span>
          </button>
        </div>

        {/* Time Filters */}
        <div className="flex items-center overflow-x-auto space-x-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800/80">
          {[
            { id: 'week', label: t('filters', 'week') },
            { id: 'month', label: t('filters', 'month') },
            { id: 'quarter', label: t('filters', 'quarter') },
            { id: 'all', label: t('filters', 'all') },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id as TimeFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap btn-interactive ${
                timeFilter === item.id
                  ? 'bg-slate-800 text-[#CCFF00] border border-[#CCFF00]/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Sport Type Filters */}
        <div className="flex items-center overflow-x-auto space-x-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800/80">
          {[
            { id: 'All', label: t('filters', 'sportAll') },
            { id: 'Run', label: t('filters', 'run') },
            { id: 'Ride', label: t('filters', 'ride') },
            { id: 'Walk', label: t('filters', 'walk') },
            { id: 'Swim', label: t('filters', 'swim') },
          ].map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSportFilter(sport.id as SportType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap btn-interactive ${
                sportFilter === sport.id
                  ? 'bg-[#00BCEB]/20 text-[#00BCEB] border border-[#00BCEB]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sport.label}
            </button>
          ))}
        </div>
      </div>

      {/* TOP 3 PODIUM SECTION */}
      {viewMode === 'individual' ? (
        top3Individual.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pt-4">
            {/* HẠNG 2 */}
            {top3Individual[1] && (
              <div className="order-2 md:order-1 silver-podium p-6 rounded-3xl flex flex-col items-center justify-between text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-3 left-3 bg-slate-300 text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5" /> {t('podium', 'silverTitle')}
                </div>
                <div className="relative my-4">
                  <img
                    src={top3Individual[1].profile.avatar_url}
                    alt={top3Individual[1].profile.full_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-slate-300 shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-1 bg-slate-200 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border border-white">
                    2
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-white">{top3Individual[1].profile.full_name}</h3>
                  <p className="text-xs text-[#00BCEB] font-medium">{top3Individual[1].profile.team?.name || t('table', 'noTeam')}</p>
                </div>
                <div className="w-full mt-4 pt-3 border-t border-slate-700/50 flex justify-around text-xs">
                  <div>
                    <p className="text-slate-400">{t('podium', 'totalPoints')}</p>
                    <p className="font-extrabold text-base text-[#CCFF00]">{top3Individual[1].total_points}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">{t('podium', 'distance')}</p>
                    <p className="font-bold text-slate-200">{(top3Individual[1].total_distance / 1000).toFixed(1)} km</p>
                  </div>
                </div>
              </div>
            )}

            {/* HẠNG 1 */}
            {top3Individual[0] && (
              <div className="order-1 md:order-2 gold-podium p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-between text-center relative overflow-hidden group hover:scale-[1.03] transition-transform md:-mt-4">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-black text-xs px-4 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-amber-400/20">
                  <Crown className="w-4 h-4 fill-amber-950" /> {t('podium', 'goldTitle')}
                </div>
                <div className="relative my-6">
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-300 via-[#00BCEB] to-[#CCFF00] animate-spin-slow blur-sm opacity-80"></div>
                  <img
                    src={top3Individual[0].profile.avatar_url}
                    alt={top3Individual[0].profile.full_name}
                    className="relative w-24 h-24 rounded-full object-cover border-4 border-amber-300 shadow-2xl"
                  />
                  <div className="absolute -bottom-2 -right-1 bg-amber-400 text-amber-950 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 border-amber-100 shadow-md">
                    1
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-xl text-white tracking-wide">{top3Individual[0].profile.full_name}</h3>
                  <p className="text-xs text-amber-300 font-semibold">{top3Individual[0].profile.team?.name || t('table', 'noTeam')}</p>
                </div>
                <div className="w-full mt-4 pt-4 border-t border-amber-500/20 flex justify-around text-xs">
                  <div>
                    <p className="text-amber-200/70 font-medium">{t('podium', 'totalPoints')}</p>
                    <p className="font-extrabold text-xl text-[#CCFF00]">{top3Individual[0].total_points}</p>
                  </div>
                  <div>
                    <p className="text-amber-200/70 font-medium">{t('podium', 'distance')}</p>
                    <p className="font-extrabold text-base text-white">{(top3Individual[0].total_distance / 1000).toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-amber-200/70 font-medium">{t('podium', 'elevation')}</p>
                    <p className="font-bold text-amber-300">{Math.round(top3Individual[0].total_elevation).toLocaleString('vi-VN')} m</p>
                  </div>
                </div>
              </div>
            )}

            {/* HẠNG 3 */}
            {top3Individual[2] && (
              <div className="order-3 bronze-podium p-6 rounded-3xl flex flex-col items-center justify-between text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-3 left-3 bg-orange-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5" /> {t('podium', 'bronzeTitle')}
                </div>
                <div className="relative my-4">
                  <img
                    src={top3Individual[2].profile.avatar_url}
                    alt={top3Individual[2].profile.full_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-orange-500 shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-1 bg-orange-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border border-white">
                    3
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-white">{top3Individual[2].profile.full_name}</h3>
                  <p className="text-xs text-[#00BCEB] font-medium">{top3Individual[2].profile.team?.name || t('table', 'noTeam')}</p>
                </div>
                <div className="w-full mt-4 pt-3 border-t border-slate-700/50 flex justify-around text-xs">
                  <div>
                    <p className="text-slate-400">{t('podium', 'totalPoints')}</p>
                    <p className="font-extrabold text-base text-[#CCFF00]">{top3Individual[2].total_points}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">{t('podium', 'distance')}</p>
                    <p className="font-bold text-slate-200">{(top3Individual[2].total_distance / 1000).toFixed(1)} km</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* TEAM PODIUM */
        top3Team.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pt-4">
            {top3Team[1] && (
              <div className="silver-podium p-6 rounded-3xl flex flex-col justify-between text-center relative">
                <div className="text-xs font-bold text-slate-300">{t('podium', 'silverTitle')}</div>
                <h3 className="font-bold text-xl text-white mt-2">{top3Team[1].team.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{top3Team[1].member_count} {t('table', 'membersCount')}</p>
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-xs">
                  <span>{t('podium', 'totalPoints')}: <strong className="text-[#CCFF00]">{top3Team[1].total_points}</strong></span>
                  <span>{t('podium', 'avgPerMember')}: <strong className="text-white">{top3Team[1].avg_points_per_member}</strong></span>
                </div>
              </div>
            )}
            {top3Team[0] && (
              <div className="gold-podium p-6 sm:p-8 rounded-3xl flex flex-col justify-between text-center relative md:-mt-4">
                <div className="text-xs font-black text-amber-400 tracking-wider">{t('podium', 'goldTeam')}</div>
                <h3 className="font-black text-2xl text-white mt-2">{top3Team[0].team.name}</h3>
                <p className="text-xs text-amber-200/80 mt-1">{top3Team[0].team.description}</p>
                <div className="mt-4 pt-4 border-t border-amber-500/20 flex justify-around text-xs">
                  <div><p className="text-slate-400">{t('podium', 'totalPoints')}</p><p className="font-extrabold text-xl text-[#CCFF00]">{top3Team[0].total_points}</p></div>
                  <div><p className="text-slate-400">{t('podium', 'distance')}</p><p className="font-bold text-white">{(top3Team[0].total_distance / 1000).toFixed(1)} km</p></div>
                </div>
              </div>
            )}
            {top3Team[2] && (
              <div className="bronze-podium p-6 rounded-3xl flex flex-col justify-between text-center relative">
                <div className="text-xs font-bold text-orange-400">{t('podium', 'bronzeTitle')}</div>
                <h3 className="font-bold text-xl text-white mt-2">{top3Team[2].team.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{top3Team[2].member_count} {t('table', 'membersCount')}</p>
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-xs">
                  <span>{t('podium', 'totalPoints')}: <strong className="text-[#CCFF00]">{top3Team[2].total_points}</strong></span>
                  <span>{t('podium', 'avgPerMember')}: <strong className="text-white">{top3Team[2].avg_points_per_member}</strong></span>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* TABLE LISTING SECTION */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-slate-800">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00BCEB]" />
            <span>{viewMode === 'individual' ? t('table', 'individualTitle') : t('table', 'teamTitle')}</span>
          </h2>
          <span className="text-xs text-[#00BCEB] font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Strava API Sync
          </span>
        </div>

        {viewMode === 'individual' ? (
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-900/50 border-b border-slate-800">
                  <th className="py-3.5 px-4 font-semibold text-center w-16">{t('table', 'rank')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('table', 'athlete')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('table', 'team')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('table', 'distance')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('table', 'elevation')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('table', 'points')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {individualLeaderboard.map((entry) => {
                  const isCurrentUser = currentUser?.id === entry.profile.id;
                  return (
                    <tr
                      key={entry.profile.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrentUser ? 'bg-[#00BCEB]/10 border-l-4 border-l-[#00BCEB]' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-center font-bold">
                        {entry.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black">1</span>
                        ) : entry.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black">2</span>
                        ) : entry.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white font-black">3</span>
                        ) : (
                          <span className="text-slate-400 font-semibold">#{entry.rank}</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={entry.profile.avatar_url}
                            alt={entry.profile.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span>{entry.profile.full_name}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00BCEB] text-slate-950 font-extrabold">
                                  {t('table', 'youBadge')}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{entry.profile.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {entry.profile.team ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
                            {entry.profile.team.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">{t('table', 'noTeam')}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-200">
                        {(entry.total_distance / 1000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">km</span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-300">
                        {Math.round(entry.total_elevation).toLocaleString('vi-VN')} <span className="text-xs text-slate-500">m</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-extrabold text-base text-[#CCFF00]">{entry.total_points}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* TEAM TABLE LIST */
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-900/50 border-b border-slate-800">
                  <th className="py-3.5 px-4 font-semibold text-center w-16">{t('table', 'rank')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('table', 'team')}</th>
                  <th className="py-3.5 px-4 font-semibold text-center">{t('table', 'membersCount')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('table', 'distance')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('table', 'avgPoints')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('table', 'points')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {teamLeaderboard.map((entry) => (
                  <tr key={entry.team.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 text-center font-bold text-slate-400">#{entry.rank}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <img src={entry.team.avatar_url} alt={entry.team.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                        <div>
                          <p className="font-bold text-white">{entry.team.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{entry.team.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                        {entry.member_count} VĐV
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-slate-200">
                      {(entry.total_distance / 1000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">km</span>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-emerald-400">
                      {entry.avg_points_per_member} pts
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-extrabold text-base text-[#CCFF00]">{entry.total_points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
