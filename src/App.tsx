import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { db } from './services/db';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickAddCampaignModal } from './components/common/QuickAddCampaignModal';
import { LoginPage } from './components/auth/LoginPage';
import { DailyWelcomeModal } from './components/auth/DailyWelcomeModal';

// Views
import { AdminDashboard } from './components/views/AdminDashboard';
import { InfluencerPortalView } from './components/views/InfluencerPortalView';
import { InfluencersView } from './components/views/InfluencersView';
import { CollaborationsView } from './components/views/CollaborationsView';
import { CalendarView } from './components/views/CalendarView';
import { PaymentsView } from './components/views/PaymentsView';
import { BrandsView } from './components/views/BrandsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { CollaborationsAnalyticsView } from './components/views/CollaborationsAnalyticsView';
import { FinancialsView } from './components/views/FinancialsView';
import { ReportsView } from './components/views/ReportsView';
import { InvoicesManagementView } from './components/views/InvoicesManagementView';
import { InvoiceGeneratorView } from './components/views/InvoiceGeneratorView';
import { MediaKitGeneratorView } from './components/views/MediaKitGeneratorView';
import { NotificationsView } from './components/views/NotificationsView';
import { ActivityLogView } from './components/views/ActivityLogView';
import { BackupView } from './components/views/BackupView';
import { SettingsView } from './components/views/SettingsView';
import { InfluencerAnalyticsView } from './components/views/InfluencerAnalyticsView';
import { CampaignDetailModal } from './components/views/CampaignDetailModal';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [activeRole, setActiveRole] = useState<'admin' | 'influencer'>(authService.getRole());
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(isSupabaseConfigured());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedAdminInfluencerId, setSelectedAdminInfluencerId] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Daily Welcome Modal State
  const [showDailyWelcome, setShowDailyWelcome] = useState<boolean>(false);

  // Global Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [invoiceCampaignId, setInvoiceCampaignId] = useState<string | undefined>(undefined);
  const [invoiceInitialId, setInvoiceInitialId] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const forceRefresh = () => setRefreshKey(prev => prev + 1);

  const handleNavigateToInvoice = (campaignId?: string, invoiceId?: string) => {
    setInvoiceCampaignId(campaignId);
    setInvoiceInitialId(invoiceId);
    setActiveTab('invoice-generator');
  };

  // Verify cloud session with Supabase Auth on launch/reload
  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured()) {
      authService.initSession().then(session => {
        if (!isMounted) return;
        setIsAuthenticated(session.isAuthenticated);
        setActiveRole(authService.getRole());
        setIsCheckingAuth(false);
      }).catch(() => {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
      });
    } else {
      setIsCheckingAuth(false);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to live Supabase Auth state changes (e.g. token revocation, session expiry, external signout)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        authService.clearSession();
        setIsAuthenticated(false);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check Daily Welcome status when authenticating or loading session
  useEffect(() => {
    if (isAuthenticated) {
      const session = authService.getSession();
      if (session.userId && authService.shouldShowDailyWelcome(session.userId)) {
        setShowDailyWelcome(true);
      }
      // Ensure activeRole matches role
      if (authService.isInfluencer()) {
        setActiveRole('influencer');
        if (!authService.canAccessAdminTab(activeTab)) {
          setActiveTab('portal-dashboard');
        }
      } else {
        setActiveRole('admin');
      }
    }
  }, [isAuthenticated, refreshKey]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const session = authService.getSession();
    const role = authService.getRole();
    setActiveRole(role);

    if (role === 'influencer') {
      setActiveTab('portal-dashboard');
    } else {
      setActiveTab('dashboard');
    }

    if (session.userId && authService.shouldShowDailyWelcome(session.userId)) {
      setShowDailyWelcome(true);
    }
    forceRefresh();
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setShowDailyWelcome(false);
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isAuthenticated) {
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  // Loading gate while verifying cloud credentials against Supabase Auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#070a11] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-cyan-400/30 to-indigo-600/30 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-xs font-mono text-cyan-400 tracking-wider">VERIFYING SECURE SESSION...</div>
        </div>
      </div>
    );
  }

  // STRICT REQUIREMENT 3 & 6: Zero public/guest access. Unauthenticated users must never see the dashboard.
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col font-sans">
      {/* Daily Welcome Modal */}
      {showDailyWelcome && (
        <DailyWelcomeModal onClose={() => setShowDailyWelcome(false)} />
      )}

      {/* Header */}
      <Header
        onNavigateTab={tab => {
          if (authService.isInfluencer() && !authService.canAccessAdminTab(tab)) {
            setActiveTab('portal-dashboard');
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onRefresh={forceRefresh}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={tab => {
            if (authService.isInfluencer() && !authService.canAccessAdminTab(tab)) {
              setActiveTab('portal-dashboard');
            } else {
              setActiveTab(tab);
            }
          }}
          onLogout={handleLogout}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {activeRole === 'admin' ? (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  onSelectCampaign={setSelectedCampaignId}
                  onNavigateTab={setActiveTab}
                  selectedAdminInfluencerId={selectedAdminInfluencerId}
                />
              )}
              {activeTab === 'influencers' && <InfluencersView />}
              {activeTab === 'collaborations' && (
                <CollaborationsView
                  onSelectCampaign={setSelectedCampaignId}
                  onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                />
              )}
              {activeTab === 'calendar' && (
                <CalendarView
                  onSelectCampaign={setSelectedCampaignId}
                  selectedAdminInfluencerId={selectedAdminInfluencerId}
                />
              )}
              {activeTab === 'payments' && (
                <PaymentsView
                  onSelectCampaign={setSelectedCampaignId}
                  selectedAdminInfluencerId={selectedAdminInfluencerId}
                />
              )}
              {activeTab === 'brands' && <BrandsView />}
              {(activeTab === 'analytics-revenue' || activeTab === 'analytics') && <AnalyticsView />}
              {activeTab === 'collab-analytics' && <CollaborationsAnalyticsView />}
              {activeTab === 'financials' && <FinancialsView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'invoices' && (
                <InvoicesManagementView
                  onNavigateToGenerator={(invId, campId) => handleNavigateToInvoice(campId, invId)}
                />
              )}
              {activeTab === 'invoice-generator' && (
                <InvoiceGeneratorView
                  initialCampaignId={invoiceCampaignId}
                  initialInvoiceId={invoiceInitialId}
                  onNavigateToInvoices={() => setActiveTab('invoices')}
                />
              )}
              {activeTab === 'mediakits' && <MediaKitGeneratorView />}
              {activeTab === 'notifications' && (
                <NotificationsView onSelectCampaign={setSelectedCampaignId} />
              )}
              {activeTab === 'activity' && <ActivityLogView />}
              {activeTab === 'backup' && <BackupView />}
              {activeTab === 'settings' && <SettingsView />}
            </>
          ) : (
            /* Influencer Portal Views (Strict Data Isolation) */
            <>
              {(activeTab === 'portal' || activeTab === 'portal-dashboard' || activeTab === 'my-insights') && (
                <InfluencerPortalView onSelectCampaign={setSelectedCampaignId} />
              )}
              {activeTab === 'portal-analytics' && <CollaborationsAnalyticsView />}
              {activeTab === 'my-collaborations' && (
                <CollaborationsView
                  onSelectCampaign={setSelectedCampaignId}
                  onOpenQuickAdd={() => {}}
                />
              )}
              {activeTab === 'portal-calendar' && (
                <CalendarView
                  onSelectCampaign={setSelectedCampaignId}
                  selectedAdminInfluencerId={authService.getActiveInfluencer()?.id}
                />
              )}
              {activeTab === 'portal-payments' && (
                <PaymentsView
                  onSelectCampaign={setSelectedCampaignId}
                  selectedAdminInfluencerId={authService.getActiveInfluencer()?.id}
                />
              )}
              {activeTab === 'my-rate-card' && (
                <div className="space-y-6 pb-12">
                  <div className="bg-tech-card border border-tech-border rounded-2xl p-6 space-y-4 max-w-2xl">
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <span className="text-cyan-400 font-mono">₹</span> Official Commercial Rate Card
                    </h2>
                    <p className="text-xs text-slate-400">
                      Your saved commercial rate card as registered with talent manager.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center pt-2 font-mono">
                      <div className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-sans">Single Reel</span>
                        <span className="text-lg font-bold text-slate-100">
                          ₹{(authService.getActiveInfluencer()?.rateCard.reel || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-3 bg-[#0b0f17] border border-cyan-500/30 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-sans">Collab Reel</span>
                        <span className="text-lg font-bold text-cyan-400">
                          ₹{(authService.getActiveInfluencer()?.rateCard.collabReel || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-3 bg-[#0b0f17] border border-indigo-500/30 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-sans">Store Visit Reel</span>
                        <span className="text-lg font-bold text-indigo-400">
                          ₹{(authService.getActiveInfluencer()?.rateCard.storeVisitReel || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCampaign={setSelectedCampaignId}
      />

      <QuickAddCampaignModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {
          forceRefresh();
        }}
      />

      <CampaignDetailModal
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
        onNavigateToInvoice={(campId) => handleNavigateToInvoice(campId)}
        onRefresh={forceRefresh}
      />
    </div>
  );
};
