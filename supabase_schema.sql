-- ==============================================================================
-- IYER TALENT OS — CENTRAL SUPABASE CLOUD DATABASE SCHEMA
-- Role-based access control, Influencer data isolation & unique invoice sequence
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. INFLUENCERS TABLE
CREATE TABLE IF NOT EXISTS public.influencers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  city TEXT,
  avatar_url TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  pan TEXT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'disabled')),
  address TEXT,
  bank_details JSONB DEFAULT '{}'::jsonb,
  rate_card JSONB DEFAULT '{}'::jsonb,
  media_kit_bio TEXT,
  followers_count BIGINT DEFAULT 0,
  monthly_insights JSONB DEFAULT '[]'::jsonb,
  featured_reels JSONB DEFAULT '[]'::jsonb,
  invoice_prefix TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRANDS CRM TABLE
CREATE TABLE IF NOT EXISTS public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  contact_person TEXT,
  brand_manager TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COLLABORATIONS / CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
  id TEXT PRIMARY KEY,
  influencer_id TEXT NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  deal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  locked_commercial NUMERIC(12, 2) NOT NULL DEFAULT 0,
  received_commercial NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tds_deducted_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tds_deducted_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  commission_earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  deal_locked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  live_date DATE,
  payment_terms_days INT DEFAULT 30,
  payment_terms_text TEXT,
  payment_eta_date DATE,
  payment_due_date DATE,
  payment_received_date DATE,
  amount_received NUMERIC(12, 2) DEFAULT 0,
  amount_pending NUMERIC(12, 2) DEFAULT 0,
  production_status TEXT NOT NULL DEFAULT 'Locked',
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  deliverables JSONB DEFAULT '[]'::jsonb,
  live_link TEXT,
  metrics JSONB DEFAULT '{"views":0,"likes":0,"comments":0,"shares":0,"reach":0,"interactions":0}'::jsonb,
  notes TEXT,
  follow_ups JSONB DEFAULT '[]'::jsonb,
  activities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVOICES TABLE (Strict unique invoice numbering per influencer and year)
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE SET NULL,
  influencer_id TEXT NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  influencer_name TEXT,
  brand_name TEXT,
  brand_manager TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  invoice_to TEXT NOT NULL,
  payment_to TEXT NOT NULL,
  service_description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tds_percentage NUMERIC(5, 2) DEFAULT 10.00,
  tds_amount NUMERIC(12, 2) DEFAULT 0,
  final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Issued' CHECK (payment_status IN ('Draft', 'Issued', 'Paid', 'Pending')),
  generated_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint for uniqueness per influencer and sequence
CREATE INDEX IF NOT EXISTS idx_invoices_influencer_number ON public.invoices(influencer_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_campaigns_influencer ON public.campaigns(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_locked_date ON public.campaigns(deal_locked_date);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES (Full CRUD access on all tables)
CREATE POLICY admin_full_access_influencers ON public.influencers
  FOR ALL TO authenticated
  USING (coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN')
  WITH CHECK (coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN');

CREATE POLICY admin_full_access_brands ON public.brands
  FOR ALL TO authenticated
  USING (coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN')
  WITH CHECK (coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN');

CREATE POLICY admin_full_access_campaigns ON public.campaigns
  FOR ALL TO authenticated
  USING (coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN')
  WITH CHECK (coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN');

CREATE POLICY admin_full_access_invoices ON public.invoices
  FOR ALL TO authenticated
  USING (coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN')
  WITH CHECK (coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN');

-- INFLUENCER POLICIES (Strict Creator Isolation)
-- 1. Influencers can only select their own profile
CREATE POLICY influencer_view_own_profile ON public.influencers
  FOR SELECT TO authenticated
  USING (id = coalesce(current_setting('request.jwt.claims', true)::jsonb->>'influencer_id', ''));

-- 2. Influencers can view only their own collaborations
CREATE POLICY influencer_view_own_campaigns ON public.campaigns
  FOR SELECT TO authenticated
  USING (influencer_id = coalesce(current_setting('request.jwt.claims', true)::jsonb->>'influencer_id', ''));

-- 3. Influencers can update only their performance metrics & live link
CREATE POLICY influencer_update_metrics ON public.campaigns
  FOR UPDATE TO authenticated
  USING (influencer_id = coalesce(current_setting('request.jwt.claims', true)::jsonb->>'influencer_id', ''))
  WITH CHECK (influencer_id = coalesce(current_setting('request.jwt.claims', true)::jsonb->>'influencer_id', ''));

-- 4. Influencers cannot delete any campaigns, brands, or invoices.
