-- ========================================================
-- CHẠY SCRIPT NÀY TRONG SUPABASE SQL EDITOR ĐỂ SỬA LỖI UUID & CẤP QUYỀN
-- ========================================================

-- 1. Tạm gỡ bỏ các ràng buộc khóa ngoại cũ
ALTER TABLE IF EXISTS public.activities DROP CONSTRAINT IF EXISTS activities_profile_id_fkey;
ALTER TABLE IF EXISTS public.teams DROP CONSTRAINT IF EXISTS fk_teams_leader;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_team_id_fkey;

-- 2. Đổi kiểu dữ liệu id sang TEXT để nhận ID VĐV Strava (usr-strava-...)
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS public.teams ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS public.teams ALTER COLUMN leader_id TYPE TEXT;
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN team_id TYPE TEXT;
ALTER TABLE IF EXISTS public.activities ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS public.activities ALTER COLUMN profile_id TYPE TEXT;

-- 3. Tạo lại các ràng buộc khóa ngoại với kiểu TEXT
ALTER TABLE IF EXISTS public.profiles 
  ADD CONSTRAINT profiles_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.activities 
  ADD CONSTRAINT activities_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.teams 
  ADD CONSTRAINT fk_teams_leader 
  FOREIGN KEY (leader_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Bật quyền INSERT/UPDATE/SELECT đầy đủ cho ứng dụng Web (Anon Key)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for profiles" ON public.profiles;
CREATE POLICY "Allow all for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public activities are viewable by everyone" ON public.activities;
DROP POLICY IF EXISTS "Allow all for activities" ON public.activities;
CREATE POLICY "Allow all for activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public teams are viewable by everyone" ON public.teams;
DROP POLICY IF EXISTS "Allow all for teams" ON public.teams;
CREATE POLICY "Allow all for teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public sport rules are viewable by everyone" ON public.sport_rules;
DROP POLICY IF EXISTS "Admins can update sport rules" ON public.sport_rules;
DROP POLICY IF EXISTS "Allow all for sport rules" ON public.sport_rules;
CREATE POLICY "Allow all for sport rules" ON public.sport_rules FOR ALL USING (true) WITH CHECK (true);
