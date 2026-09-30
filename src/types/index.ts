export type UserRole = 'ADMIN' | 'INFLUENCER';

export interface ManagementUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  username: string;
  password: string;
  role: 'Owner' | 'Partner' | 'Talent Manager';
  accountStatus: 'active' | 'disabled';
}

export type ProductionStatus = 
  | 'Locked'
  | 'Scripting Underway'
  | 'Under Production'
  | 'Waiting for Approval'
  | 'Video Published'
  | 'Negotiating'
  | 'Confirmed'
  | 'Scripting'
  | 'Shoot Pending'
  | 'Draft Submitted'
  | 'Approval Pending'
  | 'Approved'
  | 'Scheduled'
  | 'Live'
  | 'Completed'
  | 'Cancelled';

export type PaymentStatus = 
  | 'Pending'
  | 'Received'
  | 'Payment Pending'
  | 'Advance Received'
  | 'Partially Paid'
  | 'Payment Processing'
  | 'Paid'
  | 'Overdue';

export type PaymentUrgency = 'Upcoming' | 'Due Soon' | 'Due Today' | 'Overdue';

export interface BankDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  pan: string;
  upiId?: string;
}

export interface RateCard {
  reel: number;
  collabReel: number;
  storeVisitReel: number;
  ugcVideo: number;
  story: number;
  carousel: number;
  adRights30d: number;
  adRights90d: number;
  adRights1y: number;
}

export interface InstagramInsightsSnapshot {
  monthYear: string; // e.g. "August 2026"
  followersCount?: number;
  monthlyReach?: number;
  engagementRate?: number;
  views30d: number;
  reach30d: number;
  accountsEngaged?: number;
  interactions30d: number;
  topAgeGroup: string; // e.g. "18-34 (78%)"
  genderDistribution: string; // e.g. "Male 72% / Female 28%"
  topCities: string | string[]; // e.g. "Mumbai, Bengaluru, Delhi"
  dateRangeText?: string;
}

export interface MediaKitFeaturedReel {
  id: string;
  title: string;
  brandName?: string;
  campaignName?: string;
  views: number;
  reelUrl: string;
  thumbnailUrl?: string;
  platform?: string;
  publishDate?: string;
  description?: string;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  city: string;
  avatarUrl: string;
  bio: string;
  email: string;
  phone: string;
  pan: string;
  username: string; // login username
  password: string; // login password
  accountStatus?: 'active' | 'disabled'; // account enabled/disabled status
  address: string;
  bankDetails: BankDetails;
  rateCard: RateCard;
  mediaKitBio?: string;
  followersCount?: number;
  monthlyInsightsSnapshots: InstagramInsightsSnapshot[];
  mediaKitFeaturedReels?: MediaKitFeaturedReel[];
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  contactPerson: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Deliverable {
  id: string;
  title: string;
  completed: boolean;
}

export interface PerformanceMetrics {
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  interactions: number;
}

export interface FollowUpRecord {
  id: string;
  date: string;
  contactPerson: string;
  note: string;
  nextFollowUpDate: string;
}

export interface CampaignActivity {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
}

export interface Campaign {
  id: string;
  influencerId: string;
  brandId: string;
  brandName: string;
  campaignName: string;
  dealAmount: number;
  dealLockedDate: string;
  liveDate?: string;
  paymentTermsDays: number; // e.g. 30, 45, 60
  paymentTermsText?: string; // e.g. "100% Before Live", "Within 15 Days After Live", custom
  paymentEtaDate?: string;
  paymentEtaNotes?: string;
  contentLiveDate?: string;
  invoiceSubmittedDate?: string;
  paymentDueDate?: string;
  calculatedDueDate?: string;
  paymentReceivedDate?: string;
  amountReceived?: number;
  amountPending?: number;
  paymentNotes?: string;
  trackingLink?: string;
  contactPerson?: string;
  contactNumber?: string;
  contactEmail?: string;
  campaignStartDate?: string;
  contentDeadline?: string;
  goLiveDate?: string;
  usageRights?: string;
  adRights?: string;
  internalNotes?: string;
  productionStatus: ProductionStatus;
  paymentStatus: PaymentStatus;
  deliverables: Deliverable[];
  liveLink?: string;
  notes?: string;
  metrics?: PerformanceMetrics;
  followUps: FollowUpRecord[];
  activities: CampaignActivity[];
}

export interface Expense {
  id: string;
  title: string;
  category: 'Software' | 'Travel' | 'Equipment' | 'Agency Fee' | 'Misc';
  amount: number;
  date: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  type: 'PAYMENT_DUE' | 'APPROVAL_NEEDED' | 'LIVE_DATE' | 'FOLLOWUP_DUE';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  campaignId?: string;
  urgency?: PaymentUrgency;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  campaignId: string;
  influencerId: string;
  invoiceDate: string;
  invoiceTo: string; // Brand company name / billing info
  paymentTo: string; // Influencer name / entity
  serviceDescription: string;
  quantity: number;
  amount: number;
  totalDue: number;
}

export type MediaKitTheme = 
  | 'dark-tech'
  | 'electric-neon'
  | 'royal-luxury'
  | 'ocean-breeze'
  | 'sunset-gold'
  | 'clean-minimal'
  | 'rose-gold-luxury'
  | 'cyberpunk-violet';

export type MediaKitDesignStyle = 
  | 'tech-matrix'
  | 'executive-luxury'
  | 'minimalist-modern'
  | 'creative-bold'
  | 'sidebar-split'
  | 'hero-spotlight'
  | 'magazine-editorial'
  | 'cyberpunk-hud';
