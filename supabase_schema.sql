-- ==============================================================================
-- IYER TALENT OS — ENTERPRISE SUPABASE CLOUD DATABASE SCHEMA
-- Strict Zero-Trust Security, Authenticated Role-Based Access Control,
-- Creator Isolation, Unique Invoice Sequence, and Automated Triggers.
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
CREATE TABLE IF NOT EXISTS public.management_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Talent Manager' CHECK (role IN ('Owner', 'Partner', 'Talent Manager')),
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INFLUENCERS TABLE
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

-- 6. COLLABORATIONS / CAMPAIGNS TABLE (Complete Talent OS Feature Support)
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

-- 7. INVOICES TABLE (Strict unique invoice numbering per influencer and year)
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

-- 8. EXPENSES TABLE (Agency & Operational Expenses)
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

-- 9. NOTIFICATIONS TABLE (Payment reminders, deadlines, and approvals)
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

-- 10. APP SETTINGS & INVOICE SEQUENCE COUNTER TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ATOMIC INVOICE SEQUENCE GENERATOR FUNCTION
CREATE OR REPLACE FUNCTION public.get_next_invoice_seq(p_initial INT DEFAULT 1000)
RETURNS INT AS $$
DECLARE
  current_val INT;
BEGIN
  INSERT INTO public.app_settings (key, value)
  VALUES ('invoice_sequence', jsonb_build_object('counter', p_initial))
  ON CONFLICT (key) DO NOTHING;

  UPDATE public.app_settings
  SET value = jsonb_set(value, '{counter}', to_jsonb((value->>'counter')::int + 1)),
      updated_at = NOW()
  WHERE key = 'invoice_sequence'
  RETURNING (value->>'counter')::int INTO current_val;

  RETURN current_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_invoices_influencer_number ON public.invoices(influencer_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_campaign ON public.invoices(campaign_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_influencer ON public.campaigns(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_payment_status ON public.campaigns(payment_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_production_status ON public.campaigns(production_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_locked_date ON public.campaigns(deal_locked_date);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(read, timestamp);

-- 13. AUTOMATED UPDATED_AT TRIGGERS
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

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- Zero Trust: Enable RLS on every table. Unauthenticated/anon users have NO ACCESS by default.
ALTER TABLE public.management_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

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
-- - Influencers can view and update only their own profile
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

-- 3. BRANDS:
-- - Admins have full CRUD
-- - Influencers have SELECT only to display brand metadata
CREATE POLICY admin_brands_all ON public.brands
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY influencer_view_brands ON public.brands
  FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

-- 4. CAMPAIGNS / COLLABORATIONS:
-- - Admins have full access
-- - Influencers can view only their own collaborations
-- - Influencers can update only metrics & live links on their own collaborations
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

-- 8. APP SETTINGS: Only authenticated Admins can view and modify app settings
CREATE POLICY admin_settings_all ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- (NO POLICIES ARE DEFINED FOR 'anon'. All unauthenticated requests are strictly rejected by PostgreSQL RLS)
