import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
import {
  FileBarChart,
  Download,
  Calendar,
  Sparkles,
  Users,
  IndianRupee,
  Layers,
  FileSpreadsheet,
  CheckCircle,
  Filter
} from 'lucide-react';

type ReportType = 'COLLABORATION' | 'COMMISSION_REVENUE';

export const ReportsView: React.FC = () => {
  const session = authService.getSession();
  const isAdmin = authService.isAdmin();
  const activeInfId = authService.getActiveInfluencerId();

  const [activeReport, setActiveReport] = useState<ReportType>('COLLABORATION');
  const [selectedInfluencer, setSelectedInfluencer] = useState(
    isAdmin ? 'ALL' : activeInfId || 'ALL'
  );
  const [quickRange, setQuickRange] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  const campaigns = db.getCampaigns();
  const influencers = db.getInfluencers();
  const dynamicMonths = db.getAvailableMonths();

  // If user is influencer, enforce their influencer ID
  const effectiveInfluencer = isAdmin ? selectedInfluencer : (activeInfId || 'ALL');

  // Filter campaigns based on filters
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      // Influencer filter
      if (effectiveInfluencer !== 'ALL' && c.influencerId !== effectiveInfluencer) {
        return false;
      }

      const cMonth = db.getCampaignMonthLabel(c);

      // Month filter
      if (selectedMonth !== 'ALL') {
        if (cMonth !== selectedMonth) {
          return false;
        }
      }

      // Quick range filter
      if (quickRange !== 'ALL') {
        const rangeNum = parseInt(quickRange, 10);
        if (!isNaN(rangeNum) && rangeNum > 0) {
          // Take the last N dynamic months
          const recentMonths = dynamicMonths.slice(-rangeNum);
          if (!recentMonths.includes(cMonth)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [campaigns, effectiveInfluencer, selectedMonth, quickRange, dynamicMonths]);

  // Financial summary metrics for filtered records
  const summary = useMemo(() => {
    let totalLocked = 0;
    let totalReceived = 0;
    let totalTds = 0;
    let totalCommission = 0;
    let totalReceivables = 0;

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    filteredCampaigns.forEach(c => {
      const locked = c.lockedCommercial || c.dealAmount || 0;
      const received = c.receivedCommercial !== undefined ? c.receivedCommercial : (c.paymentStatus === 'Received' ? locked : 0);
      const tds = c.tdsDeductedAmount || 0;
      const comm = c.commissionEarned || (locked * (c.commissionPercentage || 10)) / 100;
      const recv = Math.max(0, locked - received);

      totalLocked += locked;
      totalReceived += received;
      totalTds += tds;
      totalCommission += comm;
      totalReceivables += recv;

      totalViews += c.metrics?.views || 0;
      totalLikes += c.metrics?.likes || 0;
      totalComments += c.metrics?.comments || 0;
      totalShares += c.metrics?.shares || 0;
    });

    return {
      totalLocked,
      totalReceived,
      totalTds,
      totalCommission,
      totalReceivables,
      totalViews,
      totalLikes,
      totalComments,
      totalShares
    };
  }, [filteredCampaigns]);

  // Export CSV handler
  const handleExportCSV = () => {
    let csvRows: string[][] = [];

    // Header summary block
    csvRows.push([`REPORT: ${activeReport === 'COLLABORATION' ? 'INFLUENCER COLLABORATION REPORT' : 'COMMISSION REVENUE REPORT'}`]);
    csvRows.push([`GENERATED DATE: ${new Date().toLocaleDateString('en-IN')}`]);
    csvRows.push([`INFLUENCER FILTER: ${effectiveInfluencer === 'ALL' ? 'All Influencers' : db.getInfluencerById(effectiveInfluencer)?.name || effectiveInfluencer}`]);
    csvRows.push([`PERIOD: ${selectedMonth !== 'ALL' ? selectedMonth : quickRange !== 'ALL' ? `Last ${quickRange} Months` : 'All Available Months'}`]);
    csvRows.push([]);

    // Summary Section
    csvRows.push(['--- SUMMARY TOTALS ---']);
    csvRows.push(['Total Locked Commercial (INR)', `₹${summary.totalLocked.toLocaleString('en-IN')}`]);
    csvRows.push(['Total Received Commercial (INR)', `₹${summary.totalReceived.toLocaleString('en-IN')}`]);
    csvRows.push(['Total TDS Deducted (INR)', `₹${summary.totalTds.toLocaleString('en-IN')}`]);
    if (isAdmin) {
      csvRows.push(['Total Commission Earned (INR)', `₹${summary.totalCommission.toLocaleString('en-IN')}`]);
    }
    csvRows.push(['Total Receivables (INR)', `₹${summary.totalReceivables.toLocaleString('en-IN')}`]);
    if (activeReport === 'COLLABORATION') {
      csvRows.push(['Total Views', summary.totalViews.toLocaleString('en-IN')]);
      csvRows.push(['Total Likes', summary.totalLikes.toLocaleString('en-IN')]);
      csvRows.push(['Total Comments', summary.totalComments.toLocaleString('en-IN')]);
      csvRows.push(['Total Shares', summary.totalShares.toLocaleString('en-IN')]);
    }
    csvRows.push([]);
    csvRows.push(['--- DETAILED DATA LOG ---']);

    if (activeReport === 'COLLABORATION') {
      // REPORT 1: Influencer Collaboration Report
      const headers = [
        'Date',
        'Month',
        'Influencer',
        'Talent Type',
        'Brand',
        'Brand Manager',
        'Collaboration Name',
        'Deliverables',
        'Status',
        'Locked Commercial (INR)',
        'Received Commercial (INR)',
        'TDS Amount (INR)',
        'TDS %',
        ...(isAdmin ? ['Commission %', 'Commission Earned (INR)'] : []),
        'Payment Status',
        'Reel Live Date',
        'Reel Link',
        'Views',
        'Likes',
        'Comments',
        'Shares'
      ];
      csvRows.push(headers);

      filteredCampaigns.forEach(c => {
        const talent = db.getTalentInfoForCampaign(c);
        const locked = c.lockedCommercial || c.dealAmount || 0;
        const received = c.receivedCommercial !== undefined ? c.receivedCommercial : (c.paymentStatus === 'Received' ? locked : 0);
        const tds = c.tdsDeductedAmount || 0;
        const tdsPct = c.tdsDeductedPercentage || 10;
        const commPct = c.commissionPercentage || 10;
        const commEarned = c.commissionEarned || (locked * commPct) / 100;
        const mLabel = db.getCampaignMonthLabel(c);

        const row = [
          c.startDate || c.dealLockedDate || '—',
          mLabel,
          talent.name,
          talent.isExclusive ? 'Exclusive Talent' : 'Non-Exclusive Talent',
          c.brandName,
          c.brandManager || c.contactPerson || '—',
          `"${(c.campaignName || '').replace(/"/g, '""')}"`,
          `"${(c.deliverables?.map(d => typeof d === 'string' ? d : d.title).join('; ') || '').replace(/"/g, '""')}"`,
          c.productionStatus,
          `₹${locked.toLocaleString('en-IN')}`,
          `₹${received.toLocaleString('en-IN')}`,
          `₹${tds.toLocaleString('en-IN')}`,
          `${tdsPct}%`,
          ...(isAdmin ? [`${commPct}%`, `₹${commEarned.toLocaleString('en-IN')}`] : []),
          c.paymentStatus,
          c.liveDate || '—',
          c.liveLink || c.trackingLink || '—',
          String(c.metrics?.views || 0),
          String(c.metrics?.likes || 0),
          String(c.metrics?.comments || 0),
          String(c.metrics?.shares || 0)
        ];
        csvRows.push(row);
      });
    } else {
      // REPORT 2: Commission Revenue Report (Admin Business)
      const headers = [
        'Month',
        'Date',
        'Influencer',
        'Talent Type',
        'Brand',
        'Collaboration',
        'Locked Commercial (INR)',
        'Received Commercial (INR)',
        'TDS Deducted (INR)',
        'TDS %',
        'Commission %',
        'Commission Earned (INR)',
        'Payment Status',
        'Payment Received Date',
        'Receivable Amount (INR)'
      ];
      csvRows.push(headers);

      filteredCampaigns.forEach(c => {
        const talent = db.getTalentInfoForCampaign(c);
        const locked = c.lockedCommercial || c.dealAmount || 0;
        const received = c.receivedCommercial !== undefined ? c.receivedCommercial : (c.paymentStatus === 'Received' ? locked : 0);
        const tds = c.tdsDeductedAmount || 0;
        const tdsPct = c.tdsDeductedPercentage || 10;
        const commPct = c.commissionPercentage || 10;
        const commEarned = c.commissionEarned || (locked * commPct) / 100;
        const recv = Math.max(0, locked - received);
        const mLabel = db.getCampaignMonthLabel(c);

        const row = [
          mLabel,
          c.startDate || c.dealLockedDate || '—',
          talent.name,
          talent.isExclusive ? 'Exclusive Talent' : 'Non-Exclusive Talent',
          c.brandName,
          `"${(c.campaignName || '').replace(/"/g, '""')}"`,
          `₹${locked.toLocaleString('en-IN')}`,
          `₹${received.toLocaleString('en-IN')}`,
          `₹${tds.toLocaleString('en-IN')}`,
          `${tdsPct}%`,
          `${commPct}%`,
          `₹${commEarned.toLocaleString('en-IN')}`,
          c.paymentStatus,
          c.paymentStatus === 'Received' ? (c.liveDate || c.dealLockedDate || 'Received') : 'Pending',
          `₹${recv.toLocaleString('en-IN')}`
        ];
        csvRows.push(row);
      });
    }

    const csvContent = '\uFEFF' + csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filenamePrefix = activeReport === 'COLLABORATION' ? 'Influencer_Collaboration_Report' : 'Commission_Revenue_Report';
    const periodLabel = selectedMonth !== 'ALL' ? selectedMonth.replace(/\s+/g, '_') : 'Multi_Month';
    link.download = `${filenamePrefix}_${periodLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-cyan-400" /> Reports & Financial Export
          </h2>
          <p className="text-slate-400 text-xs">
            Export professional, Excel/Sheets-compatible reports with Indian Rupee (₹) formatting and comprehensive totals.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export {activeReport === 'COLLABORATION' ? 'Collaboration' : 'Commission'} Report (CSV)</span>
        </button>
      </div>

      {/* Report Option Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Report 1 Card / Tab */}
        <div
          onClick={() => setActiveReport('COLLABORATION')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            activeReport === 'COLLABORATION'
              ? 'bg-cyan-500/10 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
              : 'bg-tech-card border-tech-border hover:border-slate-600 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Influencer Collaboration Report</h3>
                <span className="text-[11px] text-cyan-400 font-medium">Deliverables & Content Performance</span>
              </div>
            </div>
            {activeReport === 'COLLABORATION' && (
              <CheckCircle className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Full collaboration-level log: deliverables, commercials, TDS, and social metrics (Views, Likes, Comments, Shares).
          </p>
        </div>

        {/* Report 2 Card / Tab (Admin Only) */}
        {isAdmin ? (
          <div
            onClick={() => setActiveReport('COMMISSION_REVENUE')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeReport === 'COMMISSION_REVENUE'
                ? 'bg-indigo-500/10 border-indigo-400/60 shadow-lg shadow-indigo-500/10'
                : 'bg-tech-card border-tech-border hover:border-slate-600 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Commission Revenue Report</h3>
                  <span className="text-[11px] text-indigo-400 font-medium">Independent Business Revenue</span>
                </div>
              </div>
              {activeReport === 'COMMISSION_REVENUE' && (
                <CheckCircle className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <p className="text-slate-400 text-xs mt-2">
              Tracks actual commission earned, TDS deducted, client payments received, and receivables per creator deal.
            </p>
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-tech-border bg-tech-card/50 opacity-60 flex items-center justify-center">
            <span className="text-xs text-slate-500">Commission Revenue Report restricted to Admin</span>
          </div>
        )}
      </div>

      {/* Powerful Filter Suite */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4 text-cyan-400" /> Report Filters & Dynamic Period
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Influencer Filter */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Influencer Selection</label>
            <select
              value={effectiveInfluencer}
              disabled={!isAdmin}
              onChange={e => setSelectedInfluencer(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              {isAdmin && <option value="ALL">All Influencers ({influencers.length})</option>}
              {influencers.map(inf => (
                <option key={inf.id} value={inf.id}>
                  {inf.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Month Selection */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Specific Month</label>
            <select
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value);
                if (e.target.value !== 'ALL') setQuickRange('ALL');
              }}
              className="w-full bg-[#0b0f17] border border-tech-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Available Months</option>
              {dynamicMonths.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Range Period */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Quick Period Range</label>
            <select
              value={quickRange}
              onChange={e => {
                setQuickRange(e.target.value);
                if (e.target.value !== 'ALL') setSelectedMonth('ALL');
              }}
              className="w-full bg-[#0b0f17] border border-tech-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">Custom / All Months</option>
              <option value="1">Last 1 Month</option>
              <option value="2">Last 2 Months</option>
              <option value="3">Last 3 Months</option>
              <option value="4">Last 4 Months</option>
              <option value="5">Last 5 Months</option>
              <option value="6">Last 6 Months</option>
              <option value="7">Last 7 Months</option>
              <option value="10">Last 10 Months</option>
              <option value="12">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Section Banner */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Period Financial Summary ({filteredCampaigns.length} Collaborations)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-[#080b12] p-3.5 rounded-xl border border-tech-border">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Locked Commercial</span>
            <span className="text-lg font-bold font-mono text-slate-100">
              ₹{summary.totalLocked.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#080b12] p-3.5 rounded-xl border border-tech-border">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Received Commercial</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              ₹{summary.totalReceived.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#080b12] p-3.5 rounded-xl border border-tech-border">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total TDS Deducted</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              ₹{summary.totalTds.toLocaleString('en-IN')}
            </span>
          </div>

          {isAdmin ? (
            <div className="bg-[#080b12] p-3.5 rounded-xl border border-indigo-500/30">
              <span className="text-indigo-400 block text-[10px] uppercase font-semibold">Commission Earned (My Revenue)</span>
              <span className="text-lg font-bold font-mono text-indigo-400">
                ₹{summary.totalCommission.toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <div className="bg-[#080b12] p-3.5 rounded-xl border border-tech-border">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Deliverables</span>
              <span className="text-lg font-bold font-mono text-cyan-400">{filteredCampaigns.length}</span>
            </div>
          )}

          <div className="bg-[#080b12] p-3.5 rounded-xl border border-tech-border col-span-2 md:col-span-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Receivables</span>
            <span className="text-lg font-bold font-mono text-rose-400">
              ₹{summary.totalReceivables.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Content performance summary row for Collab Report */}
        {activeReport === 'COLLABORATION' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-tech-border">
            <div className="text-slate-400">
              <span className="text-[10px] block">Views:</span>
              <span className="font-mono font-bold text-slate-200">{summary.totalViews.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-slate-400">
              <span className="text-[10px] block">Likes:</span>
              <span className="font-mono font-bold text-slate-200">{summary.totalLikes.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-slate-400">
              <span className="text-[10px] block">Comments:</span>
              <span className="font-mono font-bold text-slate-200">{summary.totalComments.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-slate-400">
              <span className="text-[10px] block">Shares:</span>
              <span className="font-mono font-bold text-cyan-400">{summary.totalShares.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Preview Table */}
      <div className="bg-tech-card border border-tech-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-tech-border bg-tech-surface/50 flex justify-between items-center">
          <span className="font-bold text-slate-200 text-xs">
            Live Preview Data ({filteredCampaigns.length} records)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Ready for CSV/Sheets Export
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-tech-border bg-tech-surface text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Influencer</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Collaboration</th>
                <th className="py-3 px-3 text-right">Locked Commercial</th>
                <th className="py-3 px-3 text-right">Received</th>
                <th className="py-3 px-3 text-right">TDS</th>
                {isAdmin && <th className="py-3 px-3 text-right">Commission</th>}
                <th className="py-3 px-3 text-center">Status</th>
                {activeReport === 'COLLABORATION' && (
                  <>
                    <th className="py-3 px-3 text-right">Views</th>
                    <th className="py-3 px-3 text-right">Shares</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500">
                    No collaboration data found for this selection.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(c => {
                  const talent = db.getTalentInfoForCampaign(c);
                  const locked = c.lockedCommercial || c.dealAmount || 0;
                  const received = c.receivedCommercial !== undefined ? c.receivedCommercial : (c.paymentStatus === 'Received' ? locked : 0);
                  const tds = c.tdsDeductedAmount || 0;
                  const comm = c.commissionEarned || (locked * (c.commissionPercentage || 10)) / 100;

                  return (
                    <tr key={c.id} className="hover:bg-tech-surface/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{c.startDate || c.dealLockedDate || '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-slate-200 font-medium block">{talent.name}</span>
                        {talent.isExclusive ? (
                          <span className="text-[9px] text-cyan-400 font-mono">Exclusive</span>
                        ) : (
                          <span className="text-[9px] text-amber-400 font-mono">Non-Exclusive</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{c.brandName}</td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={c.campaignName}>{c.campaignName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200 whitespace-nowrap">₹{locked.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 whitespace-nowrap">₹{received.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400 whitespace-nowrap">₹{tds.toLocaleString('en-IN')}</td>
                      {isAdmin && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-400 whitespace-nowrap">₹{comm.toLocaleString('en-IN')}</td>
                      )}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          c.paymentStatus === 'Received' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {c.paymentStatus}
                        </span>
                      </td>
                      {activeReport === 'COLLABORATION' && (
                        <>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">{(c.metrics?.views || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-cyan-400 whitespace-nowrap">{(c.metrics?.shares || 0).toLocaleString('en-IN')}</td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
