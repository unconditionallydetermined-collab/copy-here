-- Migration: Debug Logging System
-- Created: 2026-10-07
-- Description: Creates debug_logs and debug_admins tables with RLS and automated 14-day retention

-- 1. Create debug_admins table for role-based viewing access
CREATE TABLE IF NOT EXISTS public.debug_admins (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on debug_admins
ALTER TABLE public.debug_admins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check if their own email is an admin
CREATE POLICY "Allow users to read their own admin entry"
    ON public.debug_admins
    FOR SELECT
    TO authenticated
    USING (email = (auth.jwt() ->> 'email'));

-- 2. Create debug_logs table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL,
    area TEXT,
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID NULL,
    session_id TEXT,
    route TEXT,
    user_agent TEXT
);

-- 3. Create index on created_at for fast descending queries and efficient cleanup
CREATE INDEX IF NOT EXISTS idx_debug_logs_created_at ON public.debug_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON public.debug_logs (level);
CREATE INDEX IF NOT EXISTS idx_debug_logs_area ON public.debug_logs (area);
CREATE INDEX IF NOT EXISTS idx_debug_logs_user_id ON public.debug_logs (user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

-- INSERT Policy: Allow anyone (authenticated or anonymous) to insert debug logs
CREATE POLICY "Allow anyone to insert debug logs"
    ON public.debug_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- SELECT Policy: Only users whose email is registered in debug_admins can query logs
CREATE POLICY "Allow debug admins to read logs"
    ON public.debug_logs
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM public.debug_admins)
    );

-- 5. Data retention function (deletes records older than 14 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_debug_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.debug_logs
    WHERE created_at < (NOW() - INTERVAL '14 days');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note for Supabase pg_cron (if extension is enabled):
-- SELECT cron.schedule('cleanup-debug-logs-nightly', '0 3 * * *', 'SELECT public.cleanup_old_debug_logs()');
