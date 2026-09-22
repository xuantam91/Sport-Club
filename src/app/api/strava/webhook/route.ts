import { NextResponse } from 'next/server';
import { getServerProfiles, syncAthleteStravaActivitiesOnServer } from '@/lib/serverStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const VERIFY_TOKEN = process.env.STRAVA_VERIFY_TOKEN || 'company_sports_verify_token_2026';

/**
 * Endpoint xác thực Webhook với Strava API (GET)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Strava Webhook Subscription verified!');
    return NextResponse.json({ 'hub.challenge': challenge }, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * Endpoint nhận sự kiện mới từ Strava (POST) - Tự động đồng bộ ngay lập tức
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('[Strava Webhook] Received event:', payload);

    // payload: { aspect_type: 'create' | 'update' | 'delete', object_type: 'activity', object_id: 123456, owner_id: 998811, ... }
    if (payload.object_type === 'activity') {
      const activityId = payload.object_id;
      const athleteStravaId = Number(payload.owner_id);

      if (payload.aspect_type === 'create' || payload.aspect_type === 'update') {
        const profiles = await getServerProfiles();
        const profile = profiles.find((p) => p.strava_id === athleteStravaId);

        if (profile) {
          console.log(`[Strava Webhook] Auto-syncing activities for athlete ${profile.full_name} (${athleteStravaId}) after activity #${activityId}...`);
          await syncAthleteStravaActivitiesOnServer(profile);
        } else {
          console.warn(`[Strava Webhook] Athlete Strava #${athleteStravaId} not found in system profiles.`);
        }
      } else if (payload.aspect_type === 'delete') {
        console.log(`[Strava Webhook] Deleting activity #${activityId}...`);
        if (isSupabaseConfigured() && supabase) {
          await supabase.from('activities').delete().eq('strava_activity_id', activityId);
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: any) {
    console.error('[Strava Webhook] Error processing event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

