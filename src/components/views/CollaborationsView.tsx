import React, { useState } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
import { ProductionStatus, PaymentStatus } from '../../types';
import { Briefcase, Filter, Search, RotateCcw, Plus, ArrowRight, ExternalLink } from 'lucide-react';

interface CollaborationsViewProps {
  onSelectCampaign: (id: string) => void;
  onOpenQuickAdd: () => void;
}

export const CollaborationsView: React.FC<CollaborationsViewProps> = ({
  onSelectCampaign,
  onOpenQuickAdd,
}) => {
  const campaigns = db.getCampaigns();
  const influencers = db.getInfluencers();
  const brands = db.getBrands();

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>('August 2026');
  const [filterInfluencer, setFilterInfluencer] = useState('ALL');
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to extract month label (e.g. "August 2026") from campaign date
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const getCampaignMonthLabel = (c: any): string => {
    const dateStr = c.dealLockedDate || c.liveDate || c.campaignStartDate || '';
    if (!dateStr) return 'August 2026';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${monthNames[monthIdx]} ${year}`;
      }
    }
    return 'August 2026';
  };

  // Dynamically extract all available months from campaigns
  const availableMonthsSet = new Set<string>();
  availableMonthsSet.add('August 2026');
  availableMonthsSet.add('July 2026');
  availableMonthsSet.add('June 2026');
  availableMonthsSet.add('May 2026');
  availableMonthsSet.add('April 2026');

  campaigns.forEach(c => {
    availableMonthsSet.add(getCampaignMonthLabel(c));
  });

  const availableMonths = Array.from(availableMonthsSet);

  const resetFilters = () => {
    setFilterMonth('August 2026');
    setFilterInfluencer('ALL');
    setFilterBrand('ALL');
    setFilterStatus('ALL');
    setFilterPaymentStatus('ALL');
    setSearchQuery('');
  };

  const activeInfluencer = authService.getActiveInfluencer();
  const isAdmin = authService.isAdmin();

  const filteredCampaigns = campaigns.filter(c => {
    if (!isAdmin && activeInfluencer && c.influencerId !== activeInfluencer.id) return false;
    
    // Month Filter
    if (filterMonth !== 'ALL') {
      const cMonth = getCampaignMonthLabel(c);
      if (cMonth.trim().toLowerCase() !== filterMonth.trim().toLowerCase()) return false;
    }

    if (filterInfluencer !== 'ALL' && c.influencerId !== filterInfluencer) return false;
    if (filterBrand !== 'ALL' && c.brandId !== filterBrand) return false;
    if (filterStatus !== 'ALL' && c.productionStatus !== filterStatus) return false;
    if (filterPaymentStatus !== 'ALL') {
      if (filterPaymentStatus === 'Pending' && c.paymentStatus !== 'Pending') return false;
      if (filterPaymentStatus === 'Received' && c.paymentStatus !== 'Received') return false;
      if (filterPaymentStatus === 'Overdue') {
        if (c.paymentStatus !== 'Pending' || db.getPaymentUrgency(c) !== 'Overdue') return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.campaignName.toLowerCase().includes(q) ||
        c.brandName.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Quick Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" /> Campaign & Collaboration Master Directory
          </h2>
          <p className="text-xs text-slate-400">
            Centralized hub tracking all influencer brand deals, production stages, deliverables & payment terms.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Collaboration</span>
          </button>
        )}
      </div>

      {/* Filter Control Bar */}
      <div className="bg-tech-card border border-tech-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Search & Multi-Filter Controls
          </span>
          <button
            onClick={resetFilters}
            className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          {/* Text Search */}
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg pl-8 p-2 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Month Filter */}
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="bg-[#0b0f17] border border-tech-border text-cyan-300 font-bold rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Months / History</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Influencer Filter - Only visible in Admin Mode */}
          {isAdmin && (
            <select
              value={filterInfluencer}
              onChange={e => setFilterInfluencer(e.target.value)}
              className="bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
            >
              <option value="ALL">All Technology Influencers</option>
              {influencers.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          )}

          {/* Brand Filter */}
          <select
            value={filterBrand}
            onChange={e => setFilterBrand(e.target.value)}
            className="bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Sponsoring Brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Production Status Filter - ONLY 6 STATUSES */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Production Stages</option>
            <option value="Locked">Locked</option>
            <option value="Scripting Underway">Scripting Underway</option>
            <option value="Under Production">Under Production</option>
            <option value="Waiting for Approval">Waiting for Approval</option>
            <option value="Video Published">Video Published</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={e => setFilterPaymentStatus(e.target.value)}
            className="bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Payment Pending">Payment Pending</option>
            <option value="Advance Received">Advance Received</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Payment Processing">Payment Processing</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Received">Received</option>
            <option value="Overdue">⚠️ Overdue Only</option>
          </select>
        </div>
      </div>

      {/* Campaigns Data Table / Grid */}
      <div className="bg-tech-card border border-tech-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-tech-border bg-[#0e1420] flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredCampaigns.length} matching campaigns</span>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No collaborations found matching your active filter criteria. Try clicking "Clear Filters".
          </div>
        ) : (
          <div className="divide-y divide-tech-border text-xs">
            {filteredCampaigns.map(c => {
              const inf = db.getInfluencerById(c.influencerId);
              const urgency = db.getPaymentUrgency(c);

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCampaign(c.id)}
                  className="p-4 hover:bg-slate-800/40 cursor-pointer transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {c.brandName}
                      </span>
                      <h3 className="font-bold text-slate-100 text-xs truncate">{c.campaignName}</h3>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>
                        Creator: <strong className="text-slate-300">{inf?.name}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Stage: <strong className="text-indigo-400">{c.productionStatus}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Deliverables: {c.deliverables.filter(d => d.completed).length}/
                        {c.deliverables.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-100 font-mono block">
                        ₹{c.dealAmount.toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded inline-block ${
                          c.paymentStatus === 'Received'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : urgency === 'Overdue'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {c.paymentStatus} {urgency ? `(${urgency})` : ''}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
