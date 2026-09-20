import fs from 'fs';
import path from 'path';
import { Profile, Activity, Team, Challenge } from '@/types';
import { fetchStravaActivities, calculatePoints } from '@/lib/strava';
import { DEFAULT_SPORT_RULES } from '@/lib/demoData';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

/**
 * Đọc tất cả Profiles đã lưu trên Server
 */
export const getServerProfiles = (): Profile[] => {
  ensureDataDir();
  if (!fs.existsSync(PROFILES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Lỗi đọc profiles.json:', e);
    return [];
  }
};

/**
 * Thêm hoặc Cập nhật Profile trên Server
 */
export const upsertServerProfile = (profile: Profile): Profile[] => {
  ensureDataDir();
  const profiles = getServerProfiles();
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
  } catch (e) {
    console.error('Lỗi ghi profiles.json:', e);
  }

  return updatedList;
};

/**
 * Đọc tất cả Activities đã lưu trên Server
 */
export const getServerActivities = (): Activity[] => {
  ensureDataDir();
  if (!fs.existsSync(ACTIVITIES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(ACTIVITIES_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Lỗi đọc activities.json:', e);
    return [];
  }
};

/**
 * Gộp thêm các bài tập mới vào Server mà không trùng lặp
 */
export const upsertServerActivities = (newActs: Activity[]): Activity[] => {
  ensureDataDir();
  const existingActs = getServerActivities();
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
  } catch (e) {
    console.error('Lỗi ghi activities.json:', e);
  }

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

    return upsertServerActivities(formattedActs);
  } catch (e) {
    console.error(`Lỗi sync Strava cho VĐV ${profile.full_name}:`, e);
    return [];
  }
};
