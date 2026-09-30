import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { db } from '../../services/db';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign, Calendar, Eye, Sparkles, Award, Lock } from 'lucide-react';

export const InfluencerAnalyticsView: React.FC = () => {
  const influencer = authService.getActiveInfluencer();
  const [selectedMonth, setSelectedMonth] = useState('All Time History');

  if (!influencer) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Lock className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p>No active influencer session. Please select an influencer from the top role switcher.</p>
      </div>
    );
  }

  // Strictly filter campaigns belonging ONLY to this logged-in creator
  const allMyCampaigns = db.getCampaigns().filter(c => c.influencerId === influencer.id);

  const monthOptions = [
    'All Time History',
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
    'April 2026',
    'March 2026'
  ];

  // Filter campaigns by selected month
  const filteredCampaigns = allMyCampaigns.filter(c => {
    if (selectedMonth === 'All Time History') return true;
    if (selectedMonth === 'August 2026') return c.dealLockedDate.startsWith('2026-08');
    if (selectedMonth === 'July 2026') return c.dealLockedDate.startsWith('2026-07');
    if (selectedMonth === 'June 2026') return c.dealLockedDate.startsWith('2026-06');
    if (selectedMonth === 'May 2026') return c.dealLockedDate.startsWith('2026-05');
    if (selectedMonth === 'April 2026') return c.dealLockedDate.startsWith('2026-04');
    if (selectedMonth === 'March 2026') return c.dealLockedDate.startsWith('2026-03');
    return true;
  });

  // KPI Calculations
  const lifetimeRevenue = allMyCampaigns.reduce((acc, c) => acc + c.dealAmount, 0);
  const selectedMonthRevenue = filteredCampaigns.reduce((acc, c) => acc + c.dealAmount, 0);
  const totalLifetimeDeals = allMyCampaigns.length;
  const filteredDealsCount = filteredCampaigns.length;
  const avgDealValue = filteredDealsCount ? Math.round(selectedMonthRevenue / filteredDealsCount) : 0;
  
  const totalReceived = filteredCampaigns
    .filter(c => c.paymentStatus === 'Received')
    .reduce((acc, c) => acc + c.dealAmount, 0);
  const totalPending = filteredCampaigns
    .filter(c => c.paymentStatus === 'Pending')
    .reduce((acc, c) => acc + c.dealAmount, 0);

  const filteredViews = filteredCampaigns.reduce((acc, c) => acc + (c.metrics?.views || 0), 0);

  // Revenue by Brand Data (Creator's brands)
  const brandMap: { [key: string]: number } = {};
  filteredCampaigns.forEach(c => {
    brandMap[c.brandName] = (brandMap[c.brandName] || 0) + c.dealAmount;
  });

  const revByBrandData = Object.keys(brandMap).map(b => ({
    name: b,
    value: brandMap[b]
  }));

  // Revenue per Campaign Data
  const campaignChartData = filteredCampaigns.map(c => ({
    name: c.brandName,
    Revenue: c.dealAmount,
    Views: c.metrics?.views || 0
  }));

  const COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Creator Avatar & Month Selector */}
      <div className="bg-gradient-to-r from-[#0e1420] via-tech-card to-cyan-950/30 border border-tech-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <img
            src={influencer.avatarUrl}
            alt={influencer.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-400/50 shadow-md shadow-cyan-500/20 shrink-0"
          />
          <div>
            <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" /> Commercial Revenue Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Personal revenue insights, brand distribution & performance benchmarks for {influencer.name}.
            </p>
          </div>
        </div>

        {/* Month Selector Dropdown */}
        <div className="flex items-center space-x-2 bg-[#0b0f17] border border-cyan-500/40 px-3.5 py-2 rounded-xl text-xs shadow-md">
          <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400 text-xs hidden sm:inline">Filter Period:</span>
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
      </div>

      {/* KPI Cards: Creator Lifetime Revenue + Period Revenue + Average Deal Value + Received vs Pending */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CREATOR LIFETIME REVENUE */}
        <div className="bg-tech-card border border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">My Lifetime Revenue</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
              ₹{lifetimeRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-cyan-400/80 block mt-1 font-mono">
              Total Earnings Across {totalLifetimeDeals} Deals
            </span>
          </div>
        </div>

        {/* SELECTED PERIOD REVENUE */}
        <div className="bg-tech-card border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {selectedMonth === 'All Time History' ? 'Selected Period Revenue' : `${selectedMonth.split(' ')[0]} Revenue`}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ₹{selectedMonthRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-400/80 block mt-1 font-mono">
              {filteredDealsCount} Campaigns in {selectedMonth}
            </span>
          </div>
        </div>

        {/* AVG DEAL VALUE */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Deal Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
              ₹{avgDealValue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">
              Per Collaboration ({selectedMonth})
            </span>
          </div>
        </div>

        {/* RECEIVED VS PENDING */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Breakdown</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-baseline font-mono">
              <span className="text-xs text-slate-400">Received:</span>
              <span className="text-sm font-extrabold text-emerald-400">₹{totalReceived.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-baseline font-mono">
              <span className="text-xs text-slate-400">Pending:</span>
              <span className="text-sm font-extrabold text-amber-400">₹{totalPending.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Campaign Bar Chart */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Revenue per Brand Deal (₹)
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-normal">{selectedMonth}</span>
          </h3>
          <div className="h-64 w-full">
            {campaignChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No campaigns in selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0e1420', borderColor: '#1f293d', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Deal Amount']}
                  />
                  <Bar dataKey="Revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue Distribution by Brand Pie Chart */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> My Revenue Share by Brand
            </span>
            <span className="text-[10px] text-indigo-400 font-mono font-normal">{selectedMonth}</span>
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {revByBrandData.length === 0 ? (
              <div className="text-slate-500 text-xs">No brand data for selected period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revByBrandData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {revByBrandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0e1420', borderColor: '#1f293d', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total Commercial Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Details Table */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" /> Personal Commercial Breakdown
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">Filtered: {selectedMonth}</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-tech-border text-slate-400">
                <th className="py-2.5 px-3">Brand Partner</th>
                <th className="py-2.5 px-3">Campaign</th>
                <th className="py-2.5 px-3">Deal Value</th>
                <th className="py-2.5 px-3">Payment Status</th>
                <th className="py-2.5 px-3">Production Status</th>
                <th className="py-2.5 px-3">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border">
              {filteredCampaigns.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-200">{c.brandName}</td>
                  <td className="py-3 px-3 text-slate-300">{c.campaignName}</td>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                    ₹{c.dealAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-mono text-[11px] font-bold ${c.paymentStatus === 'Received' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {c.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px]">{c.productionStatus}</td>
                  <td className="py-3 px-3 font-mono text-indigo-400">
                    {c.metrics?.views ? (c.metrics.views / 1000).toFixed(0) + 'K' : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
