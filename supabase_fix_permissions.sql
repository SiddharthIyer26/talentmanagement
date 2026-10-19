-- ==============================================================================
-- UNLOCK ALL PERMISSIONS & DISABLE RLS (INSTANT FULL ACCESS FOR WEBSITE & DB)
-- ==============================================================================

-- 1. Grant full schema and table permissions to all roles (anon, authenticated, service_role)
GRANT USAGE, CREATE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Ensure future tables created also have full permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. Disable Row Level Security on all tables so nothing gets blocked
ALTER TABLE IF EXISTS public.management_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.influencers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_sequences DISABLE ROW LEVEL SECURITY;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
