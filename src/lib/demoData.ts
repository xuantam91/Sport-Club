import { Profile, Team, Activity, SportRule, Challenge } from '@/types';

export const DEFAULT_SPORT_RULES: SportRule[] = [
  { id: '1', activity_type: 'Run', display_name: 'Chạy bộ', multiplier: 1.0, bonus_per_100m_elevation: 0.5, icon: '🏃' },
  { id: '2', activity_type: 'Walk', display_name: 'Đi bộ', multiplier: 0.6, bonus_per_100m_elevation: 0.3, icon: '🚶' },
  { id: '3', activity_type: 'Hike', display_name: 'Leo núi', multiplier: 0.8, bonus_per_100m_elevation: 0.5, icon: '🥾' },
  { id: '4', activity_type: 'Ride', display_name: 'Đạp xe', multiplier: 0.3, bonus_per_100m_elevation: 0.2, icon: '🚴' },
  { id: '5', activity_type: 'Swim', display_name: 'Bơi lội', multiplier: 4.0, bonus_per_100m_elevation: 0.0, icon: '🏊' },
];

export const DEMO_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'Cisco Cyber Runners ⚡',
    code: 'CYBER2026',
    avatar_url: '/images/cisco_team_victory.jpg',
    description: 'Biệt đội An Ninh Mạng Cisco GSC Vietnam!',
    member_count: 2,
    total_distance: 0,
    total_points: 0,
    created_at: '2026-01-01',
  },
];

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'usr-1',
    full_name: 'Tommy Tran',
    email: 'tommy.tran@gmail.com',
    username: 'tommy.tran',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Cybersecurity Architecture',
    role: 'admin',
    team_id: 'team-1',
    team: DEMO_TEAMS[0],
    strava_id: 162869534,
    gender: 'male',
    certificates: [],
    created_at: '2026-01-01',
  },
  {
    id: 'usr-tamtran',
    full_name: 'Tam Tran',
    email: 'tran_jony@gmail.com',
    username: 'tam.tran',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Cybersecurity Architecture',
    role: 'member',
    team_id: 'team-1',
    team: DEMO_TEAMS[0],
    strava_id: 49229360,
    gender: 'male',
    certificates: [],
    created_at: '2026-01-05',
  },
];

export const DEMO_ACTIVITIES: Activity[] = [];

export const DEMO_CHALLENGES: Challenge[] = [];
