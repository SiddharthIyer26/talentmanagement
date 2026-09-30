import React from 'react';
import { authService } from '../../services/authService';
import { db } from '../../services/db';
import { Sparkles, ArrowRight, TrendingUp, Clock, AlertCircle, DollarSign, Video, ShieldCheck } from 'lucide-react';

interface DailyWelcomeModalProps {
  onClose: () => void;
}

export const DailyWelcomeModal: React.FC<DailyWelcomeModalProps> = ({ onClose }) => {
  const session = authService.getSession();
  const isAdmin = authService.isAdmin();
  const influencer = authService.getActiveInfluencer();

  // Dynamic Time-of-day Greeting
  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17) {
    timeGreeting = 'Good evening';
  }

  // Dynamic Data Calculation
  const allCampaigns = db.getCampaigns();

  // Admin KPIs
  const adminPendingFollowUps = allCampaigns.filter(c => c.paymentStatus === 'Pending').length;
  const adminActiveCampaigns = allCampaigns.filter(c => c.productionStatus !== 'Video Published').length;
  const adminWaitingApproval = allCampaigns.filter(c => c.productionStatus === 'Waiting for Approval').length;

  // Creator KPIs (Strictly scoped)
  const myCampaigns = influencer ? allCampaigns.filter(c => c.influencerId === influencer.id) : [];
  const infActiveCollabs = myCampaigns.filter(c => c.productionStatus !== 'Video Published').length;
  const infPendingRevenue = myCampaigns
    .filter(c => c.paymentStatus === 'Pending')
    .reduce((acc, c) => acc + c.dealAmount, 0);
  const infInProduction = myCampaigns.filter(
    c => c.productionStatus === 'Under Production' || c.productionStatus === 'Waiting for Approval'
  ).length;

  const handleDismiss = () => {
    if (session.userId) {
      authService.markDailyWelcomeShown(session.userId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#070a11]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#0e1420] via-tech-card to-[#0b0f17] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-cyan-950/50 relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Glow Accents */}
        <div className="absolute -right-12 -top-12 w-44 h-44 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Badge & Greeting */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>IYER TALENT OS • Daily Executive Digest</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {timeGreeting}, {session.name.split(' ')[0]} 👋
            </h2>
            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'Welcome back to your Talent Operations Command Center.'
                : `Welcome back to your creator workspace, ${influencer?.name || session.name}.`}
            </p>
          </div>

          {/* Dynamic KPI Cards */}
          {isAdmin ? (
            /* ADMIN DAILY KPIS */
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="bg-[#0b0f17] border border-amber-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Follow-ups
                </span>
                <span className="text-2xl font-black text-amber-400 mt-2">{adminPendingFollowUps}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Payments Due</span>
              </div>

              <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Active Deals
                </span>
                <span className="text-2xl font-black text-cyan-300 mt-2">{adminActiveCampaigns}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">In Pipeline</span>
              </div>

              <div className="bg-[#0b0f17] border border-indigo-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] text-indigo-400 uppercase font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Approvals
                </span>
                <span className="text-2xl font-black text-indigo-300 mt-2">{adminWaitingApproval}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Pending Review</span>
              </div>
            </div>
          ) : (
            /* INFLUENCER DAILY KPIS */
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Active Collabs
                </span>
                <span className="text-2xl font-black text-cyan-300 mt-2">{infActiveCollabs}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Deals Running</span>
              </div>

              <div className="bg-[#0b0f17] border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Pending
                </span>
                <span className="text-lg font-black text-emerald-400 mt-2">
                  ₹{(infPendingRevenue / 1000).toFixed(0)}k
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">Receivables</span>
              </div>

              <div className="bg-[#0b0f17] border border-indigo-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] text-indigo-400 uppercase font-bold flex items-center gap-1">
                  <Video className="w-3 h-3" /> In Production
                </span>
                <span className="text-2xl font-black text-indigo-300 mt-2">{infInProduction}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Live This Week</span>
              </div>
            </div>
          )}

          {/* Call to Action Button */}
          <button
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black py-3 rounded-2xl shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 text-xs"
          >
            <span>{isAdmin ? "Let's Get Started →" : 'View My Dashboard →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
