import React, { useState } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
import { CreditCard, IndianRupee, Clock, AlertTriangle, CheckCircle, MessageSquare, Filter } from 'lucide-react';

interface PaymentsViewProps {
  onSelectCampaign: (id: string) => void;
  selectedAdminInfluencerId?: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onSelectCampaign,
  selectedAdminInfluencerId = 'all',
}) => {
  const isAdmin = authService.isAdmin();
  const activeInfluencer = authService.getActiveInfluencer();

  let campaigns = db.getCampaigns();

  if (!isAdmin && activeInfluencer) {
    campaigns = campaigns.filter(c => c.influencerId === activeInfluencer.id);
  } else if (isAdmin && selectedAdminInfluencerId !== 'all') {
    campaigns = campaigns.filter(c => c.influencerId === selectedAdminInfluencerId);
  }

  const metrics = db.getFinancialMetrics(
    !isAdmin && activeInfluencer
      ? activeInfluencer.id
      : selectedAdminInfluencerId !== 'all'
      ? selectedAdminInfluencerId
      : undefined
  );

  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'Pending' | 'Due Today' | 'Due Soon' | 'Overdue' | 'Received'>('ALL');

  const filteredCampaigns = campaigns.filter(c => {
    const urgency = db.getPaymentUrgency(c);
    if (paymentFilter === 'Pending') return c.paymentStatus === 'Pending';
    if (paymentFilter === 'Received') return c.paymentStatus === 'Received';
    if (paymentFilter === 'Overdue') return c.paymentStatus === 'Pending' && urgency === 'Overdue';
    if (paymentFilter === 'Due Today') return c.paymentStatus === 'Pending' && urgency === 'Due Today';
    if (paymentFilter === 'Due Soon') return c.paymentStatus === 'Pending' && urgency === 'Due Soon';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" /> Dedicated Commercial Payments & Receivables
          </h2>
          <p className="text-xs text-slate-400">
            {isAdmin
              ? 'Independent receivables tracker with automatic payment term calculations & overdue status.'
              : 'Your personal payment tracker with status indicators and due date countdowns.'}
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-tech-card border border-tech-border rounded-xl p-4">
          <span className="text-slate-400 text-xs block mb-1">Contract Revenue</span>
          <span className="text-2xl font-extrabold text-slate-100 font-mono">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-tech-card border border-tech-border rounded-xl p-4">
          <span className="text-slate-400 text-xs block mb-1">Received Payments</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">
            ₹{metrics.paymentsReceived.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-tech-card border border-amber-500/30 rounded-xl p-4">
          <span className="text-amber-400 text-xs font-bold block mb-1">Pending Receivables</span>
          <span className="text-2xl font-extrabold text-amber-300 font-mono">
            ₹{metrics.pendingPayments.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-tech-card border border-red-500/30 rounded-xl p-4">
          <span className="text-red-400 text-xs font-bold block mb-1">Overdue Payments</span>
          <span className="text-2xl font-extrabold text-red-300 font-mono">
            ₹{metrics.overduePayments.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-tech-card border border-tech-border p-1.5 rounded-xl w-fit text-xs">
        {(['ALL', 'Pending', 'Due Today', 'Due Soon', 'Overdue', 'Received'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setPaymentFilter(tab)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              paymentFilter === tab
                ? 'bg-cyan-500 text-black font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'Overdue' ? '⚠️ Overdue' : tab === 'Due Today' ? '🔥 Due Today' : tab}
          </button>
        ))}
      </div>

      {/* Payment Table */}
      <div className="bg-tech-card border border-tech-border rounded-2xl overflow-hidden shadow-xl text-xs">
        <div className="divide-y divide-tech-border">
          {filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No payment records match the selected filter ({paymentFilter}).
            </div>
          ) : (
            filteredCampaigns.map(c => {
              const inf = db.getInfluencerById(c.influencerId);
              const urgency = db.getPaymentUrgency(c);

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCampaign(c.id)}
                  className="p-4 hover:bg-slate-800/40 cursor-pointer transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                        {c.brandName}
                      </span>
                      <h3 className="font-bold text-slate-100">{c.campaignName}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Creator: <strong className="text-slate-300">{inf?.name}</strong> • Live Date:{' '}
                      <span className="font-mono">{c.liveDate || 'Pending'}</span> • Terms:{' '}
                      <span className="font-mono">{c.paymentTermsDays} Days</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-100 font-mono block">
                        ₹{c.dealAmount.toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          c.paymentStatus === 'Received'
                            ? 'text-emerald-400'
                            : urgency === 'Overdue'
                            ? 'text-red-400'
                            : urgency === 'Due Today'
                            ? 'text-amber-300'
                            : 'text-amber-400'
                        }`}
                      >
                        Payment: {c.paymentStatus} {urgency ? `[${urgency}]` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
