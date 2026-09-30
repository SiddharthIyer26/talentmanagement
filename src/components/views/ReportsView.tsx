import React from 'react';
import { db } from '../../services/db';
import { FileBarChart, Download, Calendar, Sparkles } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const campaigns = db.getCampaigns();
  const influencers = db.getInfluencers();
  const metrics = db.getFinancialMetrics();

  const handleExportCSV = () => {
    const headers = ['Campaign ID', 'Influencer', 'Brand', 'Status', 'Deal Amount (INR)', 'Payment Status', 'Live Date'];
    const rows = campaigns.map(c => [
      c.id,
      db.getInfluencerById(c.influencerId)?.name || 'N/A',
      c.brandName,
      c.productionStatus,
      c.dealAmount,
      c.paymentStatus,
      c.liveDate || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `talent_os_report_august_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-cyan-400" /> Monthly Executive Reports & Data Export
          </h2>
          <p className="text-slate-400">
            Generate monthly commercial snapshots and download raw CSV reports for external accounting.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 bg-tech-border hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-600"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export August 2026 Raw CSV</span>
        </button>
      </div>

      {/* Snapshot Card */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> August 2026 Monthly Performance Summary
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-[#0b0f17] p-3 rounded-xl border border-tech-border">
            <span className="text-slate-400 block text-[10px]">Total Active Campaigns</span>
            <span className="text-xl font-bold font-mono text-slate-100">{campaigns.length}</span>
          </div>

          <div className="bg-[#0b0f17] p-3 rounded-xl border border-tech-border">
            <span className="text-slate-400 block text-[10px]">Gross Revenue</span>
            <span className="text-xl font-bold font-mono text-emerald-400">₹{metrics.totalRevenue.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-[#0b0f17] p-3 rounded-xl border border-tech-border">
            <span className="text-slate-400 block text-[10px]">Pending Receivables</span>
            <span className="text-xl font-bold font-mono text-amber-400">₹{metrics.pendingPayments.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-[#0b0f17] p-3 rounded-xl border border-tech-border">
            <span className="text-slate-400 block text-[10px]">Overdue Receivables</span>
            <span className="text-xl font-bold font-mono text-red-400">₹{metrics.overduePayments.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
