import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // 1. Dọn dẹp Supabase Cloud
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('activities').delete().neq('id', 'placeholder-none');
      await supabase.from('profiles').delete().neq('id', 'placeholder-none');
    }

    // 2. Dọn dẹp file local
    const dataDir = path.join(process.cwd(), 'data');
    const profilesFile = path.join(dataDir, 'profiles.json');
    const activitiesFile = path.join(dataDir, 'activities.json');

    try {
      if (fs.existsSync(profilesFile)) fs.writeFileSync(profilesFile, '[]', 'utf-8');
      if (fs.existsSync(activitiesFile)) fs.writeFileSync(activitiesFile, '[]', 'utf-8');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Đã dọn sạch toàn bộ dữ liệu VĐV và Bài tập trên Cloud Database!',
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
