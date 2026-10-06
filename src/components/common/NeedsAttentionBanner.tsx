import React from 'react';
import { db } from '../../services/db';
import { Campaign } from '../../types';
import { AlertCircle, Clock, CheckCircle2, ArrowRight, IndianRupee } from 'lucide-react';

interface NeedsAttentionBannerProps {
  onSelectCampaign: (id: string) => void;
}

export const NeedsAttentionBanner: React.FC<NeedsAttentionBannerProps> = ({ onSelectCampaign }) => {
  const campaigns = db.getCampaigns();

  // Find overdue payments, payments due within 7 days, approval pending
  const overdueCampaigns = campaigns.filter(
    c => c.paymentStatus === 'Pending' && db.getPaymentUrgency(c) === 'Overdue'
  );

  const dueSoonCampaigns = campaigns.filter(
    c => c.paymentStatus === 'Pending' && db.getPaymentUrgency(c) === 'Due Soon'
  );

  const approvalWaitingCampaigns = campaigns.filter(
    c => c.productionStatus === 'Waiting for Approval'
  );

  const pendingFollowUps = campaigns.filter(
    c => c.paymentStatus === 'Pending' && c.followUps.length > 0
  );

  const totalAttentionCount =
    overdueCampaigns.length + dueSoonCampaigns.length + approvalWaitingCampaigns.length;

  return (
    <div className="bg-gradient-to-r from-red-950/40 via-tech-card to-indigo-950/40 border border-red-500/30 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 border-b border-red-500/20 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-lg animate-pulse">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              TODAY / NEEDS ATTENTION{' '}
              <span className="bg-red-500 text-black text-xs px-2 py-0.5 rounded-full font-extrabold font-mono">
                {totalAttentionCount} Action Items
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              “What do I need to take care of today?” — Instant actionable campaign alerts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Overdue Payments */}
        <div className="bg-[#0b0f17]/80 border border-red-500/30 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-red-400 mb-2">
              <span className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" /> Payments Overdue
              </span>
              <span className="font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                {overdueCampaigns.length}
              </span>
            </div>
            {overdueCampaigns.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No overdue payments. All clean!</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {overdueCampaigns.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCampaign(c.id)}
                    className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors border border-red-500/20"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-200 truncate">{c.campaignName}</p>
                      <p className="text-[10px] text-red-400 font-mono">Due: {c.calculatedDueDate}</p>
                    </div>
                    <span className="font-bold text-slate-100 font-mono shrink-0">
                      ₹{c.dealAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Due in 7 Days */}
        <div className="bg-[#0b0f17]/80 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Due Within 7 Days
              </span>
              <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {dueSoonCampaigns.length}
              </span>
            </div>
            {dueSoonCampaigns.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No payments due within 7 days.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {dueSoonCampaigns.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCampaign(c.id)}
                    className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors border border-amber-500/20"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-200 truncate">{c.campaignName}</p>
                      <p className="text-[10px] text-amber-400 font-mono">Due: {c.calculatedDueDate}</p>
                    </div>
                    <span className="font-bold text-slate-100 font-mono shrink-0">
                      ₹{c.dealAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Approval Waiting */}
        <div className="bg-[#0b0f17]/80 border border-cyan-500/30 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Waiting for Approval
              </span>
              <span className="font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                {approvalWaitingCampaigns.length}
              </span>
            </div>
            {approvalWaitingCampaigns.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No videos pending client approval.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {approvalWaitingCampaigns.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCampaign(c.id)}
                    className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors border border-cyan-500/20"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-200 truncate">{c.campaignName}</p>
                      <p className="text-[10px] text-cyan-400">{c.brandName}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
