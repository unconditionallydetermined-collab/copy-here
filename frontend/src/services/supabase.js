import { createClient } from '@supabase/supabase-js'

// Fallbacks keep the app from crashing to a blank page when env vars are missing.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://qbthhnmzjkjvyfpkuddu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'missing-anon-key'

export const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

if (!isSupabaseConfigured) {
  console.warn('[Career Sync] VITE_SUPABASE_ANON_KEY is not set — sign-in will not work until it is configured.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
