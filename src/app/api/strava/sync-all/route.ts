import { NextResponse } from 'next/server';
import { getServerProfiles, syncAthleteStravaActivitiesOnServer, getServerActivities } from '@/lib/serverStore';

export async function GET() {
  try {
    const profiles = await getServerProfiles();
    let totalSynced = 0;

    for (const p of profiles) {
      if (p.strava_access_token) {
        const synced = await syncAthleteStravaActivitiesOnServer(p);
        totalSynced += synced.length;
      }
    }

    const allActivities = await getServerActivities();
    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ bài tập cho ${profiles.length} VĐV`,
      activitiesCount: allActivities.length,
      activities: allActivities,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
