import React, { useState } from 'react';
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
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Eye, Sparkles, Award } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('All Time History');
  const influencers = db.getInfluencers();
  const allCampaigns = db.getCampaigns();

  const monthOptions = [
    'All Time History',
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
    'April 2026',
    'March 2026'
  ];

  // Month-filtered campaigns
  const filteredCampaigns = allCampaigns.filter(c => {
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
  const lifetimeRevenue = allCampaigns.reduce((acc, c) => acc + c.dealAmount, 0);
  const selectedMonthRevenue = filteredCampaigns.reduce((acc, c) => acc + c.dealAmount, 0);
  const totalLifetimeDeals = allCampaigns.length;
  const filteredDealsCount = filteredCampaigns.length;
  const lifetimeViews = allCampaigns.reduce((acc, c) => acc + (c.metrics?.views || 0), 0);
  const filteredViews = filteredCampaigns.reduce((acc, c) => acc + (c.metrics?.views || 0), 0);

  // Revenue by Influencer Chart Data
  const revByInfData = influencers.map(inf => {
    const infCamps = filteredCampaigns.filter(c => c.influencerId === inf.id);
    const revenue = infCamps.reduce((acc, c) => acc + c.dealAmount, 0);
    const views = infCamps.reduce((acc, c) => acc + (c.metrics?.views || 0), 0);
    return {
      name: inf.name.split(' ')[0], // Short name
      fullName: inf.name,
      Revenue: revenue,
      Views: views,
      Deals: infCamps.length
    };
  });

  // Revenue by Brand Data
  const brandMap: { [key: string]: number } = {};
  filteredCampaigns.forEach(c => {
    brandMap[c.brandName] = (brandMap[c.brandName] || 0) + c.dealAmount;
  });

  const revByBrandData = Object.keys(brandMap).map(b => ({
    name: b,
    value: brandMap[b]
  }));

  const COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Month Selector & Lifetime Revenue Badge */}
      <div className="bg-gradient-to-r from-[#0e1420] via-tech-card to-cyan-950/30 border border-tech-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" /> Admin Commercial & Performance Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Executive analytics dashboard comparing monthly revenue, views, engagement & creator productivity.
          </p>
        </div>

        {/* Month Selector Dropdown */}
        <div className="flex items-center space-x-2 bg-[#0b0f17] border border-cyan-500/40 px-3.5 py-2 rounded-xl text-xs shadow-md">
          <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400 text-xs hidden sm:inline">Select Period:</span>
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

      {/* KPI Cards: Lifetime Revenue + Month Revenue + Deals + Views */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LIFETIME REVENUE CARD */}
        <div className="bg-tech-card border border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Gross Revenue</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
              ₹{lifetimeRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-cyan-400/80 block mt-1 font-mono">
              Total Contract Volume ({totalLifetimeDeals} Deals)
            </span>
          </div>
        </div>

        {/* SELECTED MONTH REVENUE CARD */}
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

        {/* TOTAL DEALS */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Deals Filtered</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
              {filteredDealsCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">
              Out of {totalLifetimeDeals} Lifetime Deals
            </span>
          </div>
        </div>

        {/* AGGREGATE VIEWS */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Aggregate Views</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {(filteredViews / 1000).toFixed(0)}K+
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">
              {(lifetimeViews / 1000).toFixed(0)}K+ Lifetime Total
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Influencer Chart */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Gross Revenue by Creator (₹)
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-normal">{selectedMonth}</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revByInfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0e1420', borderColor: '#1f293d', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="Revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Share by Brand Pie Chart */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Revenue Distribution by Brand
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
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Creator Comparison Grid */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Influencer Productivity & Benchmark Comparison
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">Filtered: {selectedMonth}</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-tech-border text-slate-400">
                <th className="py-2.5 px-3">Creator Name</th>
                <th className="py-2.5 px-3">Deals Locked</th>
                <th className="py-2.5 px-3">Period Revenue</th>
                <th className="py-2.5 px-3">Avg Deal Value</th>
                <th className="py-2.5 px-3">Aggregate Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border">
              {revByInfData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-200">{item.fullName}</td>
                  <td className="py-3 px-3 font-mono text-cyan-400">{item.Deals}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-100">
                    ₹{item.Revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    ₹{item.Deals ? Math.round(item.Revenue / item.Deals).toLocaleString('en-IN') : 0}
                  </td>
                  <td className="py-3 px-3 font-mono text-indigo-400">
                    {item.Views.toLocaleString('en-IN')}
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
