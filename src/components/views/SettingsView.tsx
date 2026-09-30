import React, { useState } from 'react';
import { db } from '../../services/db';
import { Influencer, ManagementUser } from '../../types';
import {
  Settings,
  Shield,
  Sliders,
  FileText,
  Bell,
  Sparkles,
  Users,
  Building,
  Plus,
  Key,
  Trash2,
  UserCheck,
  UserX,
  CreditCard,
  UserPlus
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const influencers = db.getInfluencers();
  const managementUsers = db.getManagementUsers();

  const [activeTab, setActiveTab] = useState<'influencers' | 'management' | 'branding' | 'payment-terms' | 'invoices' | 'reminders'>('management');

  // Individual Manager & Payment Details state (No GSTIN / Corporate Entity required)
  const [managerInvoiceSettings, setManagerInvoiceSettings] = useState({
    managerName: 'Siddharth Iyer',
    managerTitle: 'Independent Talent Manager',
    email: 'talent@iyer.tech',
    phone: '+91 98765 43210',
    bankName: 'HDFC Bank',
    accountName: 'Siddharth Iyer',
    accountNumber: '50200049281042',
    ifsc: 'HDFC0001245',
    upiId: 'iyer@upi',
    defaultInvoiceNotes: 'Payment due strictly within 30 days. Please quote invoice reference in transfer remarks.'
  });

  const [paymentTermSettings, setPaymentTermSettings] = useState({
    defaultTermDays: 30,
    dueSoonThresholdDays: 5,
    lateFeePercentage: 0,
    autoMarkOverdue: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enablePaymentAlerts: true,
    enableLiveDateReminders: true,
    enableFollowUpAlerts: true,
    reminderFrequencyDays: 3
  });

  // Creator & Login Management State
  const [selectedInfId, setSelectedInfId] = useState(influencers[0]?.id || '');
  const selectedInf = db.getInfluencerById(selectedInfId) || influencers[0];
  const [infFormData, setInfFormData] = useState<Influencer>(selectedInf);

  // New Creator Form State
  const [isAddingNewInf, setIsAddingNewInf] = useState(false);
  const [newInfData, setNewInfData] = useState({
    name: '',
    handle: '',
    city: 'Mumbai, India',
    email: '',
    username: '',
    password: '',
    reel: 75000,
    collabReel: 95000,
    storeVisitReel: 110000
  });

  // Management User Form State
  const [isAddingNewMgmt, setIsAddingNewMgmt] = useState(false);
  const [newMgmtData, setNewMgmtData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'Partner' as 'Owner' | 'Partner' | 'Talent Manager'
  });

  // Password reset inline states
  const [passwordResetInfId, setPasswordResetInfId] = useState<string | null>(null);
  const [passwordResetMgmtId, setPasswordResetMgmtId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  const handleSaveSettings = (msg: string) => {
    alert(`Settings Updated Successfully: ${msg}`);
  };

  // Management User Actions
  const handleCreateManagementUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMgmtData.name || !newMgmtData.username || !newMgmtData.password) {
      alert('Please fill in Name, Username, and Password!');
      return;
    }

    const created: ManagementUser = {
      id: 'mgmt-' + Date.now(),
      name: newMgmtData.name,
      email: newMgmtData.email || `${newMgmtData.username}@iyer.tech`,
      phone: newMgmtData.phone || '+91 98000 00000',
      username: newMgmtData.username,
      password: newMgmtData.password,
      role: newMgmtData.role,
      accountStatus: 'active'
    };

    db.saveManagementUser(created);
    alert(`Management Account Created! Username: ${created.username}, Role: ${created.role}`);
    setIsAddingNewMgmt(false);
    setNewMgmtData({
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      role: 'Partner'
    });
    triggerRefresh();
  };

  const handleToggleMgmtStatus = (user: ManagementUser) => {
    const newStatus = user.accountStatus === 'disabled' ? 'active' : 'disabled';
    db.toggleManagementUserStatus(user.id, newStatus);
    alert(`Status for ${user.name} set to ${newStatus.toUpperCase()}`);
    triggerRefresh();
  };

  const handleDeleteMgmtUser = (user: ManagementUser) => {
    if (confirm(`Delete management login profile for "${user.name}"?`)) {
      db.deleteManagementUser(user.id);
      alert(`Management profile "${user.name}" removed.`);
      triggerRefresh();
    }
  };

  const handleSaveMgmtResetPassword = (userId: string) => {
    if (!newPasswordValue) {
      alert('Please enter a new password!');
      return;
    }
    const users = db.getManagementUsers();
    const u = users.find(x => x.id === userId);
    if (u) {
      u.password = newPasswordValue;
      db.saveManagementUser(u);
      alert(`Password for ${u.name} updated to: ${newPasswordValue}`);
      setPasswordResetMgmtId(null);
      setNewPasswordValue('');
      triggerRefresh();
    }
  };

  // Creator Actions
  const handleSaveInfluencerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveInfluencer(infFormData);
    alert(`Profile & commercial rate card for ${infFormData.name} saved successfully!`);
    triggerRefresh();
  };

  const handleCreateNewInfluencer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInfData.name || !newInfData.handle || !newInfData.username) {
      alert('Please fill in Name, Handle, and Login Username!');
      return;
    }

    const created: Influencer = {
      id: 'inf-' + Date.now(),
      name: newInfData.name,
      handle: newInfData.handle.startsWith('@') ? newInfData.handle : `@${newInfData.handle}`,
      city: newInfData.city,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80`,
      bio: 'Technology content creator and ecosystem product reviewer.',
      email: newInfData.email || `${newInfData.username}@iyer.tech`,
      phone: '+91 98000 00000',
      pan: 'ABCDE9999F',
      username: newInfData.username,
      password: newInfData.password || 'password123',
      accountStatus: 'active',
      address: 'Tech Park, India',
      bankDetails: {
        accountName: `${newInfData.name} Media`,
        bankName: 'HDFC Bank',
        accountNumber: '998877665544',
        ifsc: 'HDFC0000123',
        pan: 'ABCDE9999F'
      },
      rateCard: {
        reel: Number(newInfData.reel),
        collabReel: Number(newInfData.collabReel),
        storeVisitReel: Number(newInfData.storeVisitReel),
        ugcVideo: 50000,
        story: 20000,
        carousel: 35000,
        adRights30d: 25000,
        adRights90d: 60000,
        adRights1y: 150000
      },
      monthlyInsightsSnapshots: [
        {
          monthYear: 'August 2026',
          views30d: 1500000,
          reach30d: 1200000,
          interactions30d: 220000,
          topAgeGroup: '18–34 (80%)',
          genderDistribution: 'Male 75% / Female 25%',
          topCities: ['Mumbai', 'Bengaluru'],
          dateRangeText: '1 Aug 2026 – 27 Aug 2026'
        }
      ]
    };

    db.saveInfluencer(created);
    alert(`Influencer Account Created! Username: ${created.username}, Password: ${created.password}`);
    setIsAddingNewInf(false);
    setSelectedInfId(created.id);
    setInfFormData(created);
    setNewInfData({
      name: '',
      handle: '',
      city: 'Mumbai, India',
      email: '',
      username: '',
      password: '',
      reel: 75000,
      collabReel: 95000,
      storeVisitReel: 110000
    });
    triggerRefresh();
  };

  const handleToggleInfAccountStatus = (inf: Influencer) => {
    const newStatus = inf.accountStatus === 'disabled' ? 'active' : 'disabled';
    db.toggleInfluencerAccountStatus(inf.id, newStatus);
    alert(`Account status for ${inf.name} set to ${newStatus.toUpperCase()}`);
    triggerRefresh();
  };

  const handleDeleteInfluencer = (inf: Influencer) => {
    if (confirm(`Delete creator account "${inf.name}"?`)) {
      db.deleteInfluencer(inf.id);
      alert(`Influencer profile "${inf.name}" deleted.`);
      triggerRefresh();
    }
  };

  const handleSaveInfResetPassword = (infId: string) => {
    if (!newPasswordValue) {
      alert('Please enter a new password!');
      return;
    }
    const inf = db.getInfluencerById(infId);
    if (inf) {
      inf.password = newPasswordValue;
      db.saveInfluencer(inf);
      alert(`Password for ${inf.name} updated to: ${newPasswordValue}`);
      setPasswordResetInfId(null);
      setNewPasswordValue('');
      triggerRefresh();
    }
  };

  return (
    <div key={refreshKey} className="space-y-6 pb-12 text-xs">
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" /> Admin System Settings & Credential Management
        </h2>
        <p className="text-slate-400">
          Manage partner/management login accounts, creator login credentials, payment terms, and individual manager invoice defaults.
        </p>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex space-x-2 border-b border-tech-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('management')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'management'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Management & Partner Logins
        </button>

        <button
          onClick={() => setActiveTab('influencers')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'influencers'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Influencer Login Roster
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'invoices'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Manager & Invoice Details
        </button>

        <button
          onClick={() => setActiveTab('payment-terms')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'payment-terms'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Payment Terms
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'reminders'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> Notifications
        </button>
      </div>

      {/* TAB: MANAGEMENT & PARTNER LOGINS */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-tech-card border border-tech-border p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> Management & Partner Access Credentials
              </h3>
              <p className="text-xs text-slate-400">
                Manage login credentials for yourself, co-managers, and strategic partners with full Admin access.
              </p>
            </div>
            <button
              onClick={() => setIsAddingNewMgmt(!isAddingNewMgmt)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingNewMgmt ? 'Cancel Form' : '+ Add Partner / Manager Login'}</span>
            </button>
          </div>

          {/* Form: Add New Management Member */}
          {isAddingNewMgmt && (
            <div className="bg-[#0e1420] border-2 border-cyan-500/40 p-5 rounded-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Create Partner / Co-Manager Login Account
              </h4>
              <form onSubmit={handleCreateManagementUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Varma"
                      value={newMgmtData.name}
                      onChange={e => setNewMgmtData({ ...newMgmtData, name: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="rahul@iyer.tech"
                      value={newMgmtData.email}
                      onChange={e => setNewMgmtData({ ...newMgmtData, email: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Role Type</label>
                    <select
                      value={newMgmtData.role}
                      onChange={e => setNewMgmtData({ ...newMgmtData, role: e.target.value as any })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-cyan-300 p-2 rounded-lg font-bold"
                    >
                      <option value="Owner">Owner / Primary Admin</option>
                      <option value="Partner">Partner / Co-Manager</option>
                      <option value="Talent Manager">Talent Executive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-cyan-400 font-bold mb-1">Login Username *</label>
                    <input
                      type="text"
                      placeholder="e.g. partner1"
                      value={newMgmtData.username}
                      onChange={e => setNewMgmtData({ ...newMgmtData, username: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-cyan-500/50 text-cyan-300 p-2 rounded-lg font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-400 font-bold mb-1">Initial Password *</label>
                    <input
                      type="text"
                      placeholder="partner123"
                      value={newMgmtData.password}
                      onChange={e => setNewMgmtData({ ...newMgmtData, password: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-cyan-500/50 text-cyan-300 p-2 rounded-lg font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewMgmt(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20"
                  >
                    Create Management Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Management Credentials Table */}
          <div className="bg-tech-card border border-tech-border rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-tech-border flex items-center justify-between bg-[#0e1420]">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Active Management & Partner Accounts ({managementUsers.length} Users)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-tech-border bg-[#0b0f17] text-[11px] text-slate-400">
                    <th className="p-3">Manager / Partner Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Login Username</th>
                    <th className="p-3">Password</th>
                    <th className="p-3">Account Access</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tech-border text-xs">
                  {managementUsers.map(user => {
                    const isDisabled = user.accountStatus === 'disabled';
                    return (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-slate-100">
                          <div>{user.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{user.email}</div>
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px]">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-cyan-300">
                          {user.username}
                        </td>
                        <td className="p-3 font-mono">
                          {passwordResetMgmtId === user.id ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={newPasswordValue}
                                onChange={e => setNewPasswordValue(e.target.value)}
                                placeholder="New password"
                                className="bg-[#0b0f17] border border-cyan-500/50 text-cyan-300 text-xs p-1 rounded font-mono w-28"
                              />
                              <button
                                onClick={() => handleSaveMgmtResetPassword(user.id)}
                                className="px-2 py-1 bg-cyan-500 text-black font-bold text-[10px] rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setPasswordResetMgmtId(null)}
                                className="px-1.5 py-1 text-slate-400 hover:text-white text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-300">{user.password}</span>
                              <button
                                onClick={() => {
                                  setPasswordResetMgmtId(user.id);
                                  setNewPasswordValue('');
                                }}
                                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                              >
                                <Key className="w-3 h-3" /> Reset
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isDisabled
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isDisabled ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {isDisabled ? 'Disabled' : 'Active Access'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleToggleMgmtStatus(user)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                                isDisabled
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                              }`}
                            >
                              {isDisabled ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              onClick={() => handleDeleteMgmtUser(user)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                              title="Delete Management Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INFLUENCER LOGIN ROSTER */}
      {activeTab === 'influencers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-tech-card border border-tech-border p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Influencer Profile & Login Credentials Roster
              </h3>
              <p className="text-xs text-slate-400">
                Create new creator logins, update passwords, edit rate cards, and enable/disable account access.
              </p>
            </div>
            <button
              onClick={() => setIsAddingNewInf(!isAddingNewInf)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingNewInf ? 'Cancel Form' : '+ Create New Creator Login'}</span>
            </button>
          </div>

          {/* Form: Create New Influencer Account */}
          {isAddingNewInf && (
            <div className="bg-[#0e1420] border-2 border-cyan-500/40 p-5 rounded-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Add New Creator Profile & Login Credentials
              </h4>
              <form onSubmit={handleCreateNewInfluencer} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Creator Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={newInfData.name}
                      onChange={e => setNewInfData({ ...newInfData, name: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Instagram Handle *</label>
                    <input
                      type="text"
                      placeholder="e.g. @alextech"
                      value={newInfData.handle}
                      onChange={e => setNewInfData({ ...newInfData, handle: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Location City</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, India"
                      value={newInfData.city}
                      onChange={e => setNewInfData({ ...newInfData, city: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="alex@iyer.tech"
                      value={newInfData.email}
                      onChange={e => setNewInfData({ ...newInfData, email: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-400 font-bold mb-1">Login Username *</label>
                    <input
                      type="text"
                      placeholder="e.g. alextech"
                      value={newInfData.username}
                      onChange={e => setNewInfData({ ...newInfData, username: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-cyan-500/50 text-cyan-300 p-2 rounded-lg font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-400 font-bold mb-1">Initial Password *</label>
                    <input
                      type="text"
                      placeholder="password123"
                      value={newInfData.password}
                      onChange={e => setNewInfData({ ...newInfData, password: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-cyan-500/50 text-cyan-300 p-2 rounded-lg font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Single Reel Rate (₹)</label>
                    <input
                      type="number"
                      value={newInfData.reel}
                      onChange={e => setNewInfData({ ...newInfData, reel: Number(e.target.value) })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Collab Reel Rate (₹)</label>
                    <input
                      type="number"
                      value={newInfData.collabReel}
                      onChange={e => setNewInfData({ ...newInfData, collabReel: Number(e.target.value) })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Store Visit Rate (₹)</label>
                    <input
                      type="number"
                      value={newInfData.storeVisitReel}
                      onChange={e => setNewInfData({ ...newInfData, storeVisitReel: Number(e.target.value) })}
                      className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 p-2 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewInf(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20"
                  >
                    Save & Generate Creator Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Influencer Roster & Credentials Management Table */}
          <div className="bg-tech-card border border-tech-border rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-tech-border flex items-center justify-between bg-[#0e1420]">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Existing Influencer Accounts ({influencers.length} Accounts)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-tech-border bg-[#0b0f17] text-[11px] text-slate-400">
                    <th className="p-3">Creator</th>
                    <th className="p-3">Login Username</th>
                    <th className="p-3">Current Password</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tech-border text-xs">
                  {influencers.map(inf => {
                    const isDisabled = inf.accountStatus === 'disabled';
                    return (
                      <tr key={inf.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={inf.avatarUrl}
                              alt={inf.name}
                              className="w-8 h-8 rounded-full object-cover border border-cyan-500/40"
                            />
                            <div>
                              <div className="font-bold text-slate-100">{inf.name}</div>
                              <div className="text-[10px] text-cyan-400 font-mono">{inf.handle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-cyan-300">
                          {inf.username || inf.handle.replace('@', '')}
                        </td>
                        <td className="p-3 font-mono">
                          {passwordResetInfId === inf.id ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={newPasswordValue}
                                onChange={e => setNewPasswordValue(e.target.value)}
                                placeholder="New password"
                                className="bg-[#0b0f17] border border-cyan-500/50 text-cyan-300 text-xs p-1 rounded font-mono w-28"
                              />
                              <button
                                onClick={() => handleSaveInfResetPassword(inf.id)}
                                className="px-2 py-1 bg-cyan-500 text-black font-bold text-[10px] rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setPasswordResetInfId(null)}
                                className="px-1.5 py-1 text-slate-400 hover:text-white text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-300">{inf.password || 'password123'}</span>
                              <button
                                onClick={() => {
                                  setPasswordResetInfId(inf.id);
                                  setNewPasswordValue('');
                                }}
                                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                              >
                                <Key className="w-3 h-3" /> Reset
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isDisabled
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isDisabled ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {isDisabled ? 'Disabled' : 'Active Access'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedInfId(inf.id);
                                setInfFormData(inf);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg"
                            >
                              Edit Profile & Rates
                            </button>
                            <button
                              onClick={() => handleToggleInfAccountStatus(inf)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                                isDisabled
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                              }`}
                            >
                              {isDisabled ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              onClick={() => handleDeleteInfluencer(inf)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                              title="Delete Influencer Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rate Card Editor Form */}
          {selectedInf && (
            <div className="bg-tech-card border border-tech-border rounded-2xl p-6 space-y-4 max-w-3xl">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Edit Details & Rate Card for: <span className="text-cyan-300 font-mono">{selectedInf.name}</span>
              </h3>

              <form onSubmit={handleSaveInfluencerSettings} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={infFormData.name}
                      onChange={e => setInfFormData({ ...infFormData, name: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      value={infFormData.handle}
                      onChange={e => setInfFormData({ ...infFormData, handle: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Login Username</label>
                    <input
                      type="text"
                      value={infFormData.username || ''}
                      onChange={e => setInfFormData({ ...infFormData, username: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-cyan-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Login Password</label>
                    <input
                      type="text"
                      value={infFormData.password || ''}
                      onChange={e => setInfFormData({ ...infFormData, password: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Reel Commercial (₹)</label>
                    <input
                      type="number"
                      value={infFormData.rateCard.reel}
                      onChange={e =>
                        setInfFormData({
                          ...infFormData,
                          rateCard: { ...infFormData.rateCard, reel: Number(e.target.value) }
                        })
                      }
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Collab Reel Commercial (₹)</label>
                    <input
                      type="number"
                      value={infFormData.rateCard.collabReel}
                      onChange={e =>
                        setInfFormData({
                          ...infFormData,
                          rateCard: { ...infFormData.rateCard, collabReel: Number(e.target.value) }
                        })
                      }
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Store Visit Commercial (₹)</label>
                    <input
                      type="number"
                      value={infFormData.rateCard.storeVisitReel}
                      onChange={e =>
                        setInfFormData({
                          ...infFormData,
                          rateCard: { ...infFormData.rateCard, storeVisitReel: Number(e.target.value) }
                        })
                      }
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow"
                >
                  Save Profile & Rate Changes
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB: MANAGER & INVOICE DETAILS (Simplified — No Entity Name or GSTIN required) */}
      {activeTab === 'invoices' && (
        <div className="bg-tech-card border border-tech-border rounded-2xl p-6 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> Individual Talent Manager Invoice & Payment Defaults
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure your personal manager details, contact info, and bank/UPI accounts for issuing invoices as an individual.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Talent Manager Name</label>
              <input
                type="text"
                value={managerInvoiceSettings.managerName}
                onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, managerName: e.target.value })}
                className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Manager Designation / Title</label>
              <input
                type="text"
                value={managerInvoiceSettings.managerTitle}
                onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, managerTitle: e.target.value })}
                className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Contact Email</label>
              <input
                type="email"
                value={managerInvoiceSettings.email}
                onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, email: e.target.value })}
                className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={managerInvoiceSettings.phone}
                onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, phone: e.target.value })}
                className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Payment & Bank / UPI Defaults */}
          <div className="border-t border-tech-border pt-4 space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Personal Bank Account & UPI Receivables
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={managerInvoiceSettings.bankName}
                  onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, bankName: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={managerInvoiceSettings.accountName}
                  onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, accountName: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Account Number</label>
                <input
                  type="text"
                  value={managerInvoiceSettings.accountNumber}
                  onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, accountNumber: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={managerInvoiceSettings.ifsc}
                  onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, ifsc: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={managerInvoiceSettings.upiId}
                  onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, upiId: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-cyan-300 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Default Invoice Payment Terms & Instructions</label>
            <textarea
              value={managerInvoiceSettings.defaultInvoiceNotes}
              onChange={e => setManagerInvoiceSettings({ ...managerInvoiceSettings, defaultInvoiceNotes: e.target.value })}
              rows={3}
              className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
            />
          </div>

          <button
            onClick={() => handleSaveSettings('Manager Invoice Defaults Saved')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow"
          >
            Save Manager Invoice Defaults
          </button>
        </div>
      )}

      {/* TAB: PAYMENT TERMS */}
      {activeTab === 'payment-terms' && (
        <div className="bg-tech-card border border-tech-border rounded-2xl p-6 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Default Commercial Payment Terms & Urgency Rules
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Standard Payment Term Days</label>
              <input
                type="number"
                value={paymentTermSettings.defaultTermDays}
                onChange={e => setPaymentTermSettings({ ...paymentTermSettings, defaultTermDays: Number(e.target.value) })}
                className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">"Due Soon" Notification Threshold (Days Before Due Date)</label>
              <input
                type="number"
                value={paymentTermSettings.dueSoonThresholdDays}
                onChange={e => setPaymentTermSettings({ ...paymentTermSettings, dueSoonThresholdDays: Number(e.target.value) })}
                className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
              />
            </div>
          </div>
          <button
            onClick={() => handleSaveSettings('Payment Term Rules Updated')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow"
          >
            Save Term Rules
          </button>
        </div>
      )}

      {/* TAB: NOTIFICATION ALERTS */}
      {activeTab === 'reminders' && (
        <div className="bg-tech-card border border-tech-border rounded-2xl p-6 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" /> Notification Thresholds & Automated Reminders
          </h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-slate-200">
              <input
                type="checkbox"
                checked={notificationSettings.enablePaymentAlerts}
                onChange={e => setNotificationSettings({ ...notificationSettings, enablePaymentAlerts: e.target.checked })}
                className="accent-cyan-400"
              />
              <span>Enable Automatic Payment Due Bell Notifications</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-200">
              <input
                type="checkbox"
                checked={notificationSettings.enableLiveDateReminders}
                onChange={e => setNotificationSettings({ ...notificationSettings, enableLiveDateReminders: e.target.checked })}
                className="accent-cyan-400"
              />
              <span>Enable Video Live-Date Calendar Reminders</span>
            </label>
          </div>
          <button
            onClick={() => handleSaveSettings('Notification Preferences Saved')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow"
          >
            Save Alert Preferences
          </button>
        </div>
      )}
    </div>
  );
};
