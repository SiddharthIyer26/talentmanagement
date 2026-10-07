import { supabase, isSupabaseConfigured, sanitizeDate, sanitizeNumber } from './supabase';
import { Influencer, Campaign, Brand, Invoice } from '../types';

/**
 * Mappers between Supabase snake_case database rows and application camelCase models.
 */

export function cloudToInfluencer(row: any): Influencer {
  return {
    id: row.id,
    name: row.name || 'Creator',
    handle: row.handle || '@creator',
    city: row.city || 'India',
    avatarUrl: row.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: row.bio || '',
    email: row.email || '',
    phone: row.phone || '',
    pan: row.pan || '',
    username: row.username || '',
    password: row.password || '',
    accountStatus: row.account_status || 'active',
    address: row.address || '',
    bankDetails: row.bank_details || {},
    rateCard: row.rate_card || {},
    mediaKitBio: row.media_kit_bio || '',
    followersCount: Number(row.followers_count || 0),
    monthlyInsightsSnapshots: Array.isArray(row.monthly_insights) ? row.monthly_insights : [],
    mediaKitFeaturedReels: Array.isArray(row.featured_reels) ? row.featured_reels : [],
    invoicePrefix: row.invoice_prefix || (row.name ? row.name.slice(0, 2).toUpperCase() : 'IN')
  };
}

export function influencerToCloud(inf: Influencer): any {
  return {
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
    account_status: inf.accountStatus || 'active',
    address: inf.address || null,
    bank_details: inf.bankDetails || {},
    rate_card: inf.rateCard || {},
    media_kit_bio: inf.mediaKitBio || null,
    followers_count: sanitizeNumber(inf.followersCount, 0),
    monthly_insights: inf.monthlyInsightsSnapshots || [],
    featured_reels: inf.mediaKitFeaturedReels || [],
    invoice_prefix: inf.invoicePrefix || inf.name.slice(0, 2).toUpperCase()
  };
}

export function cloudToCampaign(row: any): Campaign {
  const locked = Number(row.locked_commercial || row.deal_amount || 0);
  const received = Number(row.received_commercial || row.amount_received || 0);
  const commPct = Number(row.commission_percentage || 10);
  const commEarned = Number(row.commission_earned || Math.round(locked * (commPct / 100)));
  const tdsPct = Number(row.tds_deducted_percentage || 10);
  const tdsAmt = Number(row.tds_deducted_amount || Math.round(locked * (tdsPct / 100)));

  return {
    id: row.id,
    influencerId: row.influencer_id || 'non-exclusive',
    talentType: row.talent_type || (row.influencer_id ? 'exclusive' : 'non_exclusive'),
    nonExclusiveTalent: row.non_exclusive_talent || undefined,
    brandId: row.brand_id || '',
    brandName: row.brand_name || 'Brand',
    campaignName: row.campaign_name || 'Campaign',
    dealAmount: locked,
    lockedCommercial: locked,
    receivedCommercial: received,
    tdsDeductedAmount: tdsAmt,
    tdsDeductedPercentage: tdsPct,
    commissionPercentage: commPct,
    commissionEarned: commEarned,
    dealLockedDate: row.deal_locked_date || '',
    liveDate: row.live_date || undefined,
    campaignStartDate: row.campaign_start_date || undefined,
    startDate: row.campaign_start_date || undefined,
    contentDeadline: row.content_deadline || undefined,
    goLiveDate: row.go_live_date || undefined,
    contentLiveDate: row.content_live_date || undefined,
    invoiceSubmittedDate: row.invoice_submitted_date || undefined,
    paymentTermsDays: Number(row.payment_terms_days || 30),
    paymentTermsText: row.payment_terms_text || undefined,
    paymentEtaDate: row.payment_eta_date || undefined,
    paymentEtaNotes: row.payment_eta_notes || undefined,
    paymentDueDate: row.payment_due_date || undefined,
    calculatedDueDate: row.calculated_due_date || row.payment_due_date || undefined,
    paymentReceivedDate: row.payment_received_date || undefined,
    amountReceived: received,
    amountPending: Number(row.amount_pending || Math.max(0, locked - received)),
    paymentNotes: row.payment_notes || undefined,
    productionStatus: row.production_status || 'Locked',
    paymentStatus: row.payment_status || 'Pending',
    deliverables: Array.isArray(row.deliverables) ? row.deliverables : [],
    liveLink: row.live_link || undefined,
    trackingLink: row.tracking_link || undefined,
    contactPerson: row.contact_person || undefined,
    contactNumber: row.contact_number || undefined,
    contactEmail: row.contact_email || undefined,
    brandManager: row.brand_manager || undefined,
    usageRights: row.usage_rights || undefined,
    adRights: row.ad_rights || undefined,
    notes: row.notes || undefined,
    internalNotes: row.internal_notes || undefined,
    metrics: row.metrics || { views: 0, likes: 0, comments: 0, shares: 0, reach: 0, interactions: 0 },
    followUps: Array.isArray(row.follow_ups) ? row.followUps : [],
    activities: Array.isArray(row.activities) ? row.activities : []
  };
}

export function campaignToCloud(c: Partial<Campaign>): any {
  const locked = sanitizeNumber(c.lockedCommercial || c.dealAmount, 0);
  const received = sanitizeNumber(c.receivedCommercial || c.amountReceived, 0);
  const commPct = sanitizeNumber(c.commissionPercentage, 10);
  const commEarned = sanitizeNumber(c.commissionEarned, Math.round(locked * (commPct / 100)));
  const tdsPct = sanitizeNumber(c.tdsDeductedPercentage, 10);
  const tdsAmt = sanitizeNumber(c.tdsDeductedAmount, Math.round(locked * (tdsPct / 100)));
  const pending = sanitizeNumber(c.amountPending, Math.max(0, locked - received));

  const isNonEx = c.talentType === 'non_exclusive';
  const infId = isNonEx ? (c.influencerId === 'non-exclusive' ? null : c.influencerId || null) : (c.influencerId || null);

  return {
    id: c.id,
    influencer_id: infId,
    talent_type: c.talentType || 'exclusive',
    non_exclusive_talent: c.nonExclusiveTalent || null,
    brand_id: c.brandId || null,
    brand_name: c.brandName || 'Brand',
    campaign_name: c.campaignName || 'Campaign',
    deal_amount: locked,
    locked_commercial: locked,
    received_commercial: received,
    tds_deducted_amount: tdsAmt,
    tds_deducted_percentage: tdsPct,
    commission_earned: commEarned,
    commission_percentage: commPct,
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
    amount_received: received,
    amount_pending: pending,
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
  };
}

export function cloudToInvoice(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    campaignId: row.campaign_id || undefined,
    influencerId: row.influencer_id,
    influencerName: row.influencer_name || undefined,
    brandId: row.brand_id || undefined,
    brandName: row.brand_name || undefined,
    brandManager: row.brand_manager || undefined,
    clientName: row.client_name || undefined,
    clientAddress: row.client_address || undefined,
    clientGstin: row.client_gstin || undefined,
    campaignName: row.campaign_name || undefined,
    invoiceDate: row.invoice_date || '',
    dueDate: row.due_date || undefined,
    invoiceTo: row.invoice_to || '',
    paymentTo: row.payment_to || '',
    serviceDescription: row.service_description || '',
    quantity: Number(row.quantity || 1),
    amount: Number(row.amount || 0),
    tdsPercentage: Number(row.tds_percentage || 10),
    tdsAmount: Number(row.tds_amount || 0),
    finalAmount: Number(row.final_amount || 0),
    totalDue: Number(row.total_due || row.final_amount || 0),
    paymentStatus: row.payment_status || 'Issued',
    generatedDate: row.generated_date || '',
    notes: row.notes || undefined
  };
}

export function invoiceToCloud(inv: Partial<Invoice>): any {
  return {
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
  };
}

export function cloudToBrand(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url || undefined,
    contactPerson: row.contact_person || undefined,
    brandManager: row.brand_manager || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    notes: row.notes || undefined
  };
}

export function brandToCloud(b: Partial<Brand>): any {
  return {
    id: b.id,
    name: b.name,
    logo_url: b.logoUrl || null,
    contact_person: b.contactPerson || null,
    brand_manager: b.brandManager || b.contactPerson || null,
    email: b.email || null,
    phone: b.phone || null,
    notes: b.notes || null
  };
}

/**
 * Cloud Fetcher: Downloads all relevant tables from Supabase into camelCase models.
 */
export async function fetchCloudData(role: 'ADMIN' | 'INFLUENCER', influencerId?: string): Promise<{
  influencers: Influencer[];
  campaigns: Campaign[];
  brands: Brand[];
  invoices: Invoice[];
} | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const isInf = role === 'INFLUENCER' && Boolean(influencerId);

    // 1. Influencers query
    let infQuery = supabase.from('influencers').select('*');
    if (isInf) {
      infQuery = infQuery.eq('id', influencerId);
    }
    const { data: infRows, error: infErr } = await infQuery;
    if (infErr) {
      console.warn('Cloud fetch notice (influencers):', infErr.message);
    }

    // 2. Campaigns query
    let campQuery = supabase.from('campaigns').select('*');
    if (isInf) {
      campQuery = campQuery.eq('influencer_id', influencerId);
    }
    const { data: campRows, error: campErr } = await campQuery;
    if (campErr) {
      console.warn('Cloud fetch notice (campaigns):', campErr.message);
    }

    // 3. Brands query (Admin sees all, Influencer sees via brands_directory view or limited)
    let brandRows: any[] = [];
    if (!isInf) {
      const { data: bRows, error: bErr } = await supabase.from('brands').select('*');
      if (!bErr && bRows) brandRows = bRows;
    } else {
      const { data: bRows, error: bErr } = await supabase.from('brands_directory').select('*');
      if (!bErr && bRows) brandRows = bRows;
    }

    // 4. Invoices query
    let invQuery = supabase.from('invoices').select('*');
    if (isInf) {
      invQuery = invQuery.eq('influencer_id', influencerId);
    }
    const { data: invRows, error: invErr } = await invQuery;
    if (invErr) {
      console.warn('Cloud fetch notice (invoices):', invErr.message);
    }

    return {
      influencers: (infRows || []).map(cloudToInfluencer),
      campaigns: (campRows || []).map(cloudToCampaign),
      brands: (brandRows || []).map(cloudToBrand),
      invoices: (invRows || []).map(cloudToInvoice)
    };
  } catch (err) {
    console.warn('Notice fetching cloud data:', err);
    return null;
  }
}

/**
 * Cloud Writer: Saves an influencer directly to Supabase with error verification.
 */
export async function saveInfluencerCloud(inf: Influencer): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const payload = influencerToCloud(inf);
  const { error } = await supabase.from('influencers').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw new Error(`Cloud save failed for influencer: ${error.message}`);
  }
}

/**
 * Cloud Writer: Deletes an influencer directly from Supabase.
 */
export async function deleteInfluencerCloud(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from('influencers').delete().eq('id', id);
  if (error) {
    throw new Error(`Cloud delete failed for influencer: ${error.message}`);
  }
}

/**
 * Cloud Writer: Saves a campaign directly to Supabase with error verification.
 */
export async function saveCampaignCloud(c: Partial<Campaign>): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const payload = campaignToCloud(c);
  const { error } = await supabase.from('campaigns').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw new Error(`Cloud save failed for collaboration: ${error.message}`);
  }
}

/**
 * Cloud Writer: Deletes a campaign directly from Supabase.
 */
export async function deleteCampaignCloud(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) {
    throw new Error(`Cloud delete failed for collaboration: ${error.message}`);
  }
}

/**
 * Cloud Writer: Saves an invoice directly to Supabase.
 */
export async function saveInvoiceCloud(inv: Partial<Invoice>): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const payload = invoiceToCloud(inv);
  const { error } = await supabase.from('invoices').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw new Error(`Cloud save failed for invoice: ${error.message}`);
  }
}

/**
 * Cloud Writer: Deletes an invoice directly from Supabase.
 */
export async function deleteInvoiceCloud(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) {
    throw new Error(`Cloud delete failed for invoice: ${error.message}`);
  }
}

/**
 * Cloud Writer: Saves a brand directly to Supabase.
 */
export async function saveBrandCloud(b: Partial<Brand>): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const payload = brandToCloud(b);
  const { error } = await supabase.from('brands').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw new Error(`Cloud save failed for brand: ${error.message}`);
  }
}

/**
 * Cloud Writer: Deletes a brand directly from Supabase.
 */
export async function deleteBrandCloud(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) {
    throw new Error(`Cloud delete failed for brand: ${error.message}`);
  }
}

/**
 * Realtime Channel Manager: Subscribes to live Postgres changes across devices.
 */
export function setupRealtimeSync(
  onDatabaseChange: (table: string, eventType: string, newRow?: any, oldRow?: any) => void
): () => void {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel('talent_os_live_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'influencers' },
      payload => onDatabaseChange('influencers', payload.eventType, payload.new, payload.old)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'campaigns' },
      payload => onDatabaseChange('campaigns', payload.eventType, payload.new, payload.old)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'invoices' },
      payload => onDatabaseChange('invoices', payload.eventType, payload.new, payload.old)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'brands' },
      payload => onDatabaseChange('brands', payload.eventType, payload.new, payload.old)
    )
    .subscribe((status, err) => {
      if (err) {
        console.warn('Realtime subscription notice:', err.message);
      }
    });

  return () => {
    supabase?.removeChannel(channel);
  };
}
