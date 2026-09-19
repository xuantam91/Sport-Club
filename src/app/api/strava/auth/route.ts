import { NextResponse } from 'next/server';
import { getStravaOAuthUrl } from '@/lib/strava';

export async function GET(request: Request) {
  const host = request.headers.get('host') || 'gsc-sport.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/strava/callback`;

  const url = getStravaOAuthUrl(redirectUri);
  return NextResponse.redirect(url);
}
