import { NextResponse } from 'next/server';
import { fetchStravaActivities, calculatePoints } from '@/lib/strava';
import { DEFAULT_SPORT_RULES } from '@/lib/demoData';

function mapSportType(type: string, sportType?: string): 'Run' | 'Ride' | 'Walk' | 'Swim' | 'Hike' {
  const raw = (sportType || type || '').toLowerCase();
  if (raw.includes('run')) return 'Run';
  if (raw.includes('ride') || raw.includes('bike') || raw.includes('cycling')) return 'Ride';
  if (raw.includes('walk')) return 'Walk';
  if (raw.includes('swim')) return 'Swim';
  if (raw.includes('hike')) return 'Hike';
  return 'Run';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing Strava access token' }, { status: 400 });
  }

  try {
    const rawActivities = await fetchStravaActivities(token);

    if (!Array.isArray(rawActivities)) {
      return NextResponse.json({ activities: [] });
    }

    const mappedActivities = rawActivities.map((act: any) => {
      const sportCategory = mapSportType(act.type, act.sport_type);
      const points = calculatePoints(
        sportCategory,
        act.distance || 0,
        act.total_elevation_gain || 0,
        DEFAULT_SPORT_RULES
      );

      return {
        id: `strava-${act.id}`,
        strava_activity_id: act.id,
        name: act.name || 'Bài tập Strava',
        type: sportCategory,
        raw_type: act.sport_type || act.type,
        distance: act.distance || 0,
        moving_time: act.moving_time || 0,
        elapsed_time: act.elapsed_time || 0,
        total_elevation_gain: act.total_elevation_gain || 0,
        calculated_points: points,
        start_date: act.start_date || new Date().toISOString(),
        created_at: act.start_date || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      count: mappedActivities.length,
      activities: mappedActivities,
    });
  } catch (err: any) {
    console.error('Error fetching Strava activities API:', err);
    return NextResponse.json({ error: err.message || 'Lỗi kết nối Strava API' }, { status: 500 });
  }
}
