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
 * Migration helper to transfer all stored local data to Supabase
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

  try {
    const counts: { [key: string]: number } = {};

    // 1. Sync Influencers
    if (localData.influencers && localData.influencers.length > 0) {
      const { error: infErr } = await supabase
        .from('influencers')
        .upsert(localData.influencers.map(inf => ({
          id: inf.id,
          name: inf.name,
          handle: inf.handle,
          city: inf.city,
          avatar_url: inf.avatarUrl,
          bio: inf.bio,
          email: inf.email,
          phone: inf.phone,
          pan: inf.pan,
          username: inf.username,
          password: inf.password,
          account_status: inf.accountStatus || 'active',
          address: inf.address,
          bank_details: inf.bankDetails,
          rate_card: inf.rateCard,
          media_kit_bio: inf.mediaKitBio,
          followers_count: inf.followersCount,
          monthly_insights: inf.monthlyInsightsSnapshots,
          featured_reels: inf.mediaKitFeaturedReels,
          invoice_prefix: inf.invoicePrefix || inf.name.slice(0, 2).toUpperCase()
        })), { onConflict: 'id' });

      if (infErr) console.warn('Supabase influencers sync notice:', infErr.message);
      counts.influencers = localData.influencers.length;
    }

    // 2. Sync Brands
    if (localData.brands && localData.brands.length > 0) {
      const { error: brandErr } = await supabase
        .from('brands')
        .upsert(localData.brands.map(b => ({
          id: b.id,
          name: b.name,
          logo_url: b.logoUrl,
          contact_person: b.contactPerson,
          brand_manager: b.brandManager || b.contactPerson,
          email: b.email,
          phone: b.phone,
          notes: b.notes
        })), { onConflict: 'id' });

      if (brandErr) console.warn('Supabase brands sync notice:', brandErr.message);
      counts.brands = localData.brands.length;
    }

    // 3. Sync Campaigns
    if (localData.campaigns && localData.campaigns.length > 0) {
      const { error: campErr } = await supabase
        .from('campaigns')
        .upsert(localData.campaigns.map(c => ({
          id: c.id,
          influencer_id: c.influencerId,
          brand_id: c.brandId,
          brand_name: c.brandName,
          campaign_name: c.campaignName,
          deal_amount: c.dealAmount,
          locked_commercial: c.lockedCommercial || c.dealAmount,
          received_commercial: c.receivedCommercial || c.amountReceived || 0,
          tds_deducted_amount: c.tdsDeductedAmount || 0,
          tds_deducted_percentage: c.tdsDeductedPercentage || 10,
          commission_earned: c.commissionEarned || 0,
          commission_percentage: c.commissionPercentage || 0,
          deal_locked_date: c.dealLockedDate,
          live_date: c.liveDate,
          payment_terms_days: c.paymentTermsDays,
          payment_terms_text: c.paymentTermsText,
          payment_eta_date: c.paymentEtaDate,
          payment_due_date: c.paymentDueDate || c.calculatedDueDate,
          payment_received_date: c.paymentReceivedDate,
          amount_received: c.amountReceived || c.receivedCommercial,
          amount_pending: c.amountPending,
          production_status: c.productionStatus,
          payment_status: c.paymentStatus,
          deliverables: c.deliverables,
          live_link: c.liveLink,
          metrics: c.metrics,
          notes: c.notes,
          follow_ups: c.followUps,
          activities: c.activities
        })), { onConflict: 'id' });

      if (campErr) console.warn('Supabase campaigns sync notice:', campErr.message);
      counts.campaigns = localData.campaigns.length;
    }

    // 4. Sync Invoices
    if (localData.invoices && localData.invoices.length > 0) {
      const { error: invErr } = await supabase
        .from('invoices')
        .upsert(localData.invoices.map(inv => ({
          id: inv.id,
          invoice_number: inv.invoiceNumber,
          campaign_id: inv.campaignId,
          influencer_id: inv.influencerId,
          influencer_name: inv.influencerName,
          brand_name: inv.brandName || inv.invoiceTo,
          brand_manager: inv.brandManager,
          invoice_date: inv.invoiceDate,
          due_date: inv.dueDate,
          invoice_to: inv.invoiceTo,
          payment_to: inv.paymentTo,
          service_description: inv.serviceDescription,
          quantity: inv.quantity,
          amount: inv.amount,
          tds_percentage: inv.tdsPercentage,
          tds_amount: inv.tdsAmount,
          final_amount: inv.finalAmount,
          payment_status: inv.paymentStatus,
          generated_date: inv.generatedDate
        })), { onConflict: 'id' });

      if (invErr) console.warn('Supabase invoices sync notice:', invErr.message);
      counts.invoices = localData.invoices.length;
    }

    return {
      success: true,
      message: 'Successfully migrated all OS records to Supabase centralized cloud database.',
      counts
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Migration failed: ${err.message || 'Unknown error'}`
    };
  }
}
