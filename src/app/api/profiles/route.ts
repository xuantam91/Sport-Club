import { NextResponse } from 'next/server';
import { getServerProfiles, upsertServerProfile, deleteServerProfile } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get('id');
    let id = idFromQuery;

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID thành viên cần xóa' }, { status: 400 });
    }

    const updatedProfiles = await deleteServerProfile(id);
    return NextResponse.json({ success: true, profiles: updatedProfiles });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
