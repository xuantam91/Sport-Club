import fs from 'fs';
import path from 'path';
import { Profile, Activity, Team, Challenge } from '@/types';
import { fetchStravaActivities, calculatePoints } from '@/lib/strava';
import { DEFAULT_SPORT_RULES } from '@/lib/demoData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');

const ensureDataDir = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Vercel serverless read-only filesystem guard
  }
};

/**
 * Đọc tất cả Profiles đã lưu trên Cloud (Supabase) hoặc Local File
 */
export const getServerProfiles = async (): Promise<Profile[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, team:teams!profiles_team_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as Profile[];
      }
    } catch (e) {
      console.error('Supabase get profiles error:', e);
    }
  }

  ensureDataDir();
  if (!fs.existsSync(PROFILES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};

/**
 * Thêm hoặc Cập nhật Profile trên Cloud (Supabase) hoặc Local File
 */
export const upsertServerProfile = async (profile: Profile): Promise<Profile[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const upsertData: any = {
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username || null,
        email: profile.email || null,
        avatar_url: profile.avatar_url || null,
        gender: profile.gender || 'male',
        role: profile.role || 'member',
        strava_id: profile.strava_id || null,
        strava_access_token: profile.strava_access_token || null,
        updated_at: new Date().toISOString(),
      };
      if (profile.team_id) {
        upsertData.team_id = profile.team_id;
      }

      await supabase.from('profiles').upsert(upsertData, {
        onConflict: profile.strava_id ? 'strava_id' : 'id',
      });

      return await getServerProfiles();
    } catch (e) {
      console.error('Supabase upsert profile error:', e);
    }
  }

  ensureDataDir();
  const profiles = await getServerProfiles();
  const existingIdx = profiles.findIndex(
    (p) => p.id === profile.id || (profile.strava_id && p.strava_id === profile.strava_id)
  );

  let updatedList: Profile[];
  if (existingIdx >= 0) {
    profiles[existingIdx] = { ...profiles[existingIdx], ...profile };
    updatedList = [...profiles];
  } else {
    updatedList = [profile, ...profiles];
  }

  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(updatedList, null, 2), 'utf-8');
  } catch (e) {}

  return updatedList;
};

/**
 * Đọc tất cả Activities đã lưu trên Cloud (Supabase) hoặc Local File
 */
export const getServerActivities = async (): Promise<Activity[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, profile:profiles(*)')
        .order('start_date', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as Activity[];
      }
    } catch (e) {
      console.error('Supabase get activities error:', e);
    }
  }

  ensureDataDir();
  if (!fs.existsSync(ACTIVITIES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(ACTIVITIES_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};

/**
 * Gộp thêm các bài tập mới vào Cloud (Supabase) hoặc Local File
 */
export const upsertServerActivities = async (newActs: Activity[]): Promise<Activity[]> => {
  if (isSupabaseConfigured() && supabase && newActs.length > 0) {
    try {
      const upsertRows = newActs.map((act) => ({
        id: act.id,
        profile_id: act.profile_id,
        strava_activity_id: act.strava_activity_id,
        name: act.name,
        type: act.type,
        distance: act.distance,
        moving_time: act.moving_time,
        elapsed_time: act.elapsed_time,
        total_elevation_gain: act.total_elevation_gain,
        calculated_points: act.calculated_points,
        start_date: act.start_date,
        polyline: act.polyline || null,
      }));

      await supabase.from('activities').upsert(upsertRows, {
        onConflict: 'strava_activity_id',
      });

      return await getServerActivities();
    } catch (e) {
      console.error('Supabase upsert activities error:', e);
    }
  }

  ensureDataDir();
  const existingActs = await getServerActivities();
  const existingMap = new Map<string, Activity>();

  existingActs.forEach((act) => {
    const key = String(act.strava_activity_id || act.id);
    existingMap.set(key, act);
  });

  newActs.forEach((act) => {
    const key = String(act.strava_activity_id || act.id);
    existingMap.set(key, act);
  });

  const merged = Array.from(existingMap.values()).sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  try {
    fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (e) {}

  return merged;
};

/**
 * Tự động kết nối Strava API và kéo toàn bộ bài tập của VĐV về Server
 */
export const syncAthleteStravaActivitiesOnServer = async (
  profile: Profile,
  accessToken?: string
): Promise<Activity[]> => {
  const token = accessToken || profile.strava_access_token;
  if (!token) return [];

  try {
    const stravaActs = await fetchStravaActivities(token);
    if (!Array.isArray(stravaActs) || stravaActs.length === 0) return [];

    const formattedActs: Activity[] = stravaActs.map((act: any) => {
      const type = act.type || 'Run';
      const points = calculatePoints(type, act.distance || 0, act.total_elevation_gain || 0, DEFAULT_SPORT_RULES);

      return {
        id: `act-strava-${act.id}`,
        profile_id: profile.id,
        profile: profile,
        strava_activity_id: act.id,
        name: act.name || 'Hoạt động Strava',
        type: type,
        distance: act.distance || 0,
        moving_time: act.moving_time || 0,
        elapsed_time: act.elapsed_time || 0,
        total_elevation_gain: act.total_elevation_gain || 0,
        calculated_points: points,
        start_date: act.start_date || new Date().toISOString(),
        polyline: act.map?.summary_polyline || undefined,
        created_at: new Date().toISOString(),
      };
    });

    return await upsertServerActivities(formattedActs);
  } catch (e) {
    console.error(`Lỗi sync Strava cho VĐV ${profile.full_name}:`, e);
    return [];
  }
};
