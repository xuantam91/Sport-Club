-- ========================================================
-- SUPABASE DATABASE SCHEMA: DỰ ÁN WEB THỂ THAO CÔNG TY
-- Co-Created with Strava OAuth, Dynamic Rules & Leaderboards
-- ========================================================

-- 1. BẢNG SPORT RULES (Cấu hình hệ số điểm linh hoạt cho Admin)
CREATE TABLE IF NOT EXISTS public.sport_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT UNIQUE NOT NULL, -- 'Run', 'Ride', 'Walk', 'Hike', 'Swim'
  display_name TEXT NOT NULL,
  multiplier FLOAT NOT NULL DEFAULT 1.0, -- 1 km = X điểm
  min_pace INT DEFAULT 180, -- Pace tối thiểu (3 phút/km)
  max_pace INT DEFAULT 1200, -- Pace tối đa (20 phút/km)
  bonus_per_100m_elevation FLOAT DEFAULT 0.5,
  icon TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Khởi tạo dữ liệu mặc định cho Quy tắc điểm
INSERT INTO public.sport_rules (activity_type, display_name, multiplier, bonus_per_100m_elevation, icon)
VALUES 
  ('Run', 'Chạy bộ', 1.0, 0.5, '🏃'),
  ('Walk', 'Đi bộ', 0.6, 0.3, '🚶'),
  ('Hike', 'Leo núi', 0.8, 0.5, '🥾'),
  ('Ride', 'Đạp xe', 0.3, 0.2, '🚴'),
  ('Swim', 'Bơi lội', 4.0, 0.0, '🏊')
ON CONFLICT (activity_type) DO NOTHING;


-- 2. BẢNG TEAMS (Đội nhóm linh hoạt)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  description TEXT,
  leader_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. BẢNG PROFILES (Hồ sơ thành viên)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  avatar_url TEXT,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'organizer', 'captain', 'member'
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  strava_id BIGINT UNIQUE,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  strava_expires_at BIGINT,
  email_notifications BOOLEAN DEFAULT true,
  certificates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Đảm bảo bổ sung các cột nếu bảng đã tồn tại
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]'::jsonb;

-- Tạo liên kết foreign key leader_id cho bảng teams
ALTER TABLE public.teams 
  ADD CONSTRAINT fk_teams_leader 
  FOREIGN KEY (leader_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


-- 4. BẢNG ACTIVITIES (Nhật ký hoạt động Strava)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Run, Ride, Walk, Hike, Swim...
  distance FLOAT NOT NULL DEFAULT 0, -- Số mét
  moving_time INT NOT NULL DEFAULT 0, -- Số giây
  elapsed_time INT NOT NULL DEFAULT 0,
  total_elevation_gain FLOAT DEFAULT 0, -- Số mét leo dốc
  calculated_points FLOAT NOT NULL DEFAULT 0, -- Điểm tự động quy đổi
  start_date TIMESTAMPTZ NOT NULL,
  polyline TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_profile ON public.activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON public.activities(start_date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);


-- 5. FUNCTION & TRIGGER TỰ ĐỘNG TÍNH ĐIỂM KHI THÊM/SỬA BÀI TẬP
CREATE OR REPLACE FUNCTION calculate_activity_points()
RETURNS TRIGGER AS $$
DECLARE
  v_multiplier FLOAT := 1.0;
  v_bonus_elevation FLOAT := 0.5;
  v_km FLOAT;
  v_points FLOAT;
BEGIN
  -- Lấy quy tắc tính điểm theo loại thể thao
  SELECT multiplier, bonus_per_100m_elevation 
  INTO v_multiplier, v_bonus_elevation
  FROM public.sport_rules
  WHERE activity_type = NEW.type;

  IF v_multiplier IS NULL THEN
    v_multiplier := 1.0;
  END IF;

  v_km := NEW.distance / 1000.0;
  v_points := (v_km * v_multiplier) + ((NEW.total_elevation_gain / 100.0) * COALESCE(v_bonus_elevation, 0));

  NEW.calculated_points := ROUND(v_points::numeric, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_points ON public.activities;
CREATE TRIGGER trg_calculate_points
BEFORE INSERT OR UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION calculate_activity_points();


-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_rules ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai dữ liệu bảng xếp hạng
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public activities are viewable by everyone" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Public sport rules are viewable by everyone" ON public.sport_rules FOR SELECT USING (true);

-- Cho phép người dùng chỉnh sửa profile của chính mình
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);

-- Admin có quyền chỉnh sửa quy tắc tính điểm
CREATE POLICY "Admins can update sport rules" ON public.sport_rules FOR ALL USING (true);
