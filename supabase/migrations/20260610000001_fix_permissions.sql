
-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Fix has_role function to handle null and ensure it's executable
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = _role
  )
$$;

-- Explicitly grant execute permission
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO anon, authenticated;

-- Ensure authenticated role can read user_roles for the function to work (SECURITY DEFINER handles this, but good to have)
GRANT SELECT ON public.user_roles TO authenticated;
