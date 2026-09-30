import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { db } from '../../services/db';
import { Campaign } from '../../types';
import {
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Download,
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Layers,
  Calendar,
  Sparkles
} from 'lucide-react';

interface InfluencerPortalViewProps {
  onSelectCampaign: (id: string) => void;
}

export const InfluencerPortalView: React.FC<InfluencerPortalViewProps> = ({ onSelectCampaign }) => {
  const influencer = authService.getActiveInfluencer();
  const [selectedMonth, setSelectedMonth] = useState('August 2026');

  if (!influencer) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Lock className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p>No active influencer session. Please select an influencer from the top role switcher.</p>
      </div>
    );
  }

  // Strictly filter campaigns belonging ONLY to this logged-in influencer
  const myCampaigns = db.getCampaigns().filter(c => c.influencerId === influencer.id);

  // Month-wise filtering options
  const monthOptions = [
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
    'April 2026',
    'March 2026',
    'All Time History'
  ];

  const filteredCampaigns = myCampaigns.filter(c => {
    if (selectedMonth === 'All Time History') return true;
    if (selectedMonth === 'August 2026') return c.dealLockedDate.startsWith('2026-08');
    if (selectedMonth === 'July 2026') return c.dealLockedDate.startsWith('2026-07');
    if (selectedMonth === 'June 2026') return c.dealLockedDate.startsWith('2026-06');
    if (selectedMonth === 'May 2026') return c.dealLockedDate.startsWith('2026-05');
    if (selectedMonth === 'April 2026') return c.dealLockedDate.startsWith('2026-04');
    if (selectedMonth === 'March 2026') return c.dealLockedDate.startsWith('2026-03');
    return true;
  });

  // Current Details Math (Requirements 14 & 15)
  const lockedDealsCount = myCampaigns.length;
  const monthRevenueTillNow = filteredCampaigns.reduce((sum, c) => sum + c.dealAmount, 0);
  const paymentToReceive = myCampaigns
    .filter(c => c.paymentStatus === 'Pending')
    .reduce((sum, c) => sum + c.dealAmount, 0);
  const totalReceived = myCampaigns
    .filter(c => c.paymentStatus === 'Received')
    .reduce((sum, c) => sum + c.dealAmount, 0);

  // Operational KPIs
  const activeCampaigns = myCampaigns.filter(c => c.productionStatus !== 'Video Published').length;
  const inProductionCount = myCampaigns.filter(c => c.productionStatus === 'Under Production').length;
  const waitingApprovalCount = myCampaigns.filter(c => c.productionStatus === 'Waiting for Approval').length;
  const publishedCount = myCampaigns.filter(c => c.productionStatus === 'Video Published').length;
  const deliverablesDone = myCampaigns.reduce(
    (acc, c) => acc + c.deliverables.filter(d => d.completed).length,
    0
  );
  const totalDeliverables = myCampaigns.reduce((acc, c) => acc + c.deliverables.length, 0);

  // 5-Stage Pipeline Counts (Requirement 16)
  const stageLocked = myCampaigns.filter(c => c.productionStatus === 'Locked').length;
  const stageScripting = myCampaigns.filter(c => c.productionStatus === 'Scripting Underway').length;
  const stageProduction = myCampaigns.filter(c => c.productionStatus === 'Under Production').length;
  const stageApproval = myCampaigns.filter(c => c.productionStatus === 'Waiting for Approval').length;
  const stagePublished = myCampaigns.filter(c => c.productionStatus === 'Video Published').length;

  // Export Spreadsheet (XLSX / CSV) Report (Requirement 18)
  const handleExportReport = () => {
    const headers = [
      'Brand',
      'Campaign Name',
      'Deal Locked Date',
      'Live Date',
      'Deal Amount (INR)',
      'Production Status',
      'Payment Status',
      'Reel Link',
      'Views',
      'Likes',
      'Comments',
      'Shares',
      'Saves'
    ];

    const rows = filteredCampaigns.map(c => [
      `"${c.brandName.replace(/"/g, '""')}"`,
      `"${c.campaignName.replace(/"/g, '""')}"`,
      c.dealLockedDate || '',
      c.liveDate || '',
      c.dealAmount,
      c.productionStatus,
      c.paymentStatus,
      c.liveLink || '',
      c.metrics?.views || 0,
      c.metrics?.likes || 0,
      c.metrics?.comments || 0,
      c.metrics?.shares || 0,
      c.metrics?.saves || 0
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeMonth = selectedMonth.replace(/\s+/g, '_');
    link.setAttribute('download', `${influencer.name}_Collaborations_Report_${safeMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Profile Header */}
      <div className="bg-gradient-to-r from-[#0e1420] via-tech-card to-cyan-950/40 border border-tech-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <img
            src={influencer.avatarUrl}
            alt={influencer.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 shrink-0"
          />
          <div>
            <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              {influencer.name} <span className="text-xs font-normal text-cyan-400 font-mono">Workspace</span>
            </h2>
            <p className="text-slate-400 text-xs">{influencer.handle} • {influencer.city}</p>
          </div>
        </div>

        {/* Month Selector & Download Report Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-tech-border px-3 py-1.5 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {monthOptions.map(m => (
                <option key={m} value={m} className="bg-[#0b0f17] text-slate-200">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportReport}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (.XLSX/.CSV)</span>
          </button>
        </div>
      </div>

      {/* 1. CURRENT DETAILS (Requirement 14 & Mobile First) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Current Commercial Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Locked Deals */}
          <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
            <span className="text-slate-400 text-xs font-semibold block mb-1">Locked Deals</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-slate-100 font-mono">{lockedDealsCount}</span>
              <span className="text-[10px] text-slate-500 font-mono">active partners</span>
            </div>
            <span className="text-[10px] text-cyan-400 block mt-2 border-t border-tech-border pt-1.5 font-mono">
              {activeCampaigns} campaigns in progress
            </span>
          </div>

          {/* Month Revenue Till Now */}
          <div className="bg-tech-card border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-slate-400 text-xs font-semibold block mb-1">
              Month Revenue ({selectedMonth === 'All Time History' ? 'Total' : selectedMonth.split(' ')[0]})
            </span>
            <span className="text-2xl font-extrabold text-cyan-400 font-mono">
              ₹{monthRevenueTillNow.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-400 block mt-2 border-t border-tech-border pt-1.5 font-mono">
              ₹{totalReceived.toLocaleString('en-IN')} Received till date
            </span>
          </div>

          {/* Payment To Receive */}
          <div className="bg-tech-card border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-amber-400 text-xs font-bold block mb-1">Payment To Receive</span>
            <span className="text-2xl font-extrabold text-amber-300 font-mono">
              ₹{paymentToReceive.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-amber-400 block mt-2 border-t border-tech-border pt-1.5 font-mono">
              Pending from brand accounts
            </span>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL & COMMERCIAL KPIs (Requirement 15) */}
      <div className="bg-tech-card border border-tech-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" /> Operational & Deliverable Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-[#0b0f17] p-2.5 rounded-lg border border-tech-border">
            <span className="text-[10px] text-slate-400 block">Active Campaigns</span>
            <span className="font-extrabold text-slate-100 font-mono text-base">{activeCampaigns}</span>
          </div>
          <div className="bg-[#0b0f17] p-2.5 rounded-lg border border-tech-border">
            <span className="text-[10px] text-slate-400 block">In Production</span>
            <span className="font-extrabold text-amber-400 font-mono text-base">{inProductionCount}</span>
          </div>
          <div className="bg-[#0b0f17] p-2.5 rounded-lg border border-tech-border">
            <span className="text-[10px] text-slate-400 block">Waiting Approval</span>
            <span className="font-extrabold text-cyan-400 font-mono text-base">{waitingApprovalCount}</span>
          </div>
          <div className="bg-[#0b0f17] p-2.5 rounded-lg border border-tech-border">
            <span className="text-[10px] text-slate-400 block">Deliverables Completed</span>
            <span className="font-extrabold text-emerald-400 font-mono text-base">
              {deliverablesDone} / {totalDeliverables}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CAMPAIGN PIPELINE (Requirement 16) */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
          <span>5-Stage Campaign Pipeline</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">Personal Deals Tracker</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="p-2.5 bg-[#0b0f17] border border-tech-border rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1 font-semibold">1. Locked</span>
            <span className="text-base font-bold text-slate-100 font-mono">{stageLocked}</span>
          </div>
          <div className="p-2.5 bg-[#0b0f17] border border-tech-border rounded-xl">
            <span className="text-[10px] text-indigo-400 block mb-1 font-semibold">2. Scripting</span>
            <span className="text-base font-bold text-indigo-300 font-mono">{stageScripting}</span>
          </div>
          <div className="p-2.5 bg-[#0b0f17] border border-tech-border rounded-xl">
            <span className="text-[10px] text-amber-400 block mb-1 font-semibold">3. Production</span>
            <span className="text-base font-bold text-amber-300 font-mono">{stageProduction}</span>
          </div>
          <div className="p-2.5 bg-[#0b0f17] border border-tech-border rounded-xl">
            <span className="text-[10px] text-cyan-400 block mb-1 font-semibold">4. Approval</span>
            <span className="text-base font-bold text-cyan-300 font-mono">{stageApproval}</span>
          </div>
          <div className="p-2.5 bg-[#0b0f17] border border-tech-border rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-400 block mb-1 font-semibold">5. Published</span>
            <span className="text-base font-bold text-emerald-300 font-mono">{stagePublished}</span>
          </div>
        </div>
      </div>

      {/* 4. MONTH-WISE COLLABORATIONS LIST (Requirement 17 & Mobile First Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" /> Collaborations ({filteredCampaigns.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Selected: <strong className="text-cyan-400 font-semibold">{selectedMonth}</strong>
          </span>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="bg-tech-card border border-tech-border rounded-xl p-8 text-center text-slate-500 text-xs">
            No collaborations recorded for {selectedMonth}. Select another month or view All Time History.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map(c => {
              const urgency = db.getPaymentUrgency(c);
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCampaign(c.id)}
                  className="bg-tech-card border border-tech-border hover:border-cyan-500/40 rounded-xl p-4 cursor-pointer transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {c.brandName}
                        </span>
                        <h4 className="font-bold text-slate-100 text-xs sm:text-sm">{c.campaignName}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Status: <strong className="text-slate-200">{c.productionStatus}</strong> • Deliverables:{' '}
                        {c.deliverables.filter(d => d.completed).length}/{c.deliverables.length} Done
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto shrink-0 gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-tech-border">
                      <div className="text-left sm:text-right">
                        <span className="text-sm font-extrabold text-slate-100 font-mono block">
                          ₹{c.dealAmount.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            c.paymentStatus === 'Received'
                              ? 'text-emerald-400'
                              : urgency === 'Overdue'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          Payment: {c.paymentStatus} {urgency ? `(${urgency})` : ''}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                    </div>
                  </div>

                  {/* Additional campaign performance results if published */}
                  {c.metrics && c.metrics.views > 0 && (
                    <div className="pt-2 border-t border-tech-border/60 grid grid-cols-5 gap-1.5 text-center text-[10px]">
                      <div className="bg-[#0b0f17] p-1.5 rounded">
                        <span className="text-slate-500 block text-[9px]">Views</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {(c.metrics.views / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="bg-[#0b0f17] p-1.5 rounded">
                        <span className="text-slate-500 block text-[9px]">Likes</span>
                        <span className="font-mono font-bold text-slate-200">
                          {(c.metrics.likes / 1000).toFixed(1)}K
                        </span>
                      </div>
                      <div className="bg-[#0b0f17] p-1.5 rounded">
                        <span className="text-slate-500 block text-[9px]">Comments</span>
                        <span className="font-mono font-bold text-slate-200">
                          {c.metrics.comments}
                        </span>
                      </div>
                      <div className="bg-[#0b0f17] p-1.5 rounded">
                        <span className="text-slate-500 block text-[9px]">Shares</span>
                        <span className="font-mono font-bold text-slate-200">
                          {c.metrics.shares}
                        </span>
                      </div>
                      <div className="bg-[#0b0f17] p-1.5 rounded">
                        <span className="text-slate-500 block text-[9px]">Saves</span>
                        <span className="font-mono font-bold text-slate-200">
                          {c.metrics.saves}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reel Link if available */}
                  {c.liveLink && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <a
                        href={c.liveLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-cyan-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        Watch Reel Live <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Live Date: {c.liveDate || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
