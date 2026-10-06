import React, { useState } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
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
  PieChart as PieIcon,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Calendar,
  CheckCircle2,
  Radio,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';

export const CollaborationsAnalyticsView: React.FC = () => {
  const isAdmin = authService.isAdmin();
  const activeInfluencer = authService.getActiveInfluencer();
  const allCampaigns = db.getCampaigns();
  const allInfluencers = db.getInfluencers();
  const dynamicMonths = db.getAvailableMonths();

  // Influencer role restriction: locked to activeInfluencer.id
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>(
    !isAdmin && activeInfluencer ? activeInfluencer.id : 'ALL'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Filter campaigns
  const filteredCampaigns = allCampaigns.filter(c => {
    // Role restriction
    if (!isAdmin && activeInfluencer && c.influencerId !== activeInfluencer.id) {
      return false;
    }
    // Admin influencer filter
    if (isAdmin && selectedInfluencerId !== 'ALL' && c.influencerId !== selectedInfluencerId) {
      return false;
    }
    // Dynamic month filter
    if (selectedMonth !== 'ALL') {
      const cMonth = db.getCampaignMonthLabel(c);
      if (cMonth.trim().toLowerCase() !== selectedMonth.trim().toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  // KPI Calculations
  const totalCollaborations = filteredCampaigns.length;
  const completedCollaborations = filteredCampaigns.filter(
    c => c.productionStatus === 'Video Published' || c.productionStatus === 'Completed'
  ).length;
  const liveCollaborations = filteredCampaigns.filter(
    c => c.liveLink || c.liveDate || c.productionStatus === 'Video Published'
  ).length;

  const totalViews = filteredCampaigns.reduce((acc, c) => acc + (c.metrics?.views || 0), 0);
  const totalLikes = filteredCampaigns.reduce((acc, c) => acc + (c.metrics?.likes || 0), 0);
  const totalComments = filteredCampaigns.reduce((acc, c) => acc + (c.metrics?.comments || 0), 0);
  const totalShares = filteredCampaigns.reduce((acc, c) => acc + (c.metrics?.shares || 0), 0);

  const totalInteractions = totalLikes + totalComments + totalShares;
  const avgEngagementRate = totalViews > 0
    ? ((totalInteractions / totalViews) * 100).toFixed(2)
    : '0.00';

  // Engagement Breakdown Data
  const engagementBreakdown = [
    { name: 'Likes', value: totalLikes, color: '#ec4899' },
    { name: 'Comments', value: totalComments, color: '#06b6d4' },
    { name: 'Shares', value: totalShares, color: '#a855f7' }
  ];

  // Campaign Performance Chart Data (Top 6 campaigns)
  const topCampaignsData = filteredCampaigns
    .filter(c => (c.metrics?.views || 0) > 0)
    .slice(0, 8)
    .map(c => ({
      name: c.brandName.slice(0, 10),
      fullName: `${c.brandName} - ${c.campaignName}`,
      Views: c.metrics?.views || 0,
      Likes: c.metrics?.likes || 0,
      Shares: c.metrics?.shares || 0,
      Comments: c.metrics?.comments || 0
    }));

  return (
    <div className="space-y-6 pb-12 text-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0e1420] via-tech-card to-cyan-950/30 border border-tech-border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-cyan-400" /> Collaborations Analytics
          </h2>
          <p className="text-slate-400 mt-0.5">
            Content reach, audience engagement, video views & collaboration delivery performance.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Influencer Filter: Admin can choose; Influencer is strictly locked */}
          {isAdmin ? (
            <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-tech-border px-3 py-1.5 rounded-xl">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedInfluencerId}
                onChange={e => setSelectedInfluencerId(e.target.value)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-[#0b0f17] text-slate-200">All Influencers</option>
                {allInfluencers.map(inf => (
                  <option key={inf.id} value={inf.id} className="bg-[#0b0f17] text-slate-200">
                    {inf.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-cyan-500/40 px-3 py-1.5 rounded-xl text-cyan-400 font-semibold">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeInfluencer?.name} (Personal Account)</span>
            </div>
          )}

          {/* Dynamic Month Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-tech-border px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#0b0f17] text-slate-200">All Dynamic Months</option>
              {dynamicMonths.map(m => (
                <option key={m} value={m} className="bg-[#0b0f17] text-slate-200">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards: 8 Content & Collaboration Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Collaborations */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-semibold">Total Collabs</span>
          <span className="text-xl font-black text-slate-100 font-mono mt-1">{totalCollaborations}</span>
          <span className="text-[9px] text-slate-500 mt-1">Campaigns</span>
        </div>

        {/* Completed */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1">{completedCollaborations}</span>
          <span className="text-[9px] text-slate-500 mt-1">Delivered</span>
        </div>

        {/* Live */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" /> Live Content
          </span>
          <span className="text-xl font-black text-cyan-300 font-mono mt-1">{liveCollaborations}</span>
          <span className="text-[9px] text-slate-500 mt-1">Published</span>
        </div>

        {/* Total Views */}
        <div className="bg-tech-card border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between bg-cyan-950/10">
          <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
            <Eye className="w-3 h-3" /> Total Views
          </span>
          <span className="text-xl font-black text-cyan-400 font-mono mt-1">
            {(totalViews / 1000000).toFixed(2)}M
          </span>
          <span className="text-[9px] text-slate-400 font-mono mt-1">{totalViews.toLocaleString('en-IN')}</span>
        </div>

        {/* Total Likes */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-pink-400 font-semibold flex items-center gap-1">
            <Heart className="w-3 h-3" /> Likes
          </span>
          <span className="text-xl font-black text-pink-400 font-mono mt-1">
            {(totalLikes / 1000).toFixed(0)}k
          </span>
          <span className="text-[9px] text-slate-400 font-mono mt-1">{totalLikes.toLocaleString('en-IN')}</span>
        </div>

        {/* Total Comments */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Comments
          </span>
          <span className="text-xl font-black text-blue-400 font-mono mt-1">
            {totalComments.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Discussions</span>
        </div>

        {/* Total Shares */}
        <div className="bg-tech-card border border-purple-500/30 rounded-xl p-3 flex flex-col justify-between bg-purple-950/10">
          <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
            <Share2 className="w-3 h-3" /> Shares
          </span>
          <span className="text-xl font-black text-purple-400 font-mono mt-1">
            {totalShares.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Virality</span>
        </div>

        {/* Engagement Rate */}
        <div className="bg-tech-card border border-tech-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Eng. Rate
          </span>
          <span className="text-xl font-black text-amber-400 font-mono mt-1">
            {avgEngagementRate}%
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Interactions / Views</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views & Shares by Collaboration */}
        <div className="lg:col-span-2 bg-tech-card border border-tech-border rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Collaboration Views & Reach Breakdown
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Top Campaigns</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCampaignsData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [`${Number(value).toLocaleString('en-IN')}`, name]}
                  contentStyle={{ backgroundColor: '#0e1420', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Views" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Likes" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Shares" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Distribution Pie */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Audience Engagement Ratio
            </h3>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {engagementBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString('en-IN')}`, 'Count']}
                  contentStyle={{ backgroundColor: '#0e1420', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-tech-border text-[10px]">
            <div className="bg-[#0b0f17] p-2 rounded-lg">
              <span className="text-pink-400 block font-semibold">Likes</span>
              <span className="font-mono text-slate-200 font-bold">{totalLikes.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-[#0b0f17] p-2 rounded-lg">
              <span className="text-cyan-400 block font-semibold">Comments</span>
              <span className="font-mono text-slate-200 font-bold">{totalComments.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-[#0b0f17] p-2 rounded-lg">
              <span className="text-purple-400 block font-semibold">Shares</span>
              <span className="font-mono text-slate-200 font-bold">{totalShares.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Performance Table */}
      <div className="bg-tech-card border border-tech-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-tech-border flex items-center justify-between bg-[#0e1420]">
          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Collaboration Content Performance Leaderboard
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Detailed tracking of video views, audience likes, comments, and shares across collaborations
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
            {filteredCampaigns.length} Collaborations Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-tech-border text-slate-400 bg-[#0b0f17]/50 text-[11px]">
                <th className="py-2.5 px-3">Collaboration / Campaign</th>
                <th className="py-2.5 px-3">Influencer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Views</th>
                <th className="py-2.5 px-3 text-right">Likes</th>
                <th className="py-2.5 px-3 text-right">Comments</th>
                <th className="py-2.5 px-3 text-right">Shares</th>
                <th className="py-2.5 px-3 text-right">Eng. Rate</th>
                <th className="py-2.5 px-3 text-center">Live Reel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border font-mono text-xs">
              {filteredCampaigns.map(c => {
                const inf = db.getInfluencerById(c.influencerId);
                const m = c.metrics || { views: 0, likes: 0, comments: 0, shares: 0 };
                const interactions = (m.likes || 0) + (m.comments || 0) + (m.shares || 0);
                const engRate = m.views > 0 ? ((interactions / m.views) * 100).toFixed(2) : '0.00';

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-sans">
                      <p className="font-bold text-slate-200">{c.campaignName}</p>
                      <p className="text-[10px] text-slate-400">{c.brandName} • Locked: {c.dealLockedDate}</p>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="font-semibold text-slate-300 block">{inf?.name}</span>
                      <span className="text-[10px] text-cyan-400">{inf?.handle}</span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-semibold">
                        {c.productionStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-cyan-400">
                      {(m.views || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right text-pink-400">
                      {(m.likes || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-400">
                      {(m.comments || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right text-purple-400 font-bold">
                      {(m.shares || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400 font-semibold">
                      {engRate}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      {c.liveLink ? (
                        <a
                          href={c.liveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline font-sans"
                        >
                          <span>Reel</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 font-sans text-[10px]">Unpublished</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
