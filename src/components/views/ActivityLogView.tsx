import React from 'react';
import { db } from '../../services/db';
import { Activity, Clock, User, Shield } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const campaigns = db.getCampaigns();
  const activities = campaigns.flatMap(c => c.activities || []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-6 pb-12 text-xs">
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" /> Chronological System Audit & Activity Log
        </h2>
        <p className="text-slate-400">
          Complete audit trial tracking deal locks, stage transitions, payment updates & follow-up logs.
        </p>
      </div>

      <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3">
        {activities.map((act, idx) => (
          <div key={idx} className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200">{act.action}</span>
              <p className="text-[10px] text-slate-500">Actor: <strong className="text-slate-400">{act.actor}</strong></p>
            </div>
            <span className="font-mono text-cyan-400 text-[10px]">{act.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
