import { NextResponse } from 'next/server';
import { getServerActivities, upsertServerActivities } from '@/lib/serverStore';

export async function GET() {
  try {
    const activities = await getServerActivities();
    return NextResponse.json({ success: true, activities });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { activities } = await request.json();
    if (!Array.isArray(activities)) {
      return NextResponse.json({ success: false, error: 'Dữ liệu activities phải là danh sách' }, { status: 400 });
    }
    const updatedActivities = await upsertServerActivities(activities);
    return NextResponse.json({ success: true, activities: updatedActivities });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
