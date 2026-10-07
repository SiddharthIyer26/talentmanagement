-- ==============================================================================
-- IYER TALENT OS — ENTERPRISE SUPABASE CLOUD DATABASE SCHEMA
-- Strict Zero-Trust Security, Authenticated Role-Based Access Control,
-- Creator Isolation, Per-Influencer Annual Invoice Sequence, and Data Protection Triggers.
-- Optimized for clean top-to-bottom execution on a fresh Supabase PostgreSQL project.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE UTILITY FUNCTIONS (Independent)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. BASE TABLES (Primary Entities without Foreign Keys)
-- ==============================================================================

-- 3.1 MANAGEMENT / ADMIN USERS TABLE
-- Cloud authentication is managed exclusively by Supabase Auth (auth.users).
CREATE TABLE IF NOT EXISTS public.management_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  username TEXT NOT NULL UNIQUE,
  password TEXT, -- Local-storage offline fallback only; cloud auth exclusively uses Supabase Auth
  role TEXT NOT NULL DEFAULT 'Talent Manager' CHECK (role IN ('Owner', 'Partner', 'Talent Manager')),
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 INFLUENCERS TABLE
-- Cloud authentication is managed exclusively by Supabase Auth (auth.users).
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
  password TEXT, -- Local-storage offline fallback only; cloud auth exclusively uses Supabase Auth
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

-- 3.3 BRANDS CRM TABLE
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

-- 3.4 EXPENSES TABLE (Agency & Operational Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Software', 'Travel', 'Equipment', 'Agency Fee', 'Misc')),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. SECURITY & AUTH HELPER FUNCTIONS (Depends on management_users & influencers)
-- Must be created BEFORE any view, trigger, or RLS policy that references them.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  current_email TEXT;
BEGIN
  -- Safe bootstrap: if management_users table is empty, allow authenticated user to initialize/seed data
  IF NOT EXISTS (SELECT 1 FROM public.management_users) THEN
    RETURN (auth.role() = 'authenticated');
  END IF;

  IF coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'ADMIN'
     OR coalesce(auth.jwt()->'user_metadata'->>'role', '') = 'ADMIN'
     OR coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN' THEN
    RETURN TRUE;
  END IF;

  current_email := coalesce(auth.email(), auth.jwt()->>'email', '');
  IF current_email = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.management_users
    WHERE LOWER(email) = LOWER(current_email) AND account_status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_influencer_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  inf_id TEXT;
  current_email TEXT;
BEGIN
  inf_id := coalesce(auth.jwt()->'user_metadata'->>'influencer_id', '');
  IF inf_id <> '' THEN
    RETURN inf_id;
  END IF;

  inf_id := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'influencer_id', '');
  IF inf_id <> '' THEN
    RETURN inf_id;
  END IF;

  current_email := coalesce(auth.email(), auth.jwt()->>'email', '');
  IF current_email <> '' THEN
    SELECT id INTO inf_id FROM public.influencers
    WHERE LOWER(email) = LOWER(current_email) AND account_status = 'active'
    LIMIT 1;
  END IF;

  RETURN coalesce(inf_id, '');
END;
$$;

-- Secure helper function for authenticated users to safely resolve their own management profile
CREATE OR REPLACE FUNCTION public.get_current_management_user()
RETURNS SETOF public.management_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  current_email TEXT;
BEGIN
  current_email := coalesce(auth.email(), auth.jwt()->>'email', '');
  IF current_email = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT * FROM public.management_users
  WHERE LOWER(email) = LOWER(current_email) AND account_status = 'active'
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_current_management_user() TO authenticated;

-- Secure helper function for authenticated users to safely resolve their own influencer profile
CREATE OR REPLACE FUNCTION public.get_current_influencer_user()
RETURNS SETOF public.influencers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  current_email TEXT;
  target_id TEXT;
BEGIN
  target_id := public.current_influencer_id();
  IF target_id <> '' THEN
    RETURN QUERY
    SELECT * FROM public.influencers
    WHERE id = target_id AND account_status = 'active'
    LIMIT 1;
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  current_email := coalesce(auth.email(), auth.jwt()->>'email', '');
  IF current_email = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT * FROM public.influencers
  WHERE LOWER(email) = LOWER(current_email) AND account_status = 'active'
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_current_influencer_user() TO authenticated;

-- Resolves username or handle to user email for Supabase Auth signInWithPassword
CREATE OR REPLACE FUNCTION public.resolve_login_email(p_identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  v_clean TEXT;
  v_email TEXT;
BEGIN
  v_clean := LOWER(TRIM(p_identifier));
  IF v_clean = '' THEN
    RETURN NULL;
  END IF;

  -- 1. If it's already an email, verify existence and active status
  IF v_clean LIKE '%@%' THEN
    SELECT email INTO v_email FROM public.management_users WHERE LOWER(email) = v_clean AND account_status = 'active' LIMIT 1;
    IF v_email IS NOT NULL THEN RETURN v_email; END IF;

    SELECT email INTO v_email FROM public.influencers WHERE LOWER(email) = v_clean AND account_status = 'active' LIMIT 1;
    IF v_email IS NOT NULL THEN RETURN v_email; END IF;

    RETURN v_clean;
  END IF;

  -- 2. Resolve management_users by username
  SELECT email INTO v_email FROM public.management_users
  WHERE LOWER(username) = v_clean AND account_status = 'active'
  LIMIT 1;
  IF v_email IS NOT NULL THEN RETURN v_email; END IF;

  -- 3. Resolve influencers by username or handle (strip leading '@')
  v_clean := REGEXP_REPLACE(v_clean, '^@', '');
  SELECT email INTO v_email FROM public.influencers
  WHERE (LOWER(username) = v_clean OR LOWER(REGEXP_REPLACE(handle, '^@', '')) = v_clean)
    AND account_status = 'active'
  LIMIT 1;
  IF v_email IS NOT NULL THEN RETURN v_email; END IF;

  RETURN NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon, authenticated;

-- (Authentication provisioning and password updates are handled exclusively via Supabase Edge Functions with Supabase Auth Admin API)

-- ==============================================================================
-- 5. SECURE VIEWS (Depends on public.brands and public.is_admin())
-- ==============================================================================

-- Masks sensitive internal notes and contact details for Creators
CREATE OR REPLACE VIEW public.brands_directory WITH (security_invoker = false) AS
SELECT
  id,
  name,
  logo_url,
  brand_manager,
  CASE WHEN public.is_admin() THEN contact_person ELSE NULL END AS contact_person,
  CASE WHEN public.is_admin() THEN email ELSE NULL END AS email,
  CASE WHEN public.is_admin() THEN phone ELSE NULL END AS phone,
  CASE WHEN public.is_admin() THEN notes ELSE NULL END AS notes,
  created_at,
  updated_at
FROM public.brands;

-- Grant read access on the masked view to authenticated users
GRANT SELECT ON public.brands_directory TO authenticated;

-- ==============================================================================
-- 6. RELATIONAL TABLES (Depends on influencers and brands)
-- ==============================================================================

-- 6.1 COLLABORATIONS / CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
  id TEXT PRIMARY KEY,
  influencer_id TEXT REFERENCES public.influencers(id) ON DELETE SET NULL,
  talent_type TEXT NOT NULL DEFAULT 'exclusive' CHECK (talent_type IN ('exclusive', 'non_exclusive')),
  non_exclusive_talent JSONB DEFAULT NULL,
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
  campaign_start_date DATE,
  content_deadline DATE,
  go_live_date DATE,
  content_live_date DATE,
  invoice_submitted_date DATE,
  payment_terms_days INT DEFAULT 30,
  payment_terms_text TEXT,
  payment_eta_date DATE,
  payment_eta_notes TEXT,
  payment_due_date DATE,
  calculated_due_date DATE,
  payment_received_date DATE,
  amount_received NUMERIC(12, 2) DEFAULT 0,
  amount_pending NUMERIC(12, 2) DEFAULT 0,
  payment_notes TEXT,
  production_status TEXT NOT NULL DEFAULT 'Locked',
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  deliverables JSONB DEFAULT '[]'::jsonb,
  live_link TEXT,
  tracking_link TEXT,
  contact_person TEXT,
  contact_number TEXT,
  contact_email TEXT,
  brand_manager TEXT,
  usage_rights TEXT,
  ad_rights TEXT,
  notes TEXT,
  internal_notes TEXT,
  metrics JSONB DEFAULT '{"views":0,"likes":0,"comments":0,"shares":0,"reach":0,"interactions":0}'::jsonb,
  follow_ups JSONB DEFAULT '[]'::jsonb,
  activities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 INVOICES TABLE (Strict unique invoice numbering per influencer and year)
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE SET NULL,
  influencer_id TEXT NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  influencer_name TEXT,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE SET NULL,
  brand_name TEXT,
  brand_manager TEXT,
  client_name TEXT,
  client_address TEXT,
  client_gstin TEXT,
  campaign_name TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  invoice_to TEXT,
  payment_to TEXT,
  service_description TEXT,
  quantity INT DEFAULT 1,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tds_percentage NUMERIC(5, 2) DEFAULT 10.00,
  tds_amount NUMERIC(12, 2) DEFAULT 0,
  final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_due NUMERIC(12, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Issued' CHECK (payment_status IN ('Draft', 'Issued', 'Paid', 'Pending')),
  generated_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 NOTIFICATIONS TABLE (Payment reminders, deadlines, and approvals)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('PAYMENT_DUE', 'APPROVAL_NEEDED', 'LIVE_DATE', 'FOLLOWUP_DUE')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  urgency TEXT CHECK (urgency IN ('Upcoming', 'Due Soon', 'Due Today', 'Overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.4 INVOICE SEQUENCES TABLE
-- Tracks sequences independently per influencer and resets every calendar year.
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  influencer_id TEXT NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  year INT NOT NULL,
  last_sequence INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (influencer_id, year)
);

-- ==============================================================================
-- 7. BUSINESS LOGIC & DATA INTEGRITY FUNCTIONS (Depends on tables & is_admin)
-- ==============================================================================

-- 7.1 ATOMIC PER-INFLUENCER ANNUAL INVOICE NUMBER GENERATOR
-- Formats strictly as: [first 2 letters of influencer]-[year]-[4 digit sequence]
-- Example: JD-2026-0001, TC-2026-0001, JD-2027-0001
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(
  p_influencer_id TEXT,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT
)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next_seq INT;
  v_invoice_number TEXT;
BEGIN
  -- 1. Resolve influencer prefix (invoice_prefix column or first 2 letters of creator name)
  SELECT UPPER(COALESCE(NULLIF(TRIM(invoice_prefix), ''), SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g') FROM 1 FOR 2), 'IN'))
  INTO v_prefix
  FROM public.influencers
  WHERE id = p_influencer_id;

  IF v_prefix IS NULL OR LENGTH(v_prefix) < 2 THEN
    v_prefix := 'IN';
  END IF;

  -- 2. Upsert and atomically increment sequence for (influencer_id, year)
  INSERT INTO public.invoice_sequences (influencer_id, year, last_sequence)
  VALUES (p_influencer_id, p_year, 1)
  ON CONFLICT (influencer_id, year)
  DO UPDATE SET last_sequence = public.invoice_sequences.last_sequence + 1,
                updated_at = NOW()
  RETURNING last_sequence INTO v_next_seq;

  -- 3. Format as [PREFIX]-[YEAR]-[0001]
  v_invoice_number := v_prefix || '-' || p_year::TEXT || '-' || LPAD(v_next_seq::TEXT, 4, '0');
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 DATA INTEGRITY FUNCTION: Restrict Influencer Profile Updates
-- Creators can update creative/bio/media kit info, but CANNOT modify sensitive/admin fields.
CREATE OR REPLACE FUNCTION public.protect_influencer_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.id <> OLD.id OR
       NEW.account_status <> OLD.account_status OR
       NEW.handle <> OLD.handle OR
       NEW.pan IS DISTINCT FROM OLD.pan OR
       NEW.bank_details IS DISTINCT FROM OLD.bank_details OR
       NEW.invoice_prefix IS DISTINCT FROM OLD.invoice_prefix OR
       NEW.password IS DISTINCT FROM OLD.password THEN
      RAISE EXCEPTION 'Unauthorized: Creators cannot modify sensitive or administrative profile fields (status, credentials, bank details, PAN, invoice prefix). Please contact talent manager.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3 DATA INTEGRITY FUNCTION: Restrict Influencer Campaign Updates
-- Creators can ONLY update metrics, live links, and tracking links. They CANNOT alter commercials, terms, or statuses.
CREATE OR REPLACE FUNCTION public.protect_campaign_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.id <> OLD.id OR
       NEW.influencer_id <> OLD.influencer_id OR
       NEW.brand_id IS DISTINCT FROM OLD.brand_id OR
       NEW.brand_name <> OLD.brand_name OR
       NEW.campaign_name <> OLD.campaign_name OR
       NEW.deal_amount <> OLD.deal_amount OR
       NEW.locked_commercial <> OLD.locked_commercial OR
       NEW.received_commercial <> OLD.received_commercial OR
       NEW.tds_deducted_amount <> OLD.tds_deducted_amount OR
       NEW.tds_deducted_percentage <> OLD.tds_deducted_percentage OR
       NEW.commission_earned <> OLD.commission_earned OR
       NEW.commission_percentage <> OLD.commission_percentage OR
       NEW.deal_locked_date <> OLD.deal_locked_date OR
       NEW.payment_terms_days <> OLD.payment_terms_days OR
       NEW.payment_terms_text IS DISTINCT FROM OLD.payment_terms_text OR
       NEW.payment_status <> OLD.payment_status OR
       NEW.production_status <> OLD.production_status OR
       NEW.amount_received <> OLD.amount_received OR
       NEW.amount_pending <> OLD.amount_pending OR
       NEW.usage_rights IS DISTINCT FROM OLD.usage_rights OR
       NEW.ad_rights IS DISTINCT FROM OLD.ad_rights OR
       NEW.internal_notes IS DISTINCT FROM OLD.internal_notes OR
       NEW.payment_notes IS DISTINCT FROM OLD.payment_notes THEN
      RAISE EXCEPTION 'Unauthorized: Creators may only update performance metrics, live links, and tracking links.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_influencer_number ON public.invoices(influencer_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_campaign ON public.invoices(campaign_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_influencer ON public.campaigns(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_payment_status ON public.campaigns(payment_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_production_status ON public.campaigns(production_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_locked_date ON public.campaigns(deal_locked_date);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(read, timestamp);

-- ==============================================================================
-- 9. AUTOMATED TRIGGERS
-- ==============================================================================

-- 9.1 Automated updated_at triggers
DROP TRIGGER IF EXISTS trg_mgmt_users_updated_at ON public.management_users;
CREATE TRIGGER trg_mgmt_users_updated_at
  BEFORE UPDATE ON public.management_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_influencers_updated_at ON public.influencers;
CREATE TRIGGER trg_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_brands_updated_at ON public.brands;
CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9.2 Data Protection Triggers
DROP TRIGGER IF EXISTS trg_protect_influencer_fields ON public.influencers;
CREATE TRIGGER trg_protect_influencer_fields
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW EXECUTE FUNCTION public.protect_influencer_fields();

DROP TRIGGER IF EXISTS trg_protect_campaign_fields ON public.campaigns;
CREATE TRIGGER trg_protect_campaign_fields
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.protect_campaign_fields();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Zero Trust: Enable RLS on every table. Unauthenticated/anon users have NO ACCESS by default.
-- ==============================================================================
ALTER TABLE public.management_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

-- 10.1 MANAGEMENT USERS:
-- Authenticated users can safely view their own management profile without recursive RLS
DROP POLICY IF EXISTS mgmt_users_select_own ON public.management_users;
CREATE POLICY mgmt_users_select_own ON public.management_users
  FOR SELECT TO authenticated
  USING (
    LOWER(email) = LOWER(coalesce(auth.email(), auth.jwt()->>'email', ''))
    AND account_status = 'active'
  );

-- Admins can view and manage all management team accounts
DROP POLICY IF EXISTS admin_mgmt_users_all ON public.management_users;
CREATE POLICY admin_mgmt_users_all ON public.management_users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10.2 INFLUENCERS:
-- - Admins have full access
-- - Influencers can view and update their own profile (trigger guards sensitive fields)
DROP POLICY IF EXISTS admin_influencers_all ON public.influencers;
CREATE POLICY admin_influencers_all ON public.influencers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS influencer_view_own_profile ON public.influencers;
CREATE POLICY influencer_view_own_profile ON public.influencers
  FOR SELECT TO authenticated
  USING (
    id = public.current_influencer_id()
    OR (LOWER(email) = LOWER(coalesce(auth.email(), auth.jwt()->>'email', '')) AND account_status = 'active')
  );

DROP POLICY IF EXISTS influencer_update_own_profile ON public.influencers;
CREATE POLICY influencer_update_own_profile ON public.influencers
  FOR UPDATE TO authenticated
  USING (id = public.current_influencer_id())
  WITH CHECK (id = public.current_influencer_id());

-- 10.3 BRANDS: Strictly Admin-only for all operations (SELECT, INSERT, UPDATE, DELETE).
-- Influencers have NO direct table access to public.brands and must query the masked public.brands_directory view.
DROP POLICY IF EXISTS admin_brands_all ON public.brands;
CREATE POLICY admin_brands_all ON public.brands
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10.4 CAMPAIGNS / COLLABORATIONS:
-- - Admins have full access
-- - Influencers can view only their own collaborations
-- - Influencers can update only metrics & live links on their own collaborations (trigger guards commercials)
DROP POLICY IF EXISTS admin_campaigns_all ON public.campaigns;
CREATE POLICY admin_campaigns_all ON public.campaigns
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS influencer_view_own_campaigns ON public.campaigns;
CREATE POLICY influencer_view_own_campaigns ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    influencer_id IS NOT NULL 
    AND influencer_id <> '' 
    AND influencer_id = public.current_influencer_id()
  );

DROP POLICY IF EXISTS influencer_update_metrics ON public.campaigns;
CREATE POLICY influencer_update_metrics ON public.campaigns
  FOR UPDATE TO authenticated
  USING (
    influencer_id IS NOT NULL 
    AND influencer_id <> '' 
    AND influencer_id = public.current_influencer_id()
  )
  WITH CHECK (
    influencer_id IS NOT NULL 
    AND influencer_id <> '' 
    AND influencer_id = public.current_influencer_id()
  );

-- 10.5 INVOICES:
-- - Admins have full access
-- - Influencers can view only their own invoices
DROP POLICY IF EXISTS admin_invoices_all ON public.invoices;
CREATE POLICY admin_invoices_all ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS influencer_view_own_invoices ON public.invoices;
CREATE POLICY influencer_view_own_invoices ON public.invoices
  FOR SELECT TO authenticated
  USING (influencer_id = public.current_influencer_id());

-- 10.6 EXPENSES: Only authenticated Admins can view and manage expenses
DROP POLICY IF EXISTS admin_expenses_all ON public.expenses;
CREATE POLICY admin_expenses_all ON public.expenses
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10.7 NOTIFICATIONS:
-- - Admins have full access
-- - Influencers can view only notifications attached to their campaigns
DROP POLICY IF EXISTS admin_notifications_all ON public.notifications;
CREATE POLICY admin_notifications_all ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS influencer_view_own_notifications ON public.notifications;
CREATE POLICY influencer_view_own_notifications ON public.notifications
  FOR SELECT TO authenticated
  USING (
    campaign_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = notifications.campaign_id AND campaigns.influencer_id = public.current_influencer_id()
    )
  );

-- 10.8 INVOICE SEQUENCES: Only authenticated Admins have direct table access; generator function is SECURITY DEFINER
DROP POLICY IF EXISTS admin_invoice_sequences_all ON public.invoice_sequences;
CREATE POLICY admin_invoice_sequences_all ON public.invoice_sequences
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- (NO POLICIES ARE DEFINED FOR 'anon'. All unauthenticated requests are strictly rejected by PostgreSQL RLS)

-- 10.9 SERVER-SIDE SERVICE-ROLE TABLE GRANTS
-- Strictly grants server-side administrative access to service_role (used exclusively by Supabase Edge Functions).
-- Frontend 'anon' and 'authenticated' roles remain strictly blocked.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.management_users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.influencers TO service_role;

-- ==============================================================================
-- 11. IDEMPOTENT WORKSPACE PROVISIONING & PRODUCTION AUTH SEEDING
-- Safely ensures existing Management and Influencer workspace accounts are provisioned
-- in both public tables and Supabase Auth (auth.users).
-- ZERO DATA OVERWRITES: Uses ON CONFLICT DO NOTHING to preserve all production records.
-- ==============================================================================

-- 11.1 Ensure active management users exist in public.management_users
INSERT INTO public.management_users (id, name, email, phone, username, password, role, account_status)
VALUES 
  ('mgmt-1', 'Siddharth Iyer', 'siddharthiyer.work@gmail.com', '+91 98765 43210', 'admin', NULL, 'Owner', 'active'),
  ('mgmt-2', 'Rahul Varma', 'rahul@iyer.tech', '+91 98123 45678', 'partner1', NULL, 'Partner', 'active')
ON CONFLICT (email) DO UPDATE SET
  account_status = 'active',
  updated_at = NOW();

-- 11.2 Ensure existing core influencers exist in public.influencers
INSERT INTO public.influencers (
  id, name, handle, city, avatar_url, bio, email, phone, pan, username, password, account_status, address, invoice_prefix
) VALUES
  ('inf-1', 'JD Tech', '@jdtech_official', 'Bengaluru, India', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', 'Deep-dive technology analyst & AI workflow reviews.', 'collabs@jdtech.in', '+91 98765 43210', 'ABCDE1234F', 'jdtech', NULL, 'active', 'Suite 402, Cyber Heights, Indiranagar, Bengaluru - 560038', 'JD'),
  ('inf-2', 'TechCraft Pro (Aarav Sharma)', '@techcraft_aarav', 'Delhi NCR, India', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', 'Custom PC builder & hardware benchmarking specialist.', 'aarav@techcraftpro.com', '+91 98111 22334', 'BCDEF2345G', 'techcraft', NULL, 'active', '72 Cyber City, Sector 24, Gurugram - 122002', 'TC'),
  ('inf-3', 'GadgetVision (Priya Nair)', '@gadgetvision_priya', 'Mumbai, India', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80', 'Consumer audio & wearable lifestyle tech reviews.', 'priya@gadgetvision.in', '+91 97654 32109', 'CDEFG3456H', 'gadgetvision', NULL, 'active', '14 Bandra Kurla Complex, Mumbai - 400051', 'GV'),
  ('inf-4', 'FutureByte (Rohan Mehta)', '@futurebyte_rohan', 'Hyderabad, India', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', 'DevOps tools, cloud infrastructure & AI assistants.', 'rohan@futurebyte.io', '+91 99887 76655', 'DEFGH4567I', 'futurebyte', NULL, 'active', 'Gachibowli Tech Hub, Hyderabad - 500032', 'FB'),
  ('inf-5', 'VoltTech (Ananya Gupta)', '@volttech_ananya', 'Pune, India', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80', 'EV technology, solar ecosystems & smart home automation.', 'ananya@volttech.in', '+91 95432 10987', 'EFGHI5678J', 'volttech', NULL, 'active', 'Viman Nagar Tech Park, Pune - 411014', 'VT')
ON CONFLICT (id) DO UPDATE SET
  account_status = 'active',
  email = COALESCE(NULLIF(public.influencers.email, ''), EXCLUDED.email),
  updated_at = NOW();

-- ==============================================================================
-- 12. IDEMPOTENT MIGRATIONS FOR EXISTING DEPLOYMENTS
-- Safely applies schema enhancements to existing production databases without data loss.
-- ==============================================================================

-- 12.1 Non-Exclusive Talents support in campaigns
DO $$
BEGIN
  -- Make influencer_id nullable for non-exclusive campaigns
  ALTER TABLE public.campaigns ALTER COLUMN influencer_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS talent_type TEXT NOT NULL DEFAULT 'exclusive' CHECK (talent_type IN ('exclusive', 'non_exclusive'));

ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS non_exclusive_talent JSONB DEFAULT NULL;

-- Safely backfill any pre-existing campaigns without a talent_type to 'exclusive'
UPDATE public.campaigns 
SET talent_type = 'exclusive' 
WHERE talent_type IS NULL;

-- 12.2 Enable Supabase Realtime replication on core production tables for cross-device sync
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.influencers;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;



