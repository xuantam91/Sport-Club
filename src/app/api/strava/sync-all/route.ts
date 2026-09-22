import { NextResponse } from 'next/server';
import { getServerProfiles, syncAthleteStravaActivitiesOnServer, getServerActivities } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

// Biến lưu thời điểm đồng bộ gần nhất để chống spam rate limit Strava khi nhiều tab cùng mở
let lastSyncTime = 0;
const THROTTLE_MS = 30 * 1000; // 30 giây

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true' || searchParams.get('force') === '1';
    const now = Date.now();

    // Nếu không ép buộc (force) và vừa đồng bộ xong dưới 30s trước thì trả về ngay data hiện tại
    if (!force && now - lastSyncTime < THROTTLE_MS) {
      const cachedActs = await getServerActivities();
      return NextResponse.json({
        success: true,
        throttled: true,
        message: 'Dữ liệu vừa được đồng bộ gần đây',
        totalSynced: 0,
        activitiesCount: cachedActs.length,
        activities: cachedActs,
      });
    }

    lastSyncTime = now;
    const profiles = await getServerProfiles();
    let totalSynced = 0;
    const reauthNeededAthletes: string[] = [];

    for (const p of profiles) {
      if (p.strava_access_token || p.strava_refresh_token) {
        const syncRes = await syncAthleteStravaActivitiesOnServer(p);
        if (syncRes.success) {
          totalSynced += syncRes.count;
        } else if (syncRes.needsReauth) {
          reauthNeededAthletes.push(p.full_name);
        }
      }
    }

    const allActivities = await getServerActivities();
    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ bài tập cho ${profiles.length} VĐV`,
      totalSynced,
      reauthNeededAthletes,
      needsReauth: reauthNeededAthletes.length > 0,
      activitiesCount: allActivities.length,
      activities: allActivities,
    });
  } catch (e: any) {
    console.error('Lỗi API sync-all:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
