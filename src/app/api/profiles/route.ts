import { NextResponse } from 'next/server';
import { getServerProfiles, upsertServerProfile } from '@/lib/serverStore';

export async function GET() {
  try {
    const profiles = await getServerProfiles();
    return NextResponse.json({ success: true, profiles });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await request.json();
    if (!profile || !profile.id) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin profile' }, { status: 400 });
    }
    const updatedProfiles = await upsertServerProfile(profile);
    return NextResponse.json({ success: true, profiles: updatedProfiles });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
