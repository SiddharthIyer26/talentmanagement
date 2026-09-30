import React from 'react';
import { UserRole } from '../../types';
import { authService } from '../../services/authService';
import { db } from '../../services/db';
import { Shield, UserCheck } from 'lucide-react';

interface RoleSwitcherProps {
  onRoleChange: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ onRoleChange }) => {
  if (!authService.canSwitchRole()) {
    return null;
  }

  const session = authService.getSession();
  const influencers = db.getInfluencers();

  const handleRoleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADMIN') {
      authService.setAdminRole();
    } else {
      authService.setInfluencerRole(val);
    }
    onRoleChange();
  };

  return (
    <div className="flex items-center space-x-2 bg-tech-card/80 border border-tech-border px-3 py-1.5 rounded-lg text-xs">
      {session.role === 'ADMIN' ? (
        <Shield className="w-3.5 h-3.5 text-cyan-400" />
      ) : (
        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
      )}
      <span className="text-slate-400 font-medium hidden sm:inline">Role View:</span>
      <select
        value={session.role === 'ADMIN' ? 'ADMIN' : session.influencerId}
        onChange={handleRoleSelect}
        className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
      >
        <option value="ADMIN" className="bg-tech-card text-white">
          🛡️ Admin (Manager Account)
        </option>

        <optgroup label="📱 Influencer Portal Access">
          {influencers.map(inf => (
            <option key={inf.id} value={inf.id} className="bg-tech-card text-white">
              👤 Influencer: {inf.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
};
