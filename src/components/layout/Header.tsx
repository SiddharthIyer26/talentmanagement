import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { db } from '../../services/db';
import {
  Bell,
  Search,
  Plus,
  Shield,
  ChevronDown,
  Sparkles,
  LogOut,
  User,
  Menu
} from 'lucide-react';

interface HeaderProps {
  onNavigateTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenQuickAdd: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateTab,
  onOpenSearch,
  onOpenQuickAdd,
  onRefresh,
  onLogout,
  onToggleMobileMenu
}) => {
  const session = authService.getSession();
  const currentRole = authService.getRole();
  const activeInfluencer = authService.getActiveInfluencer();
  const influencers = db.getInfluencers();
  const canSwitchRole = authService.canSwitchRole();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const notifications = db.getNotifications().filter(n => !n.read);

  const handleRoleSwitch = (role: 'admin' | 'influencer', influencerId?: string) => {
    if (!canSwitchRole) return;
    if (role === 'admin') {
      authService.setAdminRole();
      onNavigateTab('dashboard');
    } else if (influencerId) {
      authService.setInfluencerRole(influencerId);
      onNavigateTab('portal-dashboard');
    }
    setIsRoleDropdownOpen(false);
    onRefresh();
  };

  return (
    <header className="bg-[#0b0f17]/90 backdrop-blur-md border-b border-tech-border sticky top-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Left Side: Mobile Hamburger Menu & Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-300 hover:text-cyan-400 bg-tech-card border border-tech-border rounded-xl md:hidden transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 shadow-lg shadow-cyan-500/20 shrink-0 border border-tech-border/60 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="IYER TALENT OS" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white font-mono truncate">
                IYER TALENT OS
              </h1>
              <span className="px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                v2.5
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Technology Influencer Operations & Commercial Workspace
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Search Ctrl+K */}
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-2 bg-tech-card hover:bg-slate-800 border border-tech-border text-slate-300 px-3 py-1.5 rounded-xl text-xs transition-colors hidden sm:flex"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search campaigns...</span>
            <kbd className="bg-[#0b0f17] text-[10px] text-slate-400 px-1.5 py-0.5 rounded border border-tech-border font-mono">
              Ctrl K
            </kbd>
          </button>

          {/* Quick Add Campaign Button (Admin Only) */}
          {currentRole === 'admin' && (
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center space-x-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Campaign</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => onNavigateTab('notifications')}
            className="relative p-2 text-slate-400 hover:text-cyan-400 bg-tech-card border border-tech-border rounded-xl transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Role & User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center space-x-2 bg-tech-card hover:bg-slate-800 border border-tech-border p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs transition-all"
            >
              {currentRole === 'admin' ? (
                <>
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-200 hidden md:inline">{session.name || 'Admin Mode'}</span>
                </>
              ) : (
                <>
                  <img
                    src={activeInfluencer?.avatarUrl}
                    alt={activeInfluencer?.name}
                    className="w-5 h-5 rounded-full object-cover border border-cyan-400"
                  />
                  <span className="font-bold text-cyan-400 hidden md:inline">
                    {activeInfluencer?.name}
                  </span>
                </>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* User & Role Menu Dropdown */}
            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-tech-card border border-tech-border rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 bg-[#0b0f17] rounded-xl border border-tech-border mb-1">
                  <div className="font-bold text-slate-100">{session.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">Role: {session.role}</div>
                </div>

                {canSwitchRole && (
                  <>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Switch Portal View
                    </div>

                    {/* Switch to Admin */}
                    <button
                      onClick={() => handleRoleSwitch('admin')}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                        currentRole === 'admin'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="font-bold text-xs">Admin Control Center</div>
                          <div className="text-[10px] text-slate-400 font-normal">Independent Talent Manager Operations</div>
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-tech-border my-1" />
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Creator Workspace Logins
                    </div>

                    {influencers.map(inf => (
                      <button
                        key={inf.id}
                        onClick={() => handleRoleSwitch('influencer', inf.id)}
                        className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                          currentRole === 'influencer' && activeInfluencer?.id === inf.id
                            ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <img
                            src={inf.avatarUrl}
                            alt={inf.name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-600"
                          />
                          <div className="truncate">
                            <div className="font-bold text-xs truncate">{inf.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{inf.handle}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* LOGOUT BUTTON */}
                <div className="border-t border-tech-border pt-1">
                  <button
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full p-2 rounded-xl text-red-400 hover:bg-red-500/10 font-bold flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Log Out from Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
