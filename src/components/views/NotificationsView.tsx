import React from 'react';
import { db } from '../../services/db';
import { Bell, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface NotificationsViewProps {
  onSelectCampaign: (id: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onSelectCampaign }) => {
  const notifications = db.getNotifications();

  return (
    <div className="space-y-6 pb-12 text-xs">
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" /> Automated System Notifications & Alerts
        </h2>
        <p className="text-slate-400">
          Real-time alerts for overdue payments, pending video approvals & follow-up schedules.
        </p>
      </div>

      <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3">
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => n.campaignId && onSelectCampaign(n.campaignId)}
            className={`p-3.5 rounded-xl border flex items-start space-x-3 cursor-pointer transition-colors ${
              n.type === 'PAYMENT_DUE'
                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                : 'bg-[#0b0f17] border-tech-border hover:border-slate-600'
            }`}
          >
            {n.type === 'PAYMENT_DUE' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-200">{n.title}</h4>
                <span className="text-[10px] text-slate-500 font-mono">{n.timestamp}</span>
              </div>
              <p className="text-slate-400 mt-0.5">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
