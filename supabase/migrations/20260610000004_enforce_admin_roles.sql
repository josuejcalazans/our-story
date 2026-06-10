
-- Ensure RLS is enabled on all critical tables
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing permissive write policies if they exist to avoid conflicts
DO $$ BEGIN
    DROP POLICY IF EXISTS "admin write timeline" ON public.timeline_events;
    DROP POLICY IF EXISTS "admin write stats" ON public.stats;
    DROP POLICY IF EXISTS "admin write settings" ON public.site_settings;
    -- Also drop any generic authenticated write policies that might have been created by default
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.timeline_events;
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.timeline_events;
    DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.timeline_events;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 2. TIMELINE_EVENTS: Public Read, Admin Write
CREATE POLICY "Public Read Timeline" 
ON public.timeline_events FOR SELECT 
USING (true);

CREATE POLICY "Admin Write Timeline" 
ON public.timeline_events FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. STATS: Public Read, Admin Write
CREATE POLICY "Public Read Stats" 
ON public.stats FOR SELECT 
USING (true);

CREATE POLICY "Admin Write Stats" 
ON public.stats FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. SITE_SETTINGS: Public Read, Admin Write
CREATE POLICY "Public Read Settings" 
ON public.site_settings FOR SELECT 
USING (true);

CREATE POLICY "Admin Write Settings" 
ON public.site_settings FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. USER_ROLES: Users read own, Admin write all (essential for managing permissions)
DO $$ BEGIN
    DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users read own roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin manage roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
