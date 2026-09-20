import { NextResponse } from 'next/server';
import { getServerSportRules, saveServerSportRules } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rules = await getServerSportRules();
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error('Error fetching sport rules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rulesToSave = Array.isArray(body) ? body : body.rules;

    if (!Array.isArray(rulesToSave)) {
      return NextResponse.json({ success: false, error: 'Dữ liệu quy tắc không hợp lệ' }, { status: 400 });
    }

    const updatedRules = await saveServerSportRules(rulesToSave);
    return NextResponse.json({ success: true, rules: updatedRules });
  } catch (error: any) {
    console.error('Error updating sport rules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
