import fs from 'fs';
import path from 'path';
import { Profile, Activity, Team, Challenge, SportRule } from '@/types';
import { fetchStravaActivities, calculatePoints, mapSportType, refreshStravaToken } from '@/lib/strava';
import { DEFAULT_SPORT_RULES } from '@/lib/demoData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');
const RULES_FILE = path.join(DATA_DIR, 'rules.json');

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
 * Đọc tất cả Giải đấu (Challenges) đã lưu trên Cloud (Supabase) hoặc Local File
 */
export const getServerChallenges = async (): Promise<Challenge[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((d: any) => ({
          ...d,
          participant_ids: Array.isArray(d.participant_ids) ? d.participant_ids : [],
        })) as Challenge[];
      }
    } catch (e) {
      // Supabase table challenges might not exist yet
    }
  }

  ensureDataDir();
  if (!fs.existsSync(CHALLENGES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(CHALLENGES_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};

/**
 * Thêm hoặc Cập nhật Giải đấu trên Cloud (Supabase) hoặc Local File
 */
export const upsertServerChallenge = async (ch: Challenge): Promise<Challenge[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const upsertData: any = {
        id: ch.id,
        title: ch.title,
        description: ch.description || null,
        type: ch.type || 'Run',
        target_km: ch.target_km || 100,
        start_date: ch.start_date,
        end_date: ch.end_date,
        banner_url: ch.banner_url || null,
        status: ch.status || 'active',
        participant_ids: ch.participant_ids || [],
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('challenges').upsert(upsertData, {
        onConflict: 'id',
      });

      if (!error) {
        return await getServerChallenges();
      }
    } catch (e) {
      // Supabase table challenges might not exist yet
    }
  }

  ensureDataDir();
  const list = await getServerChallenges();
  const existingIdx = list.findIndex((c) => c.id === ch.id);

  let updatedList: Challenge[];
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...ch };
    updatedList = [...list];
  } else {
    updatedList = [ch, ...list];
  }

  try {
    fs.writeFileSync(CHALLENGES_FILE, JSON.stringify(updatedList, null, 2), 'utf-8');
  } catch (e) {}

  return updatedList;
};

/**
 * Đọc tất cả Quy tắc điểm số các môn thể thao từ Cloud (Supabase) hoặc Local File
 */
export const getServerSportRules = async (): Promise<SportRule[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('sport_rules')
        .select('*')
        .order('activity_type', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as SportRule[];
      }
    } catch (e) {
      console.error('Supabase get sport_rules error:', e);
    }
  }

  ensureDataDir();
  if (!fs.existsSync(RULES_FILE)) {
    return DEFAULT_SPORT_RULES;
  }
  try {
    const raw = fs.readFileSync(RULES_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_SPORT_RULES;
  } catch (e) {
    return DEFAULT_SPORT_RULES;
  }
};

/**
 * Lưu toàn bộ Quy tắc điểm số (Thêm môn mới, sửa hệ số, xóa môn) lên Cloud (Supabase) hoặc Local File
 */
export const saveServerSportRules = async (rules: SportRule[]): Promise<SportRule[]> => {
  if (isSupabaseConfigured() && supabase && Array.isArray(rules)) {
    try {
      // 1. Upsert tất cả các rule trong danh sách mới
      for (const r of rules) {
        await supabase.from('sport_rules').upsert(
          {
            activity_type: r.activity_type,
            display_name: r.display_name,
            multiplier: Number(r.multiplier) || 1.0,
            bonus_per_100m_elevation: Number(r.bonus_per_100m_elevation) || 0,
            icon: r.icon || '🏅',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'activity_type' }
        );
      }

      // 2. Xóa các rule không còn trong danh sách (nếu admin xóa môn)
      const currentCodes = rules.map((r) => r.activity_type);
      const { data: existingData } = await supabase.from('sport_rules').select('activity_type');
      if (Array.isArray(existingData)) {
        for (const item of existingData) {
          if (!currentCodes.includes(item.activity_type)) {
            await supabase.from('sport_rules').delete().eq('activity_type', item.activity_type);
          }
        }
      }

      return await getServerSportRules();
    } catch (e) {
      console.error('Supabase save sport_rules error:', e);
    }
  }

  ensureDataDir();
  try {
    fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), 'utf-8');
  } catch (e) {}

  return rules;
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
      if (profile.strava_refresh_token) {
        upsertData.strava_refresh_token = profile.strava_refresh_token;
      }
      if (profile.strava_expires_at) {
        upsertData.strava_expires_at = profile.strava_expires_at;
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
 * Xóa một Profile (VĐV) khỏi Cloud (Supabase) hoặc Local File
 */
export const deleteServerProfile = async (profileId: string): Promise<Profile[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Xóa các bài tập liên kết của user này nếu có
      await supabase.from('activities').delete().eq('profile_id', profileId);
      // 2. Xóa profile khỏi bảng profiles
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) {
        console.error('Supabase delete profile error:', error);
      }
      return await getServerProfiles();
    } catch (e) {
      console.error('Supabase delete profile error:', e);
    }
  }

  ensureDataDir();
  const profiles = await getServerProfiles();
  const updatedList = profiles.filter((p) => p.id !== profileId);
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
 * Đảm bảo token Strava luôn còn hạn (tự động dùng refresh_token để cấp mới vĩnh viễn)
 */
export const ensureValidStravaToken = async (profile: Profile): Promise<string | null> => {
  if (!profile.strava_access_token && !profile.strava_refresh_token) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  // Nếu token còn hạn ít nhất 5 phút nữa thì dùng tiếp
  const isExpired = !profile.strava_access_token ||
    (profile.strava_expires_at && profile.strava_expires_at <= nowSeconds + 300);

  if (!isExpired && profile.strava_access_token) {
    return profile.strava_access_token;
  }

  // Nếu token đã hết hạn nhưng có refresh_token -> Tự động gia hạn ngay
  if (profile.strava_refresh_token) {
    try {
      console.log(`[Strava Auto-Refresh] Đang gia hạn token tự động cho VĐV ${profile.full_name} (ID Strava: ${profile.strava_id})...`);
      const refreshed = await refreshStravaToken(profile.strava_refresh_token);
      if (refreshed && refreshed.access_token) {
        const newAccessToken = refreshed.access_token;
        const newRefreshToken = refreshed.refresh_token || profile.strava_refresh_token;
        const newExpiresAt = refreshed.expires_at || (nowSeconds + (refreshed.expires_in || 21600));

        profile.strava_access_token = newAccessToken;
        profile.strava_refresh_token = newRefreshToken;
        profile.strava_expires_at = newExpiresAt;

        // Lưu token mới vào Supabase
        if (isSupabaseConfigured() && supabase) {
          await supabase.from('profiles').update({
            strava_access_token: newAccessToken,
            strava_refresh_token: newRefreshToken,
            strava_expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          }).eq('id', profile.id);
        }

        // Cập nhật file cục bộ nếu có
        ensureDataDir();
        if (fs.existsSync(PROFILES_FILE)) {
          try {
            const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
            const list: Profile[] = JSON.parse(raw);
            const idx = list.findIndex((p) => p.id === profile.id);
            if (idx >= 0) {
              list[idx].strava_access_token = newAccessToken;
              list[idx].strava_refresh_token = newRefreshToken;
              list[idx].strava_expires_at = newExpiresAt;
              fs.writeFileSync(PROFILES_FILE, JSON.stringify(list, null, 2), 'utf-8');
            }
          } catch (e) {}
        }

        console.log(`[Strava Auto-Refresh] Gia hạn token thành công cho VĐV ${profile.full_name}!`);
        return newAccessToken;
      }
    } catch (err: any) {
      console.error(`[Strava Auto-Refresh] Lỗi khi gia hạn token cho ${profile.full_name}:`, err.message);
    }
  }

  return profile.strava_access_token || null;
};

/**
 * Tự động kết nối Strava API và kéo toàn bộ bài tập của VĐV về Server
 */
export const syncAthleteStravaActivitiesOnServer = async (
  profile: Profile,
  accessToken?: string
): Promise<{ success: boolean; count: number; activities: Activity[]; error?: string; needsReauth?: boolean }> => {
  let token: string | null | undefined = accessToken;
  if (!token) {
    token = await ensureValidStravaToken(profile);
  }

  if (!token) {
    return {
      success: false,
      count: 0,
      activities: [],
      error: 'Tài khoản chưa có token Strava hoặc chưa cấp quyền.',
      needsReauth: true,
    };
  }

  try {
    const stravaActs = await fetchStravaActivities(token);
    if (!Array.isArray(stravaActs)) {
      return { success: true, count: 0, activities: [] };
    }

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

    const saved = await upsertServerActivities(formattedActs);
    return {
      success: true,
      count: formattedActs.length,
      activities: saved,
    };
  } catch (e: any) {
    console.error(`Lỗi sync Strava cho VĐV ${profile.full_name}:`, e.message);
    const isAuthError =
      e.message &&
      (e.message.includes('401') ||
        e.message.includes('Authorization Error') ||
        e.message.includes('invalid') ||
        e.message.includes('Unauthorized'));

    return {
      success: false,
      count: 0,
      activities: [],
      error: e.message,
      needsReauth: isAuthError,
    };
  }
};
