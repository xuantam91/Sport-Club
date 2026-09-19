import { NextResponse } from 'next/server';
import { exchangeStravaToken, fetchStravaActivities, calculatePoints } from '@/lib/strava';
import { DEFAULT_SPORT_RULES } from '@/lib/demoData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/profile?error=strava_auth_denied', request.url));
  }

  try {
    const tokenData = await exchangeStravaToken(code);
    const athlete = tokenData.athlete || {};
    const accessToken = tokenData.access_token || '';

    const stravaId = athlete.id || '';
    const firstname = athlete.firstname || '';
    const lastname = athlete.lastname || '';
    const fullName = `${firstname} ${lastname}`.trim() || 'Vận Động Viên Cisco';
    const avatar = athlete.profile || '';
    const stravaUsername = athlete.username || `${firstname}.${lastname}`.toLowerCase().replace(/\s+/g, '.');
    const stravaEmail = athlete.email || `${stravaUsername}@gmail.com`;
    const gender = athlete.sex === 'M' ? 'male' : athlete.sex === 'F' ? 'female' : 'other';

    // Fetch athlete's actual Strava activities
    let fetchedActivities: any[] = [];
    if (accessToken) {
      try {
        fetchedActivities = await fetchStravaActivities(accessToken);
      } catch (actErr) {
        console.error('Error fetching Strava activities in callback:', actErr);
      }
    }

    const mappedActivities = (fetchedActivities || []).map((act: any) => ({
      id: `strava-${act.id}`,
      strava_activity_id: act.id,
      name: act.name || 'Bài tập Strava',
      type: act.type === 'Run' ? 'Run' : act.type === 'Ride' ? 'Ride' : act.type === 'Walk' ? 'Walk' : 'Run',
      distance: act.distance || 0,
      moving_time: act.moving_time || 0,
      elapsed_time: act.elapsed_time || 0,
      total_elevation_gain: act.total_elevation_gain || 0,
      start_date: act.start_date || new Date().toISOString(),
      created_at: act.start_date || new Date().toISOString(),
    }));

    const profileUrl = new URL('/profile', request.url);
    profileUrl.searchParams.set('strava_connected', '1');
    profileUrl.searchParams.set('strava_id', String(stravaId));
    profileUrl.searchParams.set('name', fullName);
    profileUrl.searchParams.set('username', stravaUsername);
    profileUrl.searchParams.set('email', stravaEmail);
    profileUrl.searchParams.set('gender', gender);
    if (accessToken) profileUrl.searchParams.set('strava_token', accessToken);
    if (avatar) profileUrl.searchParams.set('avatar', avatar);

    if (mappedActivities.length > 0) {
      profileUrl.searchParams.set('strava_activities', encodeURIComponent(JSON.stringify(mappedActivities.slice(0, 30))));
    }

    return NextResponse.redirect(profileUrl);
  } catch (err: any) {
    console.error('Strava token exchange error:', err);
    return NextResponse.redirect(new URL('/profile?error=token_exchange_failed', request.url));
  }
}
