import { createClient } from '@supabase/supabase-js'

// Fallbacks keep the app from crashing to a blank page when env vars are missing.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://qbthhnmzjkjvyfpkuddu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidGhobm16amtqdnlmcGt1ZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODc1MzcsImV4cCI6MjEwNjg2MzUzN30.UeSnNXSE6YFGsu0zUVcwtGoN3l9UPRaLorcauYGVEl8'

export const isSupabaseConfigured = Boolean(supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn('[Career Sync] VITE_SUPABASE_ANON_KEY is not set — sign-in will not work until it is configured.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
