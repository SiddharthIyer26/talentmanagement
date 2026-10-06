import React from 'react';
import { db } from '../../services/db';
import { NeedsAttentionBanner } from '../common/NeedsAttentionBanner';
import {
  Briefcase,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Building2,
  ArrowRight,
  Sparkles,
  Percent
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectCampaign: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  selectedAdminInfluencerId?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectCampaign,
  onNavigateTab,
  selectedAdminInfluencerId = 'all',
}) => {
  const allCampaigns = db.getCampaigns();
  const allInfluencers = db.getInfluencers();

  const selectedInfluencerObj = selectedAdminInfluencerId !== 'all' 
    ? allInfluencers.find(i => i.id === selectedAdminInfluencerId) 
    : undefined;

  const campaigns = selectedAdminInfluencerId !== 'all'
    ? allCampaigns.filter(c => c.influencerId === selectedAdminInfluencerId)
    : allCampaigns;

  const influencers = selectedAdminInfluencerId !== 'all' && selectedInfluencerObj
    ? [selectedInfluencerObj]
    : allInfluencers;

  const metrics = db.getFinancialMetrics(selectedAdminInfluencerId !== 'all' ? selectedAdminInfluencerId : undefined);

  // Collaboration status counts
  const totalActive = campaigns.filter(c => c.productionStatus !== 'Video Published').length;
  const dealsLocked = campaigns.filter(c => c.productionStatus === 'Locked').length;
  const scriptingUnderway = campaigns.filter(c => c.productionStatus === 'Scripting Underway').length;
  const underProduction = campaigns.filter(c => c.productionStatus === 'Under Production').length;
  const waitingApproval = campaigns.filter(c => c.productionStatus === 'Waiting for Approval').length;
  const videoPublished = campaigns.filter(c => c.productionStatus === 'Video Published').length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Actionable Needs Attention Banner */}
      <NeedsAttentionBanner onSelectCampaign={onSelectCampaign} />

      {/* 2. Admin Financial Metrics (5 Core Independent Metrics) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> Independent Talent Management Financials (INR ₹)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Total Influencer Revenue */}
          <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Influencer Revenue</span>
              <Briefcase className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono">
                ₹{metrics.totalInfluencerRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 border-t border-tech-border pt-1.5">
              <span>Total brand deal volume</span>
            </div>
          </div>

          {/* 2. My Commission Revenue */}
          <div className="bg-tech-card border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between bg-emerald-950/10">
            <div className="flex items-center justify-between text-emerald-400 text-xs mb-1 font-semibold">
              <span>My Commission Revenue</span>
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                ₹{metrics.myCommissionRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-emerald-400 flex items-center justify-between border-t border-emerald-500/20 pt-1.5 font-mono">
              <span>₹{metrics.myReceivedCommission.toLocaleString('en-IN')} received</span>
            </div>
          </div>

          {/* 3. Total Received */}
          <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Received</span>
              <CheckCircle className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono">
                ₹{metrics.totalReceived.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 border-t border-tech-border pt-1.5">
              <span>Paid by brands</span>
            </div>
          </div>

          {/* 4. Total Receivables */}
          <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Receivables</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
                ₹{metrics.totalReceivables.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-red-400 flex items-center justify-between border-t border-tech-border pt-1.5 font-mono">
              <span>₹{metrics.overduePayments.toLocaleString('en-IN')} Overdue</span>
            </div>
          </div>

          {/* 5. TDS Deducted */}
          <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>TDS Deducted</span>
              <Percent className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-indigo-300 font-mono">
                ₹{metrics.tdsDeducted.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 border-t border-tech-border pt-1.5">
              <span>Total tax deducted</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collaboration Pipeline Breakdown */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Campaign Pipeline Status Distribution
          </h3>
          <button
            onClick={() => onNavigateTab('collaborations')}
            className="text-cyan-400 text-xs font-semibold hover:underline flex items-center gap-1"
          >
            View All Collaborations <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">1. Locked</span>
            <span className="text-lg font-bold text-slate-100 font-mono">{dealsLocked}</span>
          </div>

          <div className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">2. Scripting</span>
            <span className="text-lg font-bold text-indigo-400 font-mono">{scriptingUnderway}</span>
          </div>

          <div className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">3. Production</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{underProduction}</span>
          </div>

          <div className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">4. Approval</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{waitingApproval}</span>
          </div>

          <div className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block mb-1">5. Published</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{videoPublished}</span>
          </div>
        </div>
      </div>

      {/* 4. Influencer Roster Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Technology Influencer Roster ({influencers.length})
          </h3>
          <button
            onClick={() => onNavigateTab('influencers')}
            className="text-cyan-400 text-xs font-semibold hover:underline"
          >
            Manage Profiles & Rate Cards
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {influencers.map(inf => {
            const infCamps = campaigns.filter(c => c.influencerId === inf.id);
            const activeCamps = infCamps.filter(c => c.productionStatus !== 'Video Published').length;
            const rev = infCamps.reduce((acc, c) => acc + c.dealAmount, 0);
            const pending = infCamps
              .filter(c => c.paymentStatus === 'Pending')
              .reduce((acc, c) => acc + c.dealAmount, 0);

                  const myComm = infCamps.reduce((acc, c) => acc + (c.commissionEarned || 0), 0);

                  return (
                    <div
                      key={inf.id}
                      onClick={() => onNavigateTab('influencers')}
                      className="bg-tech-card border border-tech-border hover:border-cyan-500/50 rounded-2xl p-4 cursor-pointer transition-all space-y-3 group"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={inf.avatarUrl}
                          alt={inf.name}
                          className="w-12 h-12 rounded-xl object-cover border border-tech-border group-hover:border-cyan-400 transition-colors"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-100 text-xs truncate group-hover:text-cyan-400 transition-colors">
                            {inf.name}
                          </h4>
                          <p className="text-[10px] text-cyan-400 font-mono">{inf.handle}</p>
                          <p className="text-[10px] text-slate-400 truncate">{inf.city}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-tech-border text-center text-xs">
                        <div className="bg-[#0b0f17] p-2 rounded-lg">
                          <span className="text-[9px] text-slate-500 block">Deals</span>
                          <span className="font-bold text-slate-200 font-mono">{infCamps.length}</span>
                        </div>

                        <div className="bg-[#0b0f17] p-2 rounded-lg">
                          <span className="text-[9px] text-slate-500 block">Commercial</span>
                          <span className="font-bold text-slate-300 font-mono">₹{(rev/1000).toFixed(0)}k</span>
                        </div>

                        <div className="bg-[#0b0f17] p-2 rounded-lg">
                          <span className="text-[9px] text-emerald-400 block font-semibold">My Comm</span>
                          <span className="font-bold text-emerald-400 font-mono">₹{(myComm/1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </div>
                  );
          })}
        </div>
      </div>
    </div>
  );
};
