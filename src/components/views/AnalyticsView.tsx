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
  CartesianGrid,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  IndianRupee,
  Building2,
  Percent,
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const influencers = db.getInfluencers();
  const allCampaigns = db.getCampaigns();
  const dynamicMonths = db.getAvailableMonths();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>('ALL');

  // Filtered campaigns
  const filteredCampaigns = allCampaigns.filter(c => {
    if (selectedMonth !== 'ALL') {
      const cMonth = db.getCampaignMonthLabel(c);
      if (cMonth.trim().toLowerCase() !== selectedMonth.trim().toLowerCase()) return false;
    }
    if (selectedInfluencer !== 'ALL' && c.influencerId !== selectedInfluencer) return false;
    return true;
  });

  // KPI calculations
  const totalCommercialVolume = filteredCampaigns.reduce((acc, c) => acc + (c.lockedCommercial || c.dealAmount || 0), 0);
  const totalCommissionRevenue = filteredCampaigns.reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
  const receivedCommercial = filteredCampaigns
    .filter(c => c.paymentStatus === 'Received' || c.paymentStatus === 'Paid')
    .reduce((acc, c) => acc + (c.receivedCommercial || c.amountReceived || c.lockedCommercial || c.dealAmount || 0), 0);
  const recognizedCommission = filteredCampaigns
    .filter(c => c.paymentStatus === 'Received' || c.paymentStatus === 'Paid')
    .reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
  const totalReceivables = filteredCampaigns
    .filter(c => c.paymentStatus !== 'Received' && c.paymentStatus !== 'Paid')
    .reduce((acc, c) => acc + Math.max(0, (c.lockedCommercial || c.dealAmount || 0) - (c.receivedCommercial || c.amountReceived || 0)), 0);
  const totalTds = filteredCampaigns.reduce((acc, c) => acc + (c.tdsDeductedAmount || 0), 0);

  // 1. Monthly Commission Revenue Chart Data
  const monthlyRevenueData = dynamicMonths.map(month => {
    const monthCamps = allCampaigns.filter(c => {
      if (selectedInfluencer !== 'ALL' && c.influencerId !== selectedInfluencer) return false;
      return db.getCampaignMonthLabel(c).trim().toLowerCase() === month.trim().toLowerCase();
    });

    const comm = monthCamps.reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
    const commRec = monthCamps
      .filter(c => c.paymentStatus === 'Received' || c.paymentStatus === 'Paid')
      .reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
    const dealVol = monthCamps.reduce((acc, c) => acc + (c.lockedCommercial || c.dealAmount || 0), 0);

    return {
      month: month.replace(' 2026', ''),
      fullMonth: month,
      'My Commission': comm,
      'Recognized Comm': commRec,
      'Commercial Deal Volume': dealVol
    };
  });

  // 2. Revenue by Influencer Data
  const revByInfData = influencers
    .filter(inf => selectedInfluencer === 'ALL' || inf.id === selectedInfluencer)
    .map(inf => {
      const infCamps = filteredCampaigns.filter(c => c.influencerId === inf.id);
      const commission = infCamps.reduce((acc, c) => acc + (c.commissionEarned || 0), 0);
      const commercial = infCamps.reduce((acc, c) => acc + (c.lockedCommercial || c.dealAmount || 0), 0);
      return {
        name: inf.name.split(' ')[0],
        fullName: inf.name,
        'Commission Revenue': commission,
        'Commercial Volume': commercial,
        dealsCount: infCamps.length
      };
    })
    .filter(d => d['Commercial Volume'] > 0 || selectedInfluencer !== 'ALL');

  // 3. Revenue by Brand Data
  const brandMap: { [key: string]: { commercial: number; commission: number } } = {};
  filteredCampaigns.forEach(c => {
    if (!brandMap[c.brandName]) {
      brandMap[c.brandName] = { commercial: 0, commission: 0 };
    }
    brandMap[c.brandName].commercial += (c.lockedCommercial || c.dealAmount || 0);
    brandMap[c.brandName].commission += (c.commissionEarned || 0);
  });

  const revByBrandData = Object.keys(brandMap).map(b => ({
    name: b,
    value: brandMap[b].commission,
    commercial: brandMap[b].commercial
  }));

  const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

  return (
    <div className="space-y-6 pb-12 text-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0e1420] via-tech-card to-emerald-950/30 border border-tech-border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Revenue Analytics
          </h2>
          <p className="text-slate-400 mt-0.5">
            Financial analytics for my independent business • Commission revenue, brand deal volumes, receivables & TDS breakdown.
          </p>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-tech-border px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0b0f17] text-slate-200">All Months</option>
              {dynamicMonths.map(m => (
                <option key={m} value={m} className="bg-[#0b0f17] text-slate-200">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Influencer Selector */}
          <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-tech-border px-3 py-1.5 rounded-xl">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedInfluencer}
              onChange={e => setSelectedInfluencer(e.target.value)}
              className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0b0f17] text-slate-200">All Influencers</option>
              {influencers.map(inf => (
                <option key={inf.id} value={inf.id} className="bg-[#0b0f17] text-slate-200">
                  {inf.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6 Key Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Commission Revenue */}
        <div className="bg-tech-card border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
            <span>My Commission</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            ₹{totalCommissionRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-500/80 block mt-1">
            ₹{recognizedCommission.toLocaleString('en-IN')} recognized
          </span>
        </div>

        {/* Total Commercial Volume */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Influencer Revenue</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
            ₹{totalCommercialVolume.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Total commercial deal size
          </span>
        </div>

        {/* Received Commercial */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Received by Brands</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
            ₹{receivedCommercial.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Amount paid to date
          </span>
        </div>

        {/* Receivables */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Receivables</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            ₹{totalReceivables.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Pending clearance
          </span>
        </div>

        {/* TDS Deducted */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>TDS Deducted</span>
            <Percent className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
            ₹{totalTds.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            10% withholding tax
          </span>
        </div>

        {/* Collaborations Count */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Deals</span>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-violet-300 font-mono">
            {filteredCampaigns.length}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Filtered collaborations
          </span>
        </div>
      </div>

      {/* Main Charts: Monthly Trend & Commission by Influencer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Commission & Commercial Trend */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Monthly Commission Revenue (INR ₹)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Dynamic Timeline</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#0e1420', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="My Commission" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recognized Comm" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commission by Influencer */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" /> Commission Revenue by Influencer (INR ₹)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Creator Share</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revByInfData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
                  contentStyle={{ backgroundColor: '#0e1420', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Bar dataKey="Commission Revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Brand Distribution & Financial Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand Commission Pie Chart */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3 shadow-xl">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-400" /> Commission Revenue by Brand
          </h3>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revByBrandData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {revByBrandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Commission']}
                  contentStyle={{ backgroundColor: '#0e1420', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Brand Financial Breakdown */}
        <div className="lg:col-span-2 bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3 shadow-xl overflow-hidden">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
            Brand Commercial & Commission Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-tech-border text-slate-400 bg-[#0b0f17]/50 text-[11px]">
                  <th className="py-2 px-3">Brand Partner</th>
                  <th className="py-2 px-3 text-right">Commercial Deal Value</th>
                  <th className="py-2 px-3 text-right">Commission Earned</th>
                  <th className="py-2 px-3 text-right">Effective Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tech-border">
                {revByBrandData.map(b => {
                  const rate = b.commercial > 0 ? ((b.value / b.commercial) * 100).toFixed(1) : '10';
                  return (
                    <tr key={b.name} className="hover:bg-slate-800/40 font-mono">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-200">{b.name}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        ₹{b.commercial.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        ₹{b.value.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-cyan-400">
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
