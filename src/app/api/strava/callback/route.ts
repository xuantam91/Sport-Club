import { NextResponse } from 'next/server';
import { exchangeStravaToken } from '@/lib/strava';
import { upsertServerProfile, syncAthleteStravaActivitiesOnServer } from '@/lib/serverStore';
import { Profile } from '@/types';

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

    const numStravaId = stravaId ? Number(stravaId) : undefined;
    const isStravaAdmin = numStravaId === 162869534 || String(stravaId) === '162869534';

    // Tạo / cập nhật profile ngay trên Server Storage
    const newProfile: Profile = {
      id: numStravaId ? `usr-strava-${numStravaId}` : `usr-${Date.now()}`,
      role: isStravaAdmin ? 'admin' : 'member',
      full_name: fullName,
      avatar_url: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      username: stravaUsername,
      email: stravaEmail,
      gender: gender,
      strava_id: numStravaId,
      strava_access_token: accessToken || undefined,
      created_at: new Date().toISOString(),
    };

    await upsertServerProfile(newProfile);

    // Kéo ngay hoạt động Strava của VĐV này về Server
    if (accessToken) {
      syncAthleteStravaActivitiesOnServer(newProfile, accessToken).catch((err) => {
        console.error('Lỗi sync hoạt động ban đầu:', err);
      });
    }

    const profileUrl = new URL('/profile', request.url);
    profileUrl.searchParams.set('strava_connected', '1');
    profileUrl.searchParams.set('strava_id', String(stravaId));
    profileUrl.searchParams.set('name', fullName);
    profileUrl.searchParams.set('username', stravaUsername);
    profileUrl.searchParams.set('email', stravaEmail);
    profileUrl.searchParams.set('gender', gender);
    if (accessToken) profileUrl.searchParams.set('strava_token', accessToken);
    if (avatar) profileUrl.searchParams.set('avatar', avatar);

    return NextResponse.redirect(profileUrl);
  } catch (err: any) {
    console.error('Strava token exchange error:', err);
    return NextResponse.redirect(new URL('/profile?error=token_exchange_failed', request.url));
  }
}
