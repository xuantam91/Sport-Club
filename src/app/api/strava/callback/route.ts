import { NextResponse } from 'next/server';
import { exchangeStravaToken } from '@/lib/strava';

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

    const stravaId = athlete.id || '';
    const firstname = athlete.firstname || '';
    const lastname = athlete.lastname || '';
    const fullName = `${firstname} ${lastname}`.trim() || 'Vận Động Viên Cisco';
    const avatar = athlete.profile || '';
    const stravaUsername = athlete.username || `${firstname}.${lastname}`.toLowerCase().replace(/\s+/g, '.');
    const stravaEmail = athlete.email || `${stravaUsername}@gmail.com`;
    const gender = athlete.sex === 'M' ? 'male' : athlete.sex === 'F' ? 'female' : 'other';

    const profileUrl = new URL('/profile', request.url);
    profileUrl.searchParams.set('strava_connected', '1');
    profileUrl.searchParams.set('strava_id', String(stravaId));
    profileUrl.searchParams.set('name', fullName);
    profileUrl.searchParams.set('username', stravaUsername);
    profileUrl.searchParams.set('email', stravaEmail);
    profileUrl.searchParams.set('gender', gender);
    if (avatar) profileUrl.searchParams.set('avatar', avatar);

    return NextResponse.redirect(profileUrl);
  } catch (err: any) {
    console.error('Strava token exchange error:', err);
    return NextResponse.redirect(new URL('/profile?error=token_exchange_failed', request.url));
  }
}
