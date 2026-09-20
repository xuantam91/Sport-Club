import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://btuobphacbpyxwpxlyhl.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dW9icGhhY2JweXh3cHhseWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NjY5MDYsImV4cCI6MjEwNTM0MjkwNn0.F7ST4AaOeLnDIPeMb1KCD4dpOmQqUD_YQNFyAzZvEFg';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-supabase-url'));
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
