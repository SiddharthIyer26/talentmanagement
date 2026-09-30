import {
  Influencer,
  Brand,
  Campaign,
  Expense,
  AppNotification,
  Invoice,
  PaymentUrgency,
  ProductionStatus,
  InstagramInsightsSnapshot,
  MediaKitFeaturedReel,
  ManagementUser
} from '../types';

const LOCAL_STORAGE_KEY = 'talent_os_db_v1';

export interface DatabaseSchema {
  influencers: Influencer[];
  managementUsers?: ManagementUser[];
  brands: Brand[];
  campaigns: Campaign[];
  expenses: Expense[];
  notifications: AppNotification[];
  invoices: Invoice[];
  invoiceSeqCounter: number;
}

const SEED_DATA: DatabaseSchema = {
  invoiceSeqCounter: 1042,
  influencers: [
    {
      id: 'inf-1',
      name: 'JD Tech',
      handle: '@jdtech_official',
      city: 'Bengaluru, India',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Deep-dive technology analyst, flagship smartphone reviews, AI workflow breakdowns & smart gadget ecosystem walkthroughs.',
      email: 'collabs@jdtech.in',
      phone: '+91 98765 43210',
      pan: 'ABCDE1234F',
      username: 'jdtech',
      password: 'password123',
      address: 'Suite 402, Cyber Heights, Indiranagar, Bengaluru - 560038',
      bankDetails: {
        accountName: 'JD Tech Media Private Limited',
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200049281042',
        ifsc: 'HDFC0001245',
        pan: 'ABCDE1234F',
        upiId: 'jdtech@hdfcbank'
      },
      rateCard: {
        reel: 85000,
        collabReel: 110000,
        storeVisitReel: 125000,
        ugcVideo: 60000,
        story: 25000,
        carousel: 45000,
        adRights30d: 35000,
        adRights90d: 80000,
        adRights1y: 200000
      },
      mediaKitBio: 'Leading tech storyteller with 850K+ engaged followers across platforms. Specializing in high-converting video production and authentic product teardowns.',
      monthlyInsightsSnapshots: [
        {
          monthYear: 'August 2026',
          views30d: 4200000,
          reach30d: 3100000,
          interactions30d: 680000,
          topAgeGroup: '18–34 (82%)',
          genderDistribution: 'Male 76% / Female 24%',
          topCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad'],
          dateRangeText: '1 Aug 2026 – 27 Aug 2026'
        },
        {
          monthYear: 'July 2026',
          views30d: 3850000,
          reach30d: 2850000,
          interactions30d: 590000,
          topAgeGroup: '18–34 (81%)',
          genderDistribution: 'Male 75% / Female 25%',
          topCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune'],
          dateRangeText: '1 Jul 2026 – 31 Jul 2026'
        }
      ]
    },
    {
      id: 'inf-2',
      name: 'TechCraft Pro (Aarav Sharma)',
      handle: '@techcraft_aarav',
      city: 'Delhi NCR, India',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: 'Custom PC builder, GPU benchmarking specialist & desktop hardware enthusiast.',
      email: 'aarav@techcraftpro.com',
      phone: '+91 98111 22334',
      pan: 'BCDEF2345G',
      username: 'techcraft',
      password: 'password123',
      address: '72 Cyber City, Sector 24, Gurugram - 122002',
      bankDetails: {
        accountName: 'TechCraft Digital Studio',
        bankName: 'ICICI Bank',
        accountNumber: '002105991823',
        ifsc: 'ICIC0000021',
        pan: 'BCDEF2345G',
        upiId: 'techcraft@icici'
      },
      rateCard: {
        reel: 65000,
        collabReel: 90000,
        storeVisitReel: 95000,
        ugcVideo: 45000,
        story: 18000,
        carousel: 35000,
        adRights30d: 25000,
        adRights90d: 60000,
        adRights1y: 140000
      },
      monthlyInsightsSnapshots: [
        {
          monthYear: 'August 2026',
          views30d: 2400000,
          reach30d: 1900000,
          interactions30d: 390000,
          topAgeGroup: '18–28 (88%)',
          genderDistribution: 'Male 84% / Female 16%',
          topCities: ['Delhi NCR', 'Bengaluru', 'Chandigarh', 'Jaipur'],
          dateRangeText: '1 Aug 2026 – 27 Aug 2026'
        }
      ]
    },
    {
      id: 'inf-3',
      name: 'GadgetVision (Priya Nair)',
      handle: '@gadgetvision_priya',
      city: 'Mumbai, India',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      bio: 'Consumer audio tech, smartwatch ecosystem & lifestyle wearable tech reviews.',
      email: 'priya@gadgetvision.in',
      phone: '+91 97654 32109',
      pan: 'CDEFG3456H',
      username: 'gadgetvision',
      password: 'password123',
      address: '14 Bandra Kurla Complex, Mumbai - 400051',
      bankDetails: {
        accountName: 'Priya Nair Media',
        bankName: 'Axis Bank',
        accountNumber: '91802003881920',
        ifsc: 'UTIB0000015',
        pan: 'CDEFG3456H'
      },
      rateCard: {
        reel: 70000,
        collabReel: 95000,
        storeVisitReel: 110000,
        ugcVideo: 50000,
        story: 20000,
        carousel: 40000,
        adRights30d: 30000,
        adRights90d: 70000,
        adRights1y: 160000
      },
      monthlyInsightsSnapshots: [
        {
          monthYear: 'August 2026',
          views30d: 3100000,
          reach30d: 2400000,
          interactions30d: 480000,
          topAgeGroup: '21–35 (79%)',
          genderDistribution: 'Male 62% / Female 38%',
          topCities: ['Mumbai', 'Bengaluru', 'Chennai', 'Kochi'],
          dateRangeText: '1 Aug 2026 – 27 Aug 2026'
        }
      ]
    },
    {
      id: 'inf-4',
      name: 'FutureByte (Rohan Mehta)',
      handle: '@futurebyte_rohan',
      city: 'Hyderabad, India',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      bio: 'DevOps tools, M3 Mac Studio setups, AI coding assistants & cloud tech stack reviews.',
      email: 'rohan@futurebyte.io',
      phone: '+91 99887 76655',
      pan: 'DEFGH4567I',
      username: 'futurebyte',
      password: 'password123',
      address: 'Gachibowli Tech Hub, Hyderabad - 500032',
      bankDetails: {
        accountName: 'FutureByte Media LLP',
        bankName: 'Kotak Mahindra Bank',
        accountNumber: '8812903829',
        ifsc: 'KKBK0000451',
        pan: 'DEFGH4567I'
      },
      rateCard: {
        reel: 90000,
        collabReel: 120000,
        storeVisitReel: 135000,
        ugcVideo: 65000,
        story: 28000,
        carousel: 50000,
        adRights30d: 40000,
        adRights90d: 90000,
        adRights1y: 220000
      },
      monthlyInsightsSnapshots: [
        {
          monthYear: 'August 2026',
          views30d: 4800000,
          reach30d: 3600000,
          interactions30d: 820000,
          topAgeGroup: '22–40 (85%)',
          genderDistribution: 'Male 80% / Female 20%',
          topCities: ['Hyderabad', 'Bengaluru', 'Pune', 'Noida'],
          dateRangeText: '1 Aug 2026 – 27 Aug 2026'
        }
      ]
    },
    {
      id: 'inf-5',
      name: 'VoltTech (Ananya Gupta)',
      handle: '@volttech_ananya',
      city: 'Pune, India',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      bio: 'EV tech, solar power backup stations, smart home automation & green gadgets.',
      email: 'ananya@volttech.in',
      phone: '+91 95432 10987',
      pan: 'EFGHI5678J',
      username: 'volttech',
      password: 'password123',
      address: 'Viman Nagar Tech Park, Pune - 411014',
      bankDetails: {
        accountName: 'Ananya Gupta VoltTech',
        bankName: 'State Bank of India',
        accountNumber: '30992810482',
        ifsc: 'SBIN0001423',
        pan: 'EFGHI5678J'
      },
      rateCard: {
        reel: 60000,
        collabReel: 85000,
        storeVisitReel: 90000,
        ugcVideo: 40000,
        story: 15000,
        carousel: 30000,
        adRights30d: 20000,
        adRights90d: 50000,
        adRights1y: 120000
      },
      monthlyInsightsSnapshots: [
        {
          monthYear: 'August 2026',
          views30d: 1950000,
          reach30d: 1500000,
          interactions30d: 310000,
          topAgeGroup: '25–44 (75%)',
          genderDistribution: 'Male 68% / Female 32%',
          topCities: ['Pune', 'Bengaluru', 'Ahmedabad', 'Surat'],
          dateRangeText: '1 Aug 2026 – 27 Aug 2026'
        }
      ]
    }
  ],
  brands: [
    {
      id: 'brand-1',
      name: 'GoBoult',
      contactPerson: 'Saurabh Malhotra (Brand Marketing Lead)',
      email: 'saurabh.m@goboult.com',
      phone: '+91 98200 11223',
      notes: 'Key focus on high-energy audio launch reels and wireless gaming earbuds.'
    },
    {
      id: 'brand-2',
      name: 'Samsung India',
      contactPerson: 'Neha Kapoor (Influencer Relations Manager)',
      email: 'neha.kapoor@samsung.com',
      phone: '+91 98100 44556',
      notes: 'Strict 45-day payment cycle. Focus on Galaxy Z Fold & S-Series AI features.'
    },
    {
      id: 'brand-3',
      name: 'Keychron Keyboards',
      contactPerson: 'David Chen (APAC Regional Marketing)',
      email: 'david@keychron.com',
      phone: '+1 415 892 1092',
      notes: 'Mechanical keyboard enthusiast launches & desk setup integration.'
    },
    {
      id: 'brand-4',
      name: 'OnePlus',
      contactPerson: 'Rahul Sen (Creator Ecosystem Manager)',
      email: 'rahul.sen@oneplus.com',
      phone: '+91 97110 99887',
      notes: 'Flagship phone launch collabs and OxygenOS workflow reels.'
    },
    {
      id: 'brand-5',
      name: 'ASUS ROG',
      contactPerson: 'Tanvi Shah (Gaming Ecosystem Lead)',
      email: 'tanvi_shah@asus.com',
      phone: '+91 98334 55667',
      notes: 'ROG Ally X & Zephyrus laptop creator campaigns.'
    }
  ],
  campaigns: [
    {
      id: 'camp-101',
      influencerId: 'inf-1',
      brandId: 'brand-1',
      brandName: 'GoBoult',
      campaignName: 'JD Tech × GoBoult Mustang Wireless ANC Earbuds Launch',
      dealAmount: 110000,
      dealLockedDate: '2026-07-10',
      liveDate: '2026-07-25',
      paymentTermsDays: 30,
      calculatedDueDate: '2026-08-24', // Past due date -> Overdue
      productionStatus: 'Video Published',
      paymentStatus: 'Pending',
      deliverables: [
        { id: 'd1', title: '1x Collab Reel (High Energy Unboxing)', completed: true },
        { id: 'd2', title: '2x Instagram Story with Tracked Purchase Link', completed: true },
        { id: 'd3', title: '30-Day Digital Ad Usage Rights', completed: true }
      ],
      liveLink: 'https://instagram.com/reel/C8x92KdJDTech_GoBoult',
      notes: 'Client requested raw audio microphone test in noisy outdoor setting. Delivered exceptional performance.',
      metrics: {
        views: 890000,
        likes: 74200,
        comments: 1850,
        saves: 12400,
        shares: 6300,
        reach: 750000,
        interactions: 94750
      },
      followUps: [
        {
          id: 'fu-1',
          date: '2026-08-25',
          contactPerson: 'Saurabh Malhotra',
          note: 'Sent invoice follow-up mail regarding 30-day term completion.',
          nextFollowUpDate: '2026-08-28'
        }
      ],
      activities: [
        { id: 'a1', timestamp: '2026-07-10 11:30', actor: 'Manager', action: 'Campaign record locked and created' },
        { id: 'a2', timestamp: '2026-07-18 16:00', actor: 'JD Tech', action: 'Draft video uploaded for client preview' },
        { id: 'a3', timestamp: '2026-07-20 14:15', actor: 'Manager', action: 'Client approval received from Saurabh' },
        { id: 'a4', timestamp: '2026-07-25 18:00', actor: 'JD Tech', action: 'Reel published live on Instagram' },
        { id: 'a5', timestamp: '2026-08-25 10:00', actor: 'Manager', action: 'Recorded payment reminder follow-up' }
      ]
    },
    {
      id: 'camp-102',
      influencerId: 'inf-1',
      brandId: 'brand-2',
      brandName: 'Samsung India',
      campaignName: 'JD Tech × Samsung Galaxy Z Fold6 AI Workflow Showcase',
      dealAmount: 185000,
      dealLockedDate: '2026-08-01',
      liveDate: '2026-08-15',
      paymentTermsDays: 45,
      calculatedDueDate: '2026-09-29', // Due in future
      productionStatus: 'Video Published',
      paymentStatus: 'Pending',
      deliverables: [
        { id: 'd1', title: '1x Main Reel (Multitasking & Galaxy AI)', completed: true },
        { id: 'd2', title: '1x Collab Reel with Samsung India', completed: true },
        { id: 'd3', title: '3x Instagram Story Highlights', completed: true }
      ],
      liveLink: 'https://instagram.com/reel/C9Fold6JDTech',
      notes: 'Highlights Sketch to Image AI feature & dual-screen interpreter mode.',
      metrics: {
        views: 1250000,
        likes: 112000,
        comments: 3100,
        saves: 28900,
        shares: 14200,
        reach: 1100000,
        interactions: 158200
      },
      followUps: [],
      activities: [
        { id: 'a1', timestamp: '2026-08-01 10:00', actor: 'Manager', action: 'Campaign created' },
        { id: 'a2', timestamp: '2026-08-15 19:30', actor: 'JD Tech', action: 'Video published' }
      ]
    },
    {
      id: 'camp-103',
      influencerId: 'inf-1',
      brandId: 'brand-3',
      brandName: 'Keychron Keyboards',
      campaignName: 'JD Tech × Keychron Q1 Max Custom Desk Build',
      dealAmount: 75000,
      dealLockedDate: '2026-08-12',
      liveDate: '2026-08-27',
      paymentTermsDays: 30,
      calculatedDueDate: '2026-09-26',
      productionStatus: 'Waiting for Approval',
      paymentStatus: 'Pending',
      deliverables: [
        { id: 'd1', title: '1x Aesthetic Desk Setup Reel', completed: true },
        { id: 'd2', title: 'ASMR Sound Test Story with link', completed: false }
      ],
      notes: 'Waiting for client sign-off on sound test grading.',
      followUps: [],
      activities: [
        { id: 'a1', timestamp: '2026-08-12 14:00', actor: 'Manager', action: 'Campaign initialized' },
        { id: 'a2', timestamp: '2026-08-26 12:00', actor: 'JD Tech', action: 'Video draft submitted for review' }
      ]
    },
    {
      id: 'camp-104',
      influencerId: 'inf-2',
      brandId: 'brand-5',
      brandName: 'ASUS ROG',
      campaignName: 'TechCraft Pro × ROG Ally X Handheld Gaming Review',
      dealAmount: 95000,
      dealLockedDate: '2026-07-28',
      liveDate: '2026-08-10',
      paymentTermsDays: 15,
      calculatedDueDate: '2026-08-25', // Overdue by 3 days
      productionStatus: 'Video Published',
      paymentStatus: 'Pending',
      deliverables: [
        { id: 'd1', title: '1x Hands-on Benchmark Reel', completed: true },
        { id: 'd2', title: '1x YouTube Short', completed: true }
      ],
      liveLink: 'https://instagram.com/reel/C8rogAllyTechcraft',
      metrics: {
        views: 640000,
        likes: 58000,
        comments: 1200,
        saves: 8500,
        shares: 4100,
        reach: 580000,
        interactions: 71800
      },
      followUps: [
        {
          id: 'fu-2',
          date: '2026-08-26',
          contactPerson: 'Tanvi Shah',
          note: 'Followed up via WhatsApp. Tanvi confirmed payment is in accounts processing.',
          nextFollowUpDate: '2026-08-29'
        }
      ],
      activities: [
        { id: 'a1', timestamp: '2026-07-28 09:30', actor: 'Manager', action: 'Campaign added' },
        { id: 'a2', timestamp: '2026-08-10 18:00', actor: 'TechCraft Pro', action: 'Reel went live' }
      ]
    },
    {
      id: 'camp-105',
      influencerId: 'inf-3',
      brandId: 'brand-1',
      brandName: 'GoBoult',
      campaignName: 'GadgetVision × GoBoult Smartwatch Fitness Reel',
      dealAmount: 80000,
      dealLockedDate: '2026-08-05',
      liveDate: '2026-08-18',
      paymentTermsDays: 30,
      calculatedDueDate: '2026-09-17',
      paymentReceivedDate: '2026-08-26',
      productionStatus: 'Video Published',
      paymentStatus: 'Received',
      deliverables: [
        { id: 'd1', title: '1x Outdoor Workout Reel', completed: true },
        { id: 'd2', title: '2x Story Slides', completed: true }
      ],
      liveLink: 'https://instagram.com/reel/C9goboultPriya',
      metrics: {
        views: 520000,
        likes: 41000,
        comments: 940,
        saves: 6200,
        shares: 2800,
        reach: 480000,
        interactions: 50940
      },
      followUps: [],
      activities: [
        { id: 'a1', timestamp: '2026-08-05 15:00', actor: 'Manager', action: 'Campaign locked' },
        { id: 'a2', timestamp: '2026-08-26 11:20', actor: 'Manager', action: 'Payment ₹80,000 marked as Received' }
      ]
    },
    {
      id: 'camp-106',
      influencerId: 'inf-4',
      brandId: 'brand-4',
      brandName: 'OnePlus',
      campaignName: 'FutureByte × OnePlus Nord 4 Metal Unibody Teardown',
      dealAmount: 130000,
      dealLockedDate: '2026-08-20',
      paymentTermsDays: 30,
      productionStatus: 'Under Production',
      paymentStatus: 'Pending',
      deliverables: [
        { id: 'd1', title: '1x Cinematic Macro Teardown Reel', completed: false },
        { id: 'd2', title: '1x Developer Thermal Benchmark Story', completed: false }
      ],
      notes: 'Script approved. Shooting macro teardown footage in studio today.',
      followUps: [],
      activities: [
        { id: 'a1', timestamp: '2026-08-20 16:30', actor: 'Manager', action: 'Campaign created' },
        { id: 'a2', timestamp: '2026-08-24 10:00', actor: 'FutureByte', action: 'Moved to Under Production' }
      ]
    }
  ],
  expenses: [
    {
      id: 'exp-1',
      title: 'Studio Lighting Setup Upgrade (Aputure 300d II)',
      category: 'Equipment',
      amount: 45000,
      date: '2026-08-05',
      notes: 'Shared studio gear upgrade for high-end tech reviews.'
    },
    {
      id: 'exp-2',
      title: 'Adobe Creative Cloud Team Subscription (Aug 2026)',
      category: 'Software',
      amount: 18500,
      date: '2026-08-10',
      notes: 'Premiere Pro & After Effects editing license for 6 creators.'
    },
    {
      id: 'exp-3',
      title: 'Bangalore Creator Meetup Travel & Logistics',
      category: 'Travel',
      amount: 22000,
      date: '2026-08-18'
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      type: 'PAYMENT_DUE',
      title: 'Payment Overdue: GoBoult',
      message: 'JD Tech × GoBoult Mustang Earbuds (₹110,000) was due on 24 Aug 2026 (4 days ago).',
      timestamp: '2026-08-28 08:00',
      read: false,
      campaignId: 'camp-101',
      urgency: 'Overdue'
    },
    {
      id: 'notif-2',
      type: 'PAYMENT_DUE',
      title: 'Payment Overdue: ASUS ROG',
      message: 'TechCraft Pro × ROG Ally X (₹95,000) was due on 25 Aug 2026 (3 days ago).',
      timestamp: '2026-08-28 08:00',
      read: false,
      campaignId: 'camp-104',
      urgency: 'Overdue'
    },
    {
      id: 'notif-3',
      type: 'APPROVAL_NEEDED',
      title: 'Approval Waiting: Keychron',
      message: 'JD Tech × Keychron Q1 Max desk build reel requires final video approval.',
      timestamp: '2026-08-27 15:30',
      read: false,
      campaignId: 'camp-103'
    }
  ],
  invoices: [
    {
      id: 'inv-1041',
      invoiceNumber: 'INV-2026-1041',
      campaignId: 'camp-101',
      influencerId: 'inf-1',
      invoiceDate: '2026-07-26',
      invoiceTo: 'GoBoult India Pvt Ltd\nPlot 12, Sector 34, Gurugram, Haryana - 122001\nGSTIN: 07AABCG1234H1Z5',
      paymentTo: 'JD Tech Media Private Limited',
      serviceDescription: 'Influencer Marketing Services: 1x Instagram Collab Reel, 2x Story Slides & 30-Day Digital Ad Usage Rights for GoBoult Mustang Earbuds Launch.',
      quantity: 1,
      amount: 110000,
      totalDue: 110000
    }
  ]
};

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    this.recalculateAutomation();
  }

  private loadData(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load database from localStorage', e);
    }
    return JSON.parse(JSON.stringify(SEED_DATA));
  }

  private saveData() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save database to localStorage', e);
    }
  }

  public resetToSeed() {
    this.data = JSON.parse(JSON.stringify(SEED_DATA));
    this.saveData();
    this.recalculateAutomation();
    window.location.reload();
  }

  // Calculate payment due dates & payment urgency levels automatically
  public recalculateAutomation() {
    const todayStr = '2026-08-28'; // Fixed current date from system metadata
    const today = new Date(todayStr);

    this.data.campaigns.forEach(campaign => {
      // Auto calculate due date if live date and payment terms exist
      if (campaign.liveDate && campaign.paymentTermsDays) {
        const live = new Date(campaign.liveDate);
        const due = new Date(live);
        due.setDate(due.getDate() + campaign.paymentTermsDays);
        campaign.calculatedDueDate = due.toISOString().split('T')[0];
      }
      if (campaign.paymentDueDate) {
        campaign.calculatedDueDate = campaign.paymentDueDate;
      }
      // Auto calculate pending amount
      const received = campaign.amountReceived || (campaign.paymentStatus === 'Received' || campaign.paymentStatus === 'Paid' ? campaign.dealAmount : 0);
      campaign.amountPending = Math.max(0, campaign.dealAmount - received);
    });

    this.saveData();
  }

  public getPaymentUrgency(campaign: Campaign): PaymentUrgency | null {
    if (campaign.paymentStatus === 'Received' || !campaign.calculatedDueDate) {
      return null;
    }
    const todayStr = '2026-08-28';
    const dueStr = campaign.calculatedDueDate;

    if (dueStr < todayStr) return 'Overdue';
    if (dueStr === todayStr) return 'Due Today';
    
    // Calculate difference in days
    const dToday = new Date(todayStr).getTime();
    const dDue = new Date(dueStr).getTime();
    const diffDays = Math.ceil((dDue - dToday) / (1000 * 3600 * 24));

    if (diffDays <= 7) return 'Due Soon';
    return 'Upcoming';
  }

  // --- Entity Accessors ---

  public getInfluencers(): Influencer[] {
    return this.data.influencers;
  }

  public getInfluencerById(id: string): Influencer | undefined {
    return this.data.influencers.find(i => i.id === id);
  }

  public getBrands(): Brand[] {
    return this.data.brands;
  }

  public getBrandById(id: string): Brand | undefined {
    return this.data.brands.find(b => b.id === id);
  }

  public getCampaigns(): Campaign[] {
    return this.data.campaigns;
  }

  public getCampaignById(id: string): Campaign | undefined {
    return this.data.campaigns.find(c => c.id === id);
  }

  public getExpenses(): Expense[] {
    return this.data.expenses;
  }

  public getNotifications(): AppNotification[] {
    return this.data.notifications;
  }

  public getInvoices(): Invoice[] {
    return this.data.invoices;
  }

  // --- Entity Mutations ---

  public saveCampaign(campaign: Partial<Campaign>): Campaign {
    try {
      const storedAuth = localStorage.getItem('iyer_talent_os_auth_session_v2');
      if (storedAuth) {
        const session = JSON.parse(storedAuth);
        if (session && session.isAuthenticated && session.role !== 'ADMIN') {
          console.warn('Database Security: Influencer accounts are read-only for campaign records.');
          throw new Error('Unauthorized: Influencers do not have update permission for campaign data.');
        }
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Unauthorized')) {
        throw e;
      }
    }

    if (campaign.id) {
      const idx = this.data.campaigns.findIndex(c => c.id === campaign.id);
      if (idx !== -1) {
        const existing = this.data.campaigns[idx];
        const updated = { ...existing, ...campaign } as Campaign;
        
        // Add activity log if status changed
        if (campaign.productionStatus && campaign.productionStatus !== existing.productionStatus) {
          updated.activities.unshift({
            id: 'act-' + Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            actor: 'Manager',
            action: `Production status updated to ${campaign.productionStatus}`
          });
        }

        if (campaign.paymentStatus && campaign.paymentStatus !== existing.paymentStatus) {
          updated.activities.unshift({
            id: 'act-' + Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            actor: 'Manager',
            action: `Payment status changed to ${campaign.paymentStatus}`
          });
        }

        this.data.campaigns[idx] = updated;
        this.recalculateAutomation();
        return updated;
      }
    }

    // New Campaign
    const newId = 'camp-' + (100 + this.data.campaigns.length + 1);
    const newCampaign: Campaign = {
      id: newId,
      influencerId: campaign.influencerId || '',
      brandId: campaign.brandId || '',
      brandName: campaign.brandName || 'Brand',
      campaignName: campaign.campaignName || 'New Campaign',
      dealAmount: campaign.dealAmount || 0,
      dealLockedDate: campaign.dealLockedDate || new Date().toISOString().split('T')[0],
      liveDate: campaign.liveDate,
      paymentTermsDays: campaign.paymentTermsDays || 30,
      productionStatus: campaign.productionStatus || 'Locked',
      paymentStatus: campaign.paymentStatus || 'Pending',
      deliverables: campaign.deliverables || [],
      liveLink: campaign.liveLink,
      notes: campaign.notes,
      followUps: [],
      activities: [
        {
          id: 'act-' + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: 'Manager',
          action: 'Campaign created'
        }
      ]
    };

    this.data.campaigns.unshift(newCampaign);
    this.recalculateAutomation();
    return newCampaign;
  }

  public duplicateCampaign(campaignId: string): Campaign | null {
    const original = this.getCampaignById(campaignId);
    if (!original) return null;

    const copy: Partial<Campaign> = {
      influencerId: original.influencerId,
      brandId: original.brandId,
      brandName: original.brandName,
      campaignName: `${original.campaignName} (Copy)`,
      dealAmount: original.dealAmount,
      dealLockedDate: new Date().toISOString().split('T')[0],
      paymentTermsDays: original.paymentTermsDays,
      productionStatus: 'Locked',
      paymentStatus: 'Pending',
      deliverables: original.deliverables.map(d => ({ ...d, completed: false })),
      notes: original.notes
    };

    return this.saveCampaign(copy);
  }

  public addFollowUp(campaignId: string, contactPerson: string, note: string, nextFollowUpDate: string) {
    const campaign = this.getCampaignById(campaignId);
    if (!campaign) return;

    const newFU = {
      id: 'fu-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      contactPerson,
      note,
      nextFollowUpDate
    };

    campaign.followUps.unshift(newFU);
    campaign.activities.unshift({
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Manager',
      action: `Recorded brand follow-up with ${contactPerson}`
    });

    this.saveData();
  }

  public saveInfluencer(influencer: Influencer) {
    const idx = this.data.influencers.findIndex(i => i.id === influencer.id);
    if (idx !== -1) {
      this.data.influencers[idx] = influencer;
    } else {
      this.data.influencers.push(influencer);
    }
    this.saveData();
  }

  public deleteInfluencer(influencerId: string) {
    this.data.influencers = this.data.influencers.filter(i => i.id !== influencerId);
    this.saveData();
  }

  public toggleInfluencerAccountStatus(influencerId: string, status: 'active' | 'disabled') {
    const influencer = this.getInfluencerById(influencerId);
    if (influencer) {
      influencer.accountStatus = status;
      this.saveInfluencer(influencer);
    }
  }

  public addMonthlyInsightsSnapshot(influencerId: string, snapshot: InstagramInsightsSnapshot) {
    const influencer = this.getInfluencerById(influencerId);
    if (!influencer) return;
    if (!influencer.monthlyInsightsSnapshots) {
      influencer.monthlyInsightsSnapshots = [];
    }
    const idx = influencer.monthlyInsightsSnapshots.findIndex(
      s => s.monthYear.trim().toLowerCase() === snapshot.monthYear.trim().toLowerCase()
    );
    if (idx !== -1) {
      influencer.monthlyInsightsSnapshots[idx] = snapshot;
    } else {
      influencer.monthlyInsightsSnapshots.unshift(snapshot);
    }
    this.saveInfluencer(influencer);
  }

  public getManagementUsers(): ManagementUser[] {
    if (!this.data.managementUsers || this.data.managementUsers.length === 0) {
      this.data.managementUsers = [
        {
          id: 'mgmt-1',
          name: 'Siddharth Iyer',
          email: 'siddharth@iyer.tech',
          phone: '+91 98765 43210',
          username: 'admin',
          password: 'admin123',
          role: 'Owner',
          accountStatus: 'active'
        },
        {
          id: 'mgmt-2',
          name: 'Rahul Varma',
          email: 'rahul@iyer.tech',
          phone: '+91 98123 45678',
          username: 'partner1',
          password: 'partner123',
          role: 'Partner',
          accountStatus: 'active'
        }
      ];
      this.saveData();
    }
    return this.data.managementUsers;
  }

  public saveManagementUser(user: ManagementUser) {
    const users = this.getManagementUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.data.managementUsers = users;
    this.saveData();
  }

  public deleteManagementUser(userId: string) {
    const users = this.getManagementUsers().filter(u => u.id !== userId);
    this.data.managementUsers = users;
    this.saveData();
  }

  public toggleManagementUserStatus(userId: string, status: 'active' | 'disabled') {
    const users = this.getManagementUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.accountStatus = status;
      this.saveManagementUser(user);
    }
  }


  public saveBrand(brand: Brand) {
    const idx = this.data.brands.findIndex(b => b.id === brand.id);
    if (idx !== -1) {
      this.data.brands[idx] = brand;
    } else {
      this.data.brands.push(brand);
    }
    this.saveData();
  }

  public saveExpense(expense: Expense) {
    this.data.expenses.unshift(expense);
    this.saveData();
  }

  public markNotificationRead(id: string) {
    const n = this.data.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.saveData();
    }
  }

  public generateInvoice(campaignId: string, invoiceDate: string, invoiceTo: string, serviceDescription: string): Invoice {
    const campaign = this.getCampaignById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    const influencer = this.getInfluencerById(campaign.influencerId);

    const seq = this.data.invoiceSeqCounter++;
    const invNum = `INV-2026-${seq}`;

    const newInvoice: Invoice = {
      id: 'inv-' + seq,
      invoiceNumber: invNum,
      campaignId: campaign.id,
      influencerId: campaign.influencerId,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      invoiceTo: invoiceTo || campaign.brandName,
      paymentTo: influencer?.bankDetails.accountName || influencer?.name || 'Talent Management',
      serviceDescription: serviceDescription || `${campaign.campaignName} deliverables`,
      quantity: 1,
      amount: campaign.dealAmount,
      totalDue: campaign.dealAmount
    };

    this.data.invoices.unshift(newInvoice);
    this.saveData();
    return newInvoice;
  }

  // --- Financial Summary Helpers ---

  public getFinancialMetrics(influencerIdFilter?: string) {
    let campaigns = this.data.campaigns;
    let expenses = this.data.expenses;

    if (influencerIdFilter) {
      campaigns = campaigns.filter(c => c.influencerId === influencerIdFilter);
    }

    const totalRevenue = campaigns.reduce((acc, c) => acc + c.dealAmount, 0);
    const paymentsReceived = campaigns
      .filter(c => c.paymentStatus === 'Received')
      .reduce((acc, c) => acc + c.dealAmount, 0);
    const pendingPayments = campaigns
      .filter(c => c.paymentStatus === 'Pending')
      .reduce((acc, c) => acc + c.dealAmount, 0);

    const overduePayments = campaigns
      .filter(c => c.paymentStatus === 'Pending' && this.getPaymentUrgency(c) === 'Overdue')
      .reduce((acc, c) => acc + c.dealAmount, 0);

    const totalExpenses = influencerIdFilter ? 0 : expenses.reduce((acc, e) => acc + e.amount, 0);
    const netEarnings = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      paymentsReceived,
      pendingPayments,
      overduePayments,
      totalExpenses,
      netEarnings
    };
  }

  // --- Media Kit Featured Reels Helpers ---

  public getFeaturedReelsByInfluencerId(influencerId: string): MediaKitFeaturedReel[] {
    const influencer = this.getInfluencerById(influencerId);
    if (!influencer) return [];

    if (influencer.mediaKitFeaturedReels && influencer.mediaKitFeaturedReels.length >= 0) {
      return influencer.mediaKitFeaturedReels;
    }

    // Auto-seed from existing campaigns if custom list doesn't exist yet
    const campaigns = this.getCampaigns().filter(c => c.influencerId === influencerId);
    const seeded: MediaKitFeaturedReel[] = campaigns.map((c: Campaign, i: number) => ({
      id: `mkr-${c.id}`,
      title: `${c.brandName} × ${c.campaignName}`,
      brandName: c.brandName,
      campaignName: c.campaignName,
      views: c.metrics?.views || (850000 + i * 400000),
      reelUrl: c.liveLink || 'https://instagram.com/reel/demo',
      platform: 'Instagram',
      publishDate: c.liveDate || c.dealLockedDate
    }));

    return seeded;
  }

  public saveFeaturedReels(influencerId: string, reels: MediaKitFeaturedReel[]): void {
    const influencer = this.getInfluencerById(influencerId);
    if (influencer) {
      influencer.mediaKitFeaturedReels = reels;
      this.saveData();
    }
  }

  public exportBackupJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public importBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.influencers && parsed.campaigns) {
        this.data = parsed;
        this.saveData();
        window.location.reload();
        return true;
      }
    } catch (e) {
      console.error('Invalid backup format', e);
    }
    return false;
  }
}

export const db = new DatabaseService();
