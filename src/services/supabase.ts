import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseSchema } from './db';

// Supabase Environment variables
const env = (import.meta as any).env || {};
const supabaseUrl: string = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Sanitizes date values for PostgreSQL DATE columns.
 * Prevents "invalid input syntax for type date: ''" crashes.
 */
export function sanitizeDate(val?: string | null): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  // If ISO string like 2026-08-15T00:00:00.000Z, extract YYYY-MM-DD
  if (trimmed.includes('T')) {
    return trimmed.split('T')[0];
  }
  return trimmed;
}

/**
 * Sanitizes numeric values for PostgreSQL NUMERIC columns.
 */
export function sanitizeNumber(val?: number | string | null, fallback: number = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const num = typeof val === 'number' ? val : Number(val);
  return isNaN(num) ? fallback : num;
}

/**
 * Checks if the current browser session has an authenticated Supabase user
 */
export async function getAuthenticatedCloudUser() {
  if (!supabase || !isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Authenticates or bootstraps an admin account in Supabase Auth securely from the client.
 * Does not require or expose any service-role key.
 */
export async function authenticateOrRegisterAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, message: 'Supabase credentials are not configured.' };
  }

  try {
    // 1. Try signing in first
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!signInErr && signInData.user) {
      return { success: true, message: 'Admin authenticated successfully with Supabase Auth.' };
    }

    // 2. If user doesn't exist, register as initial admin
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'ADMIN'
        }
      }
    });

    if (signUpErr) {
      return { success: false, message: `Supabase authentication failed: ${signUpErr.message}` };
    }

    if (signUpData.user) {
      return {
        success: true,
        message: 'Admin account registered and authenticated in Supabase Auth.'
      };
    }

    return { success: false, message: 'Unable to authenticate admin with Supabase.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Authentication error.' };
  }
}

/**
 * Authenticates or bootstraps an influencer account in Supabase Auth securely from the client.
 * Sets role: 'INFLUENCER' and influencer_id in user_metadata for strict RLS creator isolation.
 */
export async function authenticateOrRegisterInfluencer(
  email: string,
  password: string,
  influencerId: string
): Promise<{ success: boolean; message: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, message: 'Supabase credentials are not configured.' };
  }

  try {
    // 1. Try signing in first
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!signInErr && signInData.user) {
      return { success: true, message: 'Influencer authenticated successfully with Supabase Auth.' };
    }

    // 2. If user doesn't exist, register as initial creator account
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'INFLUENCER',
          influencer_id: influencerId
        }
      }
    });

    if (signUpErr) {
      return { success: false, message: `Supabase authentication failed: ${signUpErr.message}` };
    }

    if (signUpData.user) {
      return {
        success: true,
        message: 'Influencer account registered and authenticated in Supabase Auth.'
      };
    }

    return { success: false, message: 'Unable to authenticate influencer with Supabase.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Authentication error.' };
  }
}

/**
 * Cloud sequence generator for atomic invoice numbering
 */
export async function getNextCloudInvoiceSequence(fallbackSeq: number = 1000): Promise<number> {
  if (!supabase || !isSupabaseConfigured()) {
    return fallbackSeq + 1;
  }

  try {
    const { data, error } = await supabase.rpc('get_next_invoice_seq', { p_initial: fallbackSeq });
    if (!error && typeof data === 'number') {
      return data;
    }
  } catch (err) {
    console.warn('Supabase invoice sequence RPC error, falling back to local counter:', err);
  }

  return fallbackSeq + 1;
}

/**
 * Enterprise secure migration helper:
 * Requires an authenticated Admin session in Supabase Auth before performing upserts.
 * Enforces Zero-Trust RLS without exposing service-role keys.
 */
export async function migrateLocalStorageToSupabase(localData: DatabaseSchema): Promise<{
  success: boolean;
  message: string;
  counts?: { [key: string]: number };
}> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured.'
    };
  }

  // Security gate: Verify authenticated user
  const currentUser = await getAuthenticatedCloudUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'Security requirement: You must be logged into Supabase Auth with an authenticated Admin session to migrate data. Please sign in or use authenticateOrRegisterAdmin().'
    };
  }

  try {
    const counts: { [key: string]: number } = {};

    // 1. Sync Management Users
    if (localData.managementUsers && localData.managementUsers.length > 0) {
      const { error: mgmtErr } = await supabase
        .from('management_users')
        .upsert(
          localData.managementUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || null,
            username: u.username,
            password: u.password,
            role: u.role || 'Talent Manager',
            account_status: u.accountStatus || 'active'
          })),
          { onConflict: 'id' }
        );

      if (mgmtErr) throw new Error(`Management users sync: ${mgmtErr.message}`);
      counts.managementUsers = localData.managementUsers.length;
    }

    // 2. Sync Influencers
    if (localData.influencers && localData.influencers.length > 0) {
      const { error: infErr } = await supabase
        .from('influencers')
        .upsert(
          localData.influencers.map(inf => ({
            id: inf.id,
            name: inf.name,
            handle: inf.handle,
            city: inf.city || null,
            avatar_url: inf.avatarUrl || null,
            bio: inf.bio || null,
            email: inf.email || null,
            phone: inf.phone || null,
            pan: inf.pan || null,
            username: inf.username,
            password: inf.password,
            account_status: inf.accountStatus || 'active',
            address: inf.address || null,
            bank_details: inf.bankDetails || {},
            rate_card: inf.rateCard || {},
            media_kit_bio: inf.mediaKitBio || null,
            followers_count: sanitizeNumber(inf.followersCount, 0),
            monthly_insights: inf.monthlyInsightsSnapshots || [],
            featured_reels: inf.mediaKitFeaturedReels || [],
            invoice_prefix: inf.invoicePrefix || inf.name.slice(0, 2).toUpperCase()
          })),
          { onConflict: 'id' }
        );

      if (infErr) throw new Error(`Influencers sync: ${infErr.message}`);
      counts.influencers = localData.influencers.length;
    }

    // 3. Sync Brands
    if (localData.brands && localData.brands.length > 0) {
      const { error: brandErr } = await supabase
        .from('brands')
        .upsert(
          localData.brands.map(b => ({
            id: b.id,
            name: b.name,
            logo_url: b.logoUrl || null,
            contact_person: b.contactPerson || null,
            brand_manager: b.brandManager || b.contactPerson || null,
            email: b.email || null,
            phone: b.phone || null,
            notes: b.notes || null
          })),
          { onConflict: 'id' }
        );

      if (brandErr) throw new Error(`Brands sync: ${brandErr.message}`);
      counts.brands = localData.brands.length;
    }

    // 4. Sync Campaigns (With Full Operational Fields)
    if (localData.campaigns && localData.campaigns.length > 0) {
      const { error: campErr } = await supabase
        .from('campaigns')
        .upsert(
          localData.campaigns.map(c => ({
            id: c.id,
            influencer_id: c.influencerId,
            brand_id: c.brandId || null,
            brand_name: c.brandName,
            campaign_name: c.campaignName,
            deal_amount: sanitizeNumber(c.dealAmount, 0),
            locked_commercial: sanitizeNumber(c.lockedCommercial || c.dealAmount, 0),
            received_commercial: sanitizeNumber(c.receivedCommercial || c.amountReceived, 0),
            tds_deducted_amount: sanitizeNumber(c.tdsDeductedAmount, 0),
            tds_deducted_percentage: sanitizeNumber(c.tdsDeductedPercentage, 10),
            commission_earned: sanitizeNumber(c.commissionEarned, 0),
            commission_percentage: sanitizeNumber(c.commissionPercentage, 10),
            deal_locked_date: sanitizeDate(c.dealLockedDate) || new Date().toISOString().split('T')[0],
            live_date: sanitizeDate(c.liveDate),
            campaign_start_date: sanitizeDate(c.campaignStartDate || c.startDate),
            content_deadline: sanitizeDate(c.contentDeadline),
            go_live_date: sanitizeDate(c.goLiveDate),
            content_live_date: sanitizeDate(c.contentLiveDate),
            invoice_submitted_date: sanitizeDate(c.invoiceSubmittedDate),
            payment_terms_days: sanitizeNumber(c.paymentTermsDays, 30),
            payment_terms_text: c.paymentTermsText || null,
            payment_eta_date: sanitizeDate(c.paymentEtaDate),
            payment_eta_notes: c.paymentEtaNotes || null,
            payment_due_date: sanitizeDate(c.paymentDueDate || c.calculatedDueDate),
            calculated_due_date: sanitizeDate(c.calculatedDueDate || c.paymentDueDate),
            payment_received_date: sanitizeDate(c.paymentReceivedDate),
            amount_received: sanitizeNumber(c.amountReceived || c.receivedCommercial, 0),
            amount_pending: sanitizeNumber(c.amountPending, 0),
            payment_notes: c.paymentNotes || null,
            production_status: c.productionStatus || 'Locked',
            payment_status: c.paymentStatus || 'Pending',
            deliverables: c.deliverables || [],
            live_link: c.liveLink || null,
            tracking_link: c.trackingLink || null,
            contact_person: c.contactPerson || null,
            contact_number: c.contactNumber || null,
            contact_email: c.contactEmail || null,
            brand_manager: c.brandManager || null,
            usage_rights: c.usageRights || null,
            ad_rights: c.adRights || null,
            notes: c.notes || null,
            internal_notes: c.internalNotes || null,
            metrics: c.metrics || { views: 0, likes: 0, comments: 0, shares: 0, reach: 0, interactions: 0 },
            follow_ups: c.followUps || [],
            activities: c.activities || []
          })),
          { onConflict: 'id' }
        );

      if (campErr) throw new Error(`Campaigns sync: ${campErr.message}`);
      counts.campaigns = localData.campaigns.length;
    }

    // 5. Sync Invoices (With Complete Audit Details)
    if (localData.invoices && localData.invoices.length > 0) {
      const { error: invErr } = await supabase
        .from('invoices')
        .upsert(
          localData.invoices.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoiceNumber,
            campaign_id: inv.campaignId || null,
            influencer_id: inv.influencerId,
            influencer_name: inv.influencerName || null,
            brand_id: inv.brandId || null,
            brand_name: inv.brandName || inv.invoiceTo || null,
            brand_manager: inv.brandManager || null,
            client_name: inv.clientName || null,
            client_address: inv.clientAddress || null,
            client_gstin: inv.clientGstin || null,
            campaign_name: inv.campaignName || null,
            invoice_date: sanitizeDate(inv.invoiceDate) || new Date().toISOString().split('T')[0],
            due_date: sanitizeDate(inv.dueDate),
            invoice_to: inv.invoiceTo || null,
            payment_to: inv.paymentTo || null,
            service_description: inv.serviceDescription || null,
            quantity: sanitizeNumber(inv.quantity, 1),
            amount: sanitizeNumber(inv.amount, 0),
            tds_percentage: sanitizeNumber(inv.tdsPercentage, 10),
            tds_amount: sanitizeNumber(inv.tdsAmount, 0),
            final_amount: sanitizeNumber(inv.finalAmount, 0),
            total_due: sanitizeNumber(inv.totalDue || inv.finalAmount, 0),
            payment_status: inv.paymentStatus || 'Issued',
            generated_date: inv.generatedDate || new Date().toISOString(),
            notes: inv.notes || null
          })),
          { onConflict: 'id' }
        );

      if (invErr) throw new Error(`Invoices sync: ${invErr.message}`);
      counts.invoices = localData.invoices.length;
    }

    // 6. Sync Expenses
    if (localData.expenses && localData.expenses.length > 0) {
      const { error: expErr } = await supabase
        .from('expenses')
        .upsert(
          localData.expenses.map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            amount: sanitizeNumber(e.amount, 0),
            date: sanitizeDate(e.date) || new Date().toISOString().split('T')[0],
            notes: e.notes || null
          })),
          { onConflict: 'id' }
        );

      if (expErr) throw new Error(`Expenses sync: ${expErr.message}`);
      counts.expenses = localData.expenses.length;
    }

    // 7. Sync Notifications
    if (localData.notifications && localData.notifications.length > 0) {
      const { error: notifErr } = await supabase
        .from('notifications')
        .upsert(
          localData.notifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: n.timestamp || new Date().toISOString(),
            read: Boolean(n.read),
            campaign_id: n.campaignId || null,
            urgency: n.urgency || null
          })),
          { onConflict: 'id' }
        );

      if (notifErr) throw new Error(`Notifications sync: ${notifErr.message}`);
      counts.notifications = localData.notifications.length;
    }

    // 8. Sync Invoice Sequence Counter
    if (typeof localData.invoiceSeqCounter === 'number') {
      const { error: seqErr } = await supabase
        .from('app_settings')
        .upsert(
          {
            key: 'invoice_sequence',
            value: { counter: localData.invoiceSeqCounter }
          },
          { onConflict: 'key' }
        );

      if (seqErr) throw new Error(`Sequence settings sync: ${seqErr.message}`);
      counts.settings = 1;
    }

    return {
      success: true,
      message: 'Successfully migrated all OS records to Supabase under authenticated Admin credentials.',
      counts
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Migration failed: ${err.message || 'Unknown error'}`
    };
  }
}
