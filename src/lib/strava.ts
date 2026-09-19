import { SportRule, SportType } from '@/types';

export const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '161019';
export const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || '5dc1e3005697cbcfc1282bc208ad3025cc519fb8';

/**
 * Tạo URL ủy quyền đăng nhập Strava OAuth 2.0 (Hỗ trợ mở App Strava trên Mobile)
 */
export const getStravaOAuthUrl = (redirectUri: string, isMobile: boolean = false) => {
  const scope = 'read,activity:read,activity:read_all,profile:read_all';
  const endpoint = isMobile
    ? 'https://www.strava.com/oauth/mobile/authorize'
    : 'https://www.strava.com/oauth/authorize';
  return `${endpoint}?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&approval_prompt=force&scope=${scope}`;
};

/**
 * Đổi authorization code lấy tokens
 */
export const exchangeStravaToken = async (code: string) => {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Lỗi kết nối Strava Token Exchange');
  }

  return res.json();
};

/**
 * Tự động gia hạn Access Token nếu đã hết hạn
 */
export const refreshStravaToken = async (refreshToken: string) => {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error('Lỗi làm mới token Strava');
  }

  return res.json();
};

/**
 * Lấy danh sách bài tập thể thao mới nhất của vận động viên từ Strava (tối đa 200 bài)
 */
export const fetchStravaActivities = async (accessToken: string, afterTimestamp?: number) => {
  let url = `https://www.strava.com/api/v3/athlete/activities?per_page=200`;
  if (afterTimestamp) {
    url += `&after=${afterTimestamp}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Strava API error response:', res.status, errText);
    throw new Error(`Strava API (${res.status}): ${errText}`);
  }

  return res.json();
};

/**
 * Hàm tính điểm quy đổi linh hoạt từ khoảng cách (mét) và độ cao leo dốc (mét)
 */
export const calculatePoints = (
  type: SportType,
  distanceMeters: number,
  elevationMeters: number = 0,
  rules: SportRule[]
): number => {
  const rule = rules.find((r) => r.activity_type.toLowerCase() === type.toLowerCase()) || {
    multiplier: 1.0,
    bonus_per_100m_elevation: 0.5,
  };

  const km = distanceMeters / 1000;
  const distancePoints = km * rule.multiplier;
  const elevationPoints = (elevationMeters / 100) * (rule.bonus_per_100m_elevation || 0);

  return Math.round((distancePoints + elevationPoints) * 100) / 100;
};
