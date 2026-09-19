import { Profile, Team, Activity, SportRule, Challenge } from '@/types';

export const DEFAULT_SPORT_RULES: SportRule[] = [
  { id: '1', activity_type: 'Run', display_name: 'Chạy bộ', multiplier: 1.0, bonus_per_100m_elevation: 0.5, icon: '🏃' },
  { id: '2', activity_type: 'Walk', display_name: 'Đi bộ', multiplier: 0.6, bonus_per_100m_elevation: 0.3, icon: '🚶' },
  { id: '3', activity_type: 'Hike', display_name: 'Leo núi', multiplier: 0.8, bonus_per_100m_elevation: 0.5, icon: '🥾' },
  { id: '4', activity_type: 'Ride', display_name: 'Đạp xe', multiplier: 0.3, bonus_per_100m_elevation: 0.2, icon: '🚴' },
  { id: '5', activity_type: 'Swim', display_name: 'Bơi lội', multiplier: 4.0, bonus_per_100m_elevation: 0.0, icon: '🏊' },
];

export const DEMO_TEAMS: Team[] = [];

export const DEMO_PROFILES: Profile[] = [];

export const DEMO_ACTIVITIES: Activity[] = [];

export const DEMO_CHALLENGES: Challenge[] = [];
