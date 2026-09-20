import fs from 'fs';
import path from 'path';
import { Profile, Activity, Team, Challenge } from '@/types';
import { fetchStravaActivities, calculatePoints, mapSportType } from '@/lib/strava';
import { DEFAULT_SPORT_RULES } from '@/lib/demoData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');

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
 * Đọc tất cả Teams đã lưu trên Cloud (Supabase) hoặc Local File
 */
export const getServerTeams = async (): Promise<Team[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as Team[];
      }
    } catch (e) {
      console.error('Supabase get teams error:', e);
    }
  }

  ensureDataDir();
  if (!fs.existsSync(TEAMS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(TEAMS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};

/**
 * Thêm hoặc Cập nhật Team trên Cloud (Supabase) hoặc Local File
 */
export const upsertServerTeam = async (team: Team): Promise<Team[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const upsertData: any = {
        id: team.id,
        name: team.name,
        code: team.code,
        description: team.description || null,
        avatar_url: team.avatar_url || null,
        created_at: team.created_at || new Date().toISOString(),
      };
      if (team.leader_id) {
        upsertData.leader_id = team.leader_id;
      }

      const { error } = await supabase.from('teams').upsert(upsertData, {
        onConflict: 'id',
      });

      if (error) {
        console.error('Supabase upsert team error:', error);
        throw new Error(error.message);
      }

      return await getServerTeams();
    } catch (e) {
      console.error('Supabase upsert team error:', e);
      throw e;
    }
  }

  ensureDataDir();
  const teams = await getServerTeams();
  const existingIdx = teams.findIndex((t) => t.id === team.id);

  let updatedList: Team[];
  if (existingIdx >= 0) {
    teams[existingIdx] = { ...teams[existingIdx], ...team };
    updatedList = [...teams];
  } else {
    updatedList = [team, ...teams];
  }

  try {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(updatedList, null, 2), 'utf-8');
  } catch (e) {}

  return updatedList;
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
        email: profile.email || null,
        avatar_url: profile.avatar_url || null,
        role: profile.role || 'member',
        strava_id: profile.strava_id || null,
        updated_at: new Date().toISOString(),
      };
      if (profile.strava_access_token) {
        upsertData.strava_access_token = profile.strava_access_token;
      }
      if (profile.department) {
        upsertData.department = profile.department;
      }
      if (profile.team_id) {
        try {
          const { data: teamExists } = await supabase
            .from('teams')
            .select('id')
            .eq('id', profile.team_id)
            .maybeSingle();

          if (teamExists) {
            upsertData.team_id = profile.team_id;
          } else if (profile.team && (profile.team.name || profile.team.code)) {
            // Tự động tạo/đồng bộ team lên Supabase nếu team đã có ở client
            await supabase.from('teams').upsert(
              {
                id: profile.team.id || profile.team_id,
                name: profile.team.name || 'Cisco Team',
                code: profile.team.code || `CSC-${Math.floor(1000 + Math.random() * 9000)}`,
                description: profile.team.description || null,
                avatar_url: profile.team.avatar_url || null,
                leader_id: profile.team.leader_id || profile.id,
                created_at: profile.team.created_at || new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
            upsertData.team_id = profile.team.id || profile.team_id;
          } else {
            upsertData.team_id = null;
          }
        } catch (err) {
          console.error('Lỗi kiểm tra team trong profile:', err);
          upsertData.team_id = null;
        }
      } else {
        upsertData.team_id = null;
      }

      const { error } = await supabase.from('profiles').upsert(upsertData, {
        onConflict: profile.strava_id ? 'strava_id' : 'id',
      });

      if (error) {
        console.error('Supabase upsert profile error:', error);
        throw new Error(error.message);
      }

      return await getServerProfiles();
    } catch (e) {
      console.error('Supabase upsert profile error:', e);
      throw e;
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
        distance: act.distance || 0,
        moving_time: act.moving_time || 0,
        elapsed_time: act.elapsed_time || 0,
        total_elevation_gain: act.total_elevation_gain || 0,
        calculated_points: act.calculated_points || 0,
        start_date: act.start_date || new Date().toISOString(),
        polyline: act.polyline || null,
      }));

      const { error } = await supabase.from('activities').upsert(upsertRows, {
        onConflict: 'strava_activity_id',
      });

      if (error) {
        console.error('Supabase upsert activities error:', error);
        throw new Error(error.message);
      }

      return await getServerActivities();
    } catch (e) {
      console.error('Supabase upsert activities error:', e);
      throw e;
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
      const sportCategory = mapSportType(act.type, act.sport_type);
      const points = calculatePoints(
        sportCategory,
        act.distance || 0,
        act.total_elevation_gain || 0,
        DEFAULT_SPORT_RULES
      );

      return {
        id: `act-strava-${act.id}`,
        profile_id: profile.id,
        profile: profile,
        strava_activity_id: act.id,
        name: act.name || 'Hoạt động Strava',
        type: sportCategory,
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
