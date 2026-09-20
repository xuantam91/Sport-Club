import { NextResponse } from 'next/server';
import { getServerTeams, upsertServerTeam } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const teams = await getServerTeams();
    return NextResponse.json({ success: true, teams });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const team = await request.json();
    if (!team || !team.id || !team.name) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin đội nhóm' }, { status: 400 });
    }
    const updatedTeams = await upsertServerTeam(team);
    return NextResponse.json({ success: true, teams: updatedTeams });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
