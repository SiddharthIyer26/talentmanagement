import React from 'react';
import { authService } from '../../services/authService';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  CreditCard,
  Building2,
  BarChart3,
  IndianRupee,
  FileSpreadsheet,
  FileText,
  Palette,
  Bell,
  History,
  Database,
  Settings,
  Clock,
  LogOut,
  X,
  Sparkles,
  PieChart
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  currentTab?: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentTab,
  onSelectTab,
  onLogout,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const tabToHighlight = activeTab || currentTab || 'dashboard';
  const isAdmin = authService.isAdmin();
  const activeInfluencer = authService.getActiveInfluencer();

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'influencers', label: 'Influencers Roster', icon: Users },
    { id: 'collaborations', label: 'Collaborations', icon: Briefcase },
    { id: 'calendar', label: 'Calendar Grid', icon: Calendar },
    { id: 'payments', label: 'Payments Tracker', icon: CreditCard },
    { id: 'brands', label: 'Brands CRM', icon: Building2 },
    { id: 'analytics-revenue', label: 'Revenue Analytics', icon: BarChart3 },
    { id: 'collab-analytics', label: 'Collab Analytics', icon: PieChart },
    { id: 'financials', label: 'Revenue', icon: IndianRupee },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'mediakits', label: 'Media Kit Generator', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity Log', icon: History },
    { id: 'backup', label: 'Data Backup', icon: Database },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  // Combined Influencer Navigation Items
  const influencerNavItems = [
    { id: 'portal-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-collaborations', label: 'My Collaborations', icon: Briefcase },
    { id: 'portal-analytics', label: 'Collaborations Analytics', icon: BarChart3 },
    { id: 'portal-calendar', label: 'Calendar', icon: Calendar },
    { id: 'portal-payments', label: 'Payments', icon: CreditCard },
    { id: 'my-rate-card', label: 'My Rate Card', icon: IndianRupee },
  ];

  const navItems = isAdmin ? adminNavItems : influencerNavItems;

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <>
      <div className="p-3 overflow-y-auto flex-1">
        {!isAdmin && activeInfluencer && (
          <div className="mb-4 p-3 bg-tech-card border border-tech-border rounded-xl flex items-center space-x-3 shadow-md">
            <img
              src={activeInfluencer.avatarUrl}
              alt={activeInfluencer.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400"
            />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-100 truncate">{activeInfluencer.name}</h4>
              <p className="text-[10px] text-cyan-400 font-mono truncate">{activeInfluencer.handle}</p>
            </div>
          </div>
        )}

        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          {isAdmin ? 'Talent Operations' : 'Personal Workspace'}
        </div>

        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = tabToHighlight === item.id || tabToHighlight.startsWith(`${item.id}:`);

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-400 border border-cyan-500/30 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Logout Action */}
      <div className="p-3 border-t border-tech-border bg-[#0b0f17]/80 text-[10px] space-y-2 shrink-0">
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>

        <div className="flex items-center justify-between text-slate-500 pt-1">
          <span className="font-mono text-cyan-400 font-bold">IYER TALENT OS</span>
          <span className="text-slate-400 font-semibold">
            {isAdmin ? '🔑 Admin Mode' : '🔒 Creator Isolated'}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible only on md: screens and above) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0e1420] border-r border-tech-border justify-between h-[calc(100vh-57px)] sticky top-[57px] shrink-0">
        {navContent}
      </aside>

      {/* MOBILE DRAWER OVERLAY (Visible on screens < md when open) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer Sidebar Content */}
          <aside className="relative w-72 max-w-[80vw] bg-[#0e1420] border-r border-tech-border h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Mobile Drawer Header */}
            <div className="p-3 border-b border-tech-border flex items-center justify-between bg-[#0b0f17]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-bold text-xs text-white">NAVIGATION MENU</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-tech-card border border-tech-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
