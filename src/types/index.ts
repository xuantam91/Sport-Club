export type SportType = 'Run' | 'Ride' | 'Walk' | 'Hike' | 'Swim' | 'All';

export type TimeFilter = 'week' | 'month' | 'quarter' | 'year' | 'all';

export type UserRole = 'admin' | 'organizer' | 'captain' | 'member';

export interface Certificate {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'challenge';
  recipient_name: string;
  achievement_detail: string;
  issue_date: string;
  badge_color: string;
  verified_by: string;
}

export interface SportRule {
  id: string;
  activity_type: string;
  display_name: string;
  multiplier: number;
  min_pace?: number;
  max_pace?: number;
  bonus_per_100m_elevation: number;
  icon: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  avatar_url?: string;
  description?: string;
  leader_id?: string;
  member_count?: number;
  total_distance?: number;
  total_points?: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  department?: string;
  role: UserRole;
  team_id?: string;
  team?: Team;
  strava_id?: number;
  strava_access_token?: string;
  strava_refresh_token?: string;
  strava_expires_at?: number;
  email_notifications?: boolean;
  password_set?: boolean;
  certificates?: Certificate[];
  created_at: string;
}

export interface Activity {
  id: string;
  profile_id: string;
  profile?: Profile;
  strava_activity_id: number;
  name: string;
  type: SportType;
  distance: number; // mét
  moving_time: number; // giây
  elapsed_time: number; // giây
  total_elevation_gain: number; // mét
  calculated_points: number;
  start_date: string;
  polyline?: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: SportType;
  target_km: number;
  start_date: string;
  end_date: string;
  banner_url?: string;
  participant_ids: string[];
  status: 'active' | 'upcoming' | 'completed';
}

export interface IndividualLeaderboardEntry {
  rank: number;
  profile: Profile;
  total_distance: number;
  total_points: number;
  total_elevation: number;
  total_moving_time: number;
  activity_count: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  team: Team;
  total_distance: number;
  total_points: number;
  total_elevation: number;
  member_count: number;
  avg_points_per_member: number;
  activity_count: number;
}
