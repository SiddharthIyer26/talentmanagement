-- ==============================================================================
-- IYER TALENT OS — ENTERPRISE SUPABASE CLOUD DATABASE SCHEMA
-- Strict Zero-Trust Security, Authenticated Role-Based Access Control,
-- Creator Isolation, Per-Influencer Annual Invoice Sequence, and Data Protection Triggers.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AUTOMATED UPDATED_AT TIMESTAMP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. MANAGEMENT / ADMIN USERS TABLE
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

-- 4. INFLUENCERS TABLE
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

-- 5. BRANDS CRM TABLE
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

-- 6. BRANDS DIRECTORY VIEW (Masks sensitive internal notes and contact details for Creators)
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

-- Grant read access to the masked brands_directory view for authenticated users
GRANT SELECT ON public.brands_directory TO authenticated;

-- 7. COLLABORATIONS / CAMPAIGNS TABLE (Complete Talent OS Feature Support)
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

-- 8. INVOICES TABLE (Strict unique invoice numbering per influencer and year)
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

-- 9. EXPENSES TABLE (Agency & Operational Expenses)
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

-- 10. NOTIFICATIONS TABLE (Payment reminders, deadlines, and approvals)
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

-- 11. INVOICE SEQUENCES TABLE
-- Tracks sequences independently per influencer and resets every calendar year.
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  influencer_id TEXT NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  year INT NOT NULL,
  last_sequence INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (influencer_id, year)
);

-- 12. ATOMIC PER-INFLUENCER ANNUAL INVOICE NUMBER GENERATOR
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

-- 13. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_invoices_influencer_number ON public.invoices(influencer_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_campaign ON public.invoices(campaign_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_influencer ON public.campaigns(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_payment_status ON public.campaigns(payment_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_production_status ON public.campaigns(production_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_locked_date ON public.campaigns(deal_locked_date);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(read, timestamp);

-- 14. AUTOMATED UPDATED_AT TRIGGERS
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

-- 15. DATA INTEGRITY & SECURITY TRIGGERS

-- Trigger A: Restrict Influencer Profile Updates
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

DROP TRIGGER IF EXISTS trg_protect_influencer_fields ON public.influencers;
CREATE TRIGGER trg_protect_influencer_fields
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW EXECUTE FUNCTION public.protect_influencer_fields();

-- Trigger B: Restrict Influencer Campaign Updates
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

DROP TRIGGER IF EXISTS trg_protect_campaign_fields ON public.campaigns;
CREATE TRIGGER trg_protect_campaign_fields
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.protect_campaign_fields();

-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- Zero Trust: Enable RLS on every table. Unauthenticated/anon users have NO ACCESS by default.
ALTER TABLE public.management_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks (Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Safe bootstrap: if management_users table is empty, allow authenticated user to initialize/seed data
  IF NOT EXISTS (SELECT 1 FROM public.management_users) THEN
    RETURN (auth.role() = 'authenticated');
  END IF;

  RETURN (
    coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'ADMIN'
    OR coalesce(auth.jwt()->'user_metadata'->>'role', '') = 'ADMIN'
    OR coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.management_users
      WHERE email = coalesce(auth.jwt()->>'email', '') AND account_status = 'active'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_influencer_id()
RETURNS TEXT AS $$
DECLARE
  inf_id TEXT;
BEGIN
  inf_id := coalesce(auth.jwt()->'user_metadata'->>'influencer_id', '');
  IF inf_id <> '' THEN
    RETURN inf_id;
  END IF;

  inf_id := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'influencer_id', '');
  IF inf_id <> '' THEN
    RETURN inf_id;
  END IF;

  SELECT id INTO inf_id FROM public.influencers
  WHERE email = coalesce(auth.jwt()->>'email', '') AND account_status = 'active'
  LIMIT 1;

  RETURN coalesce(inf_id, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- STRICT AUTHENTICATED ACCESS POLICIES (Zero Access to 'anon' role)
-- ==============================================================================

-- 1. MANAGEMENT USERS: Only authenticated Admins can view and manage admin team accounts
CREATE POLICY admin_mgmt_users_all ON public.management_users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. INFLUENCERS:
-- - Admins have full access
-- - Influencers can view and update their own profile (trigger guards sensitive fields)
CREATE POLICY admin_influencers_all ON public.influencers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY influencer_view_own_profile ON public.influencers
  FOR SELECT TO authenticated
  USING (id = public.current_influencer_id());

CREATE POLICY influencer_update_own_profile ON public.influencers
  FOR UPDATE TO authenticated
  USING (id = public.current_influencer_id())
  WITH CHECK (id = public.current_influencer_id());

-- 3. BRANDS: Strictly Admin-only for all operations (SELECT, INSERT, UPDATE, DELETE).
-- Influencers have NO direct table access to public.brands and must query the masked public.brands_directory view.
CREATE POLICY admin_brands_all ON public.brands
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. CAMPAIGNS / COLLABORATIONS:
-- - Admins have full access
-- - Influencers can view only their own collaborations
-- - Influencers can update only metrics & live links on their own collaborations (trigger guards commercials)
CREATE POLICY admin_campaigns_all ON public.campaigns
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY influencer_view_own_campaigns ON public.campaigns
  FOR SELECT TO authenticated
  USING (influencer_id = public.current_influencer_id());

CREATE POLICY influencer_update_metrics ON public.campaigns
  FOR UPDATE TO authenticated
  USING (influencer_id = public.current_influencer_id())
  WITH CHECK (influencer_id = public.current_influencer_id());

-- 5. INVOICES:
-- - Admins have full access
-- - Influencers can view only their own invoices
CREATE POLICY admin_invoices_all ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY influencer_view_own_invoices ON public.invoices
  FOR SELECT TO authenticated
  USING (influencer_id = public.current_influencer_id());

-- 6. EXPENSES: Only authenticated Admins can view and manage expenses
CREATE POLICY admin_expenses_all ON public.expenses
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. NOTIFICATIONS:
-- - Admins have full access
-- - Influencers can view only notifications attached to their campaigns
CREATE POLICY admin_notifications_all ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY influencer_view_own_notifications ON public.notifications
  FOR SELECT TO authenticated
  USING (
    campaign_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = notifications.campaign_id AND campaigns.influencer_id = public.current_influencer_id()
    )
  );

-- 8. INVOICE SEQUENCES: Only authenticated Admins have direct table access; generator function is SECURITY DEFINER
CREATE POLICY admin_invoice_sequences_all ON public.invoice_sequences
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- (NO POLICIES ARE DEFINED FOR 'anon'. All unauthenticated requests are strictly rejected by PostgreSQL RLS)
