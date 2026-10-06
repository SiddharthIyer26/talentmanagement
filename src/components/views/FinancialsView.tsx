import React, { useState } from 'react';
import { db } from '../../services/db';
import { Campaign } from '../../types';
import {
  IndianRupee,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  Users
} from 'lucide-react';

export const FinancialsView: React.FC = () => {
  const campaigns = db.getCampaigns();
  const influencers = db.getInfluencers();
  const availableMonths = db.getAvailableMonths();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    // Influencer Filter
    if (selectedInfluencer !== 'ALL' && c.influencerId !== selectedInfluencer) {
      return false;
    }

    // Dynamic Month Filter
    if (selectedMonth !== 'ALL') {
      const cMonth = db.getCampaignMonthLabel(c);
      if (cMonth.trim().toLowerCase() !== selectedMonth.trim().toLowerCase()) {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const infName = (db.getInfluencerById(c.influencerId)?.name || '').toLowerCase();
      const match =
        c.campaignName.toLowerCase().includes(q) ||
        c.brandName.toLowerCase().includes(q) ||
        infName.includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Calculate totals based on filtered campaigns
  const totalCommissionEarned = filteredCampaigns.reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
  const recognizedCommission = filteredCampaigns
    .filter(c => c.paymentStatus === 'Received' || c.paymentStatus === 'Paid')
    .reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
  const pendingCommission = filteredCampaigns
    .filter(c => c.paymentStatus !== 'Received' && c.paymentStatus !== 'Paid')
    .reduce((acc, c) => acc + (c.commissionEarned || 0), 0);

  const totalLockedCommercial = filteredCampaigns.reduce((acc, c) => acc + (c.lockedCommercial || c.dealAmount || 0), 0);
  const totalReceivedCommercial = filteredCampaigns.reduce((acc, c) => acc + (c.receivedCommercial || c.amountReceived || 0), 0);
  const totalTdsDeducted = filteredCampaigns.reduce((acc, c) => acc + (c.tdsDeductedAmount || 0), 0);

  // Month-wise aggregation
  const monthWiseData = availableMonths.map(month => {
    const monthCamps = campaigns.filter(c => {
      if (selectedInfluencer !== 'ALL' && c.influencerId !== selectedInfluencer) return false;
      return db.getCampaignMonthLabel(c).trim().toLowerCase() === month.trim().toLowerCase();
    });

    const comm = monthCamps.reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
    const commReceived = monthCamps
      .filter(c => c.paymentStatus === 'Received' || c.paymentStatus === 'Paid')
      .reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
    const dealVol = monthCamps.reduce((acc, c) => acc + (c.lockedCommercial || c.dealAmount || 0), 0);

    return {
      month,
      campaignsCount: monthCamps.length,
      commissionEarned: comm,
      commissionReceived: commReceived,
      dealVolume: dealVol
    };
  });

  return (
    <div className="space-y-6 pb-12 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" /> Revenue
          </h2>
          <p className="text-slate-400">
            Independent business ledger tracking <strong className="text-slate-200">my personal commission revenue</strong> earned from creator collaborations.
          </p>
        </div>
      </div>

      {/* KPI Cards: Total Commission, Recognized, Pending */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-tech-card border border-emerald-500/40 rounded-xl p-5 bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
            <span>Total Commission Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            ₹{totalCommissionEarned.toLocaleString('en-IN')}
          </span>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-tech-border pt-1.5 flex justify-between">
            <span>Across {filteredCampaigns.length} collaborations</span>
            <span className="text-emerald-400">Commercial: ₹{totalLockedCommercial.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-tech-card border border-cyan-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between text-cyan-400 font-semibold mb-1">
            <span>Recognized Commission (Received)</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">
            ₹{recognizedCommission.toLocaleString('en-IN')}
          </span>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-tech-border pt-1.5 flex justify-between">
            <span>Automatically accounted</span>
            <span className="text-cyan-400">Brands Paid: ₹{totalReceivedCommercial.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-tech-card border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between text-amber-400 font-semibold mb-1">
            <span>Pending Commission (Receivable)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            ₹{pendingCommission.toLocaleString('en-IN')}
          </span>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-tech-border pt-1.5 flex justify-between">
            <span>Awaiting client clearance</span>
            <span className="text-amber-400">TDS: ₹{totalTdsDeducted.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Month-wise Revenue Summary Cards */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Month-Wise Commission Revenue Summary
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {monthWiseData.length} dynamic months recorded
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
          {monthWiseData.map(m => {
            const isSelected = selectedMonth === m.month;
            return (
              <div
                key={m.month}
                onClick={() => setSelectedMonth(isSelected ? 'ALL' : m.month)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                    : 'bg-[#0b0f17] border-tech-border hover:border-slate-600'
                }`}
              >
                <span className="text-[10px] text-slate-400 block font-semibold truncate">{m.month}</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono block mt-1">
                  ₹{m.commissionEarned.toLocaleString('en-IN')}
                </span>
                <div className="mt-1 text-[9px] text-slate-500 flex justify-between border-t border-tech-border pt-1 font-mono">
                  <span>{m.campaignsCount} deals</span>
                  <span className="text-cyan-400">₹{(m.commissionReceived/1000).toFixed(0)}k rec.</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Combined Filter Controls */}
      <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Month Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-tech-border px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">Month:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#0e1420] text-slate-200">All Dynamic Months</option>
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-[#0e1420] text-slate-200">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Influencer Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-tech-border px-3 py-1.5 rounded-lg">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">Influencer:</span>
            <select
              value={selectedInfluencer}
              onChange={e => setSelectedInfluencer(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#0e1420] text-slate-200">All Influencers</option>
              {influencers.map(inf => (
                <option key={inf.id} value={inf.id} className="bg-[#0e1420] text-slate-200">
                  {inf.name}
                </option>
              ))}
            </select>
          </div>

          {(selectedMonth !== 'ALL' || selectedInfluencer !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedMonth('ALL');
                setSelectedInfluencer('ALL');
                setSearchQuery('');
              }}
              className="text-[10px] text-cyan-400 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search deals, brands, creators..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0f17] border border-tech-border rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Commission Revenue Log Table */}
      <div className="bg-tech-card border border-tech-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-tech-border flex items-center justify-between bg-[#0e1420]">
          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Commission Revenue Log
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Individual collaboration commission breakdown and automatic recognition status
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
            {filteredCampaigns.length} Records Found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-tech-border text-slate-400 bg-[#0b0f17]/50 text-[11px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Influencer</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Collaboration</th>
                <th className="py-2.5 px-3 text-right">Locked Commercial</th>
                <th className="py-2.5 px-3 text-right">Received Commercial</th>
                <th className="py-2.5 px-3 text-right">TDS Deducted</th>
                <th className="py-2.5 px-3 text-center">Comm %</th>
                <th className="py-2.5 px-3 text-right">Commission Earned</th>
                <th className="py-2.5 px-3 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border text-xs font-sans">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No collaboration records match the selected month and influencer filter.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(c => {
                  const inf = db.getInfluencerById(c.influencerId);
                  const isReceived = c.paymentStatus === 'Received' || c.paymentStatus === 'Paid';
                  const dateDisplay = c.paymentReceivedDate || c.dealLockedDate || '-';

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {dateDisplay}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200 block">{inf?.name || 'Creator'}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{inf?.handle}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300">
                        {c.brandName}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-200 line-clamp-1 max-w-xs">{c.campaignName}</p>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        ₹{(c.lockedCommercial || c.dealAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-cyan-400 whitespace-nowrap">
                        ₹{(c.receivedCommercial || c.amountReceived || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                        ₹{(c.tdsDeductedAmount || 0).toLocaleString('en-IN')}
                        <span className="text-[9px] text-slate-500 block">({c.tdsDeductedPercentage || 10}%)</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-cyan-300">
                        {c.commissionPercentage || 10}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ₹{(c.commissionEarned || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                            isReceived
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isReceived && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {c.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredCampaigns.length > 0 && (
              <tfoot>
                <tr className="bg-[#0b0f17] border-t-2 border-tech-border font-bold text-slate-200">
                  <td colSpan={4} className="py-3 px-3 text-right uppercase text-[10px] text-slate-400">
                    Filtered Totals:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-100 whitespace-nowrap">
                    ₹{totalLockedCommercial.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-400 whitespace-nowrap">
                    ₹{totalReceivedCommercial.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                    ₹{totalTdsDeducted.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">-</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm whitespace-nowrap">
                    ₹{totalCommissionEarned.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
