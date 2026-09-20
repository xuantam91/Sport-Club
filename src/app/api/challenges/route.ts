import { NextResponse } from 'next/server';
import { getServerChallenges, upsertServerChallenge } from '@/lib/serverStore';
import { Challenge } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const challenges = await getServerChallenges();
    return NextResponse.json({ success: true, challenges });
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Hỗ trợ trường hợp join/leave nhanh
    if (body.challengeId && (body.joinUserId || body.leaveUserId)) {
      const challenges = await getServerChallenges();
      const targetCh = challenges.find((c) => c.id === body.challengeId);
      if (targetCh) {
        let participants = Array.isArray(targetCh.participant_ids) ? [...targetCh.participant_ids] : [];
        if (body.joinUserId && !participants.includes(body.joinUserId)) {
          participants.push(body.joinUserId);
        }
        if (body.leaveUserId) {
          participants = participants.filter((id) => id !== body.leaveUserId);
        }
        const updatedCh: Challenge = { ...targetCh, participant_ids: participants };
        const updatedList = await upsertServerChallenge(updatedCh);
        return NextResponse.json({ success: true, challenges: updatedList });
      }
    }

    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin giải đấu bắt buộc' }, { status: 400 });
    }

    const challengeToSave: Challenge = {
      id: body.id || `ch-${Date.now()}`,
      title: body.title,
      description: body.description || '',
      type: body.type || 'Run',
      target_km: Number(body.target_km) || 100,
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      end_date: body.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      banner_url: body.banner_url || '/images/cisco_sports_hero.jpg',
      status: body.status || 'active',
      participant_ids: Array.isArray(body.participant_ids) ? body.participant_ids : [],
    };

    const updatedChallenges = await upsertServerChallenge(challengeToSave);
    return NextResponse.json({ success: true, challenges: updatedChallenges });
  } catch (error: any) {
    console.error('Error upserting challenge:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
