import React, { useState } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
import { Influencer } from '../../types';
import {
  Users,
  Edit3,
  IndianRupee,
  CreditCard,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  FileText,
  Check,
  Trash2,
  AlertTriangle,
  Plus,
  X
} from 'lucide-react';
import { ImageCropModal } from '../common/ImageCropModal';

export const InfluencersView: React.FC = () => {
  const [influencers, setInfluencers] = useState<Influencer[]>(db.getInfluencers());
  const [selectedInf, setSelectedInf] = useState<Influencer>(influencers[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Influencer>(influencers[0] || ({} as Influencer));
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newInfData, setNewInfData] = useState({
    name: '',
    handle: '',
    city: 'Bengaluru, India',
    email: '',
    phone: '+91 98000 00000',
    username: '',
    password: 'password123',
    invoicePrefix: '',
    reel: 75000,
    collabReel: 95000,
    storeVisitReel: 110000,
    accountName: '',
    bankName: 'HDFC Bank',
    accountNumber: '998877665544',
    ifsc: 'HDFC0000123',
    pan: 'ABCDE1234F',
    address: 'Tech Park, India'
  });

  // Admin Check
  const isAdmin = authService.isAdmin();

  const refreshInfluencers = () => {
    const list = db.getInfluencers();
    setInfluencers(list);
    if (selectedInf) {
      const stillThere = list.find(i => i.id === selectedInf.id);
      setSelectedInf(stillThere || list[0] || null);
      if (stillThere) setFormData(stillThere);
    } else {
      setSelectedInf(list[0] || null);
      if (list[0]) setFormData(list[0]);
    }
  };

  const handleSelect = (inf: Influencer) => {
    setSelectedInf(inf);
    setFormData(inf);
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveInfluencer(formData);
    setSelectedInf(formData);
    setIsEditing(false);
    refreshInfluencers();
    alert('Influencer profile updated successfully!');
  };

  const handleDeleteInfluencer = () => {
    if (!selectedInf) return;
    db.deleteInfluencer(selectedInf.id);
    setIsDeleteModalOpen(false);
    refreshInfluencers();
  };

  const handleCreateInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInfData.name.trim() || !newInfData.handle.trim()) {
      alert('Please provide creator Name and Handle!');
      return;
    }

    const autoUsername = newInfData.username.trim() || newInfData.handle.replace(/[@\s]/g, '').toLowerCase();
    const autoPrefix = (newInfData.invoicePrefix.trim() || newInfData.name.trim().slice(0, 2)).toUpperCase();
    const email = newInfData.email.trim() || `${autoUsername}@iyer.tech`;

    const res = await authService.provisionInfluencer({
      name: newInfData.name.trim(),
      handle: newInfData.handle.startsWith('@') ? newInfData.handle.trim() : `@${newInfData.handle.trim()}`,
      city: newInfData.city.trim() || 'India',
      email,
      phone: newInfData.phone.trim() || '+91 98000 00000',
      pan: newInfData.pan.trim().toUpperCase() || 'ABCDE1234F',
      username: autoUsername,
      password: newInfData.password.trim() || 'password123',
      invoicePrefix: autoPrefix,
      bankDetails: {
        accountName: newInfData.accountName.trim() || `${newInfData.name.trim()} Media`,
        bankName: newInfData.bankName.trim() || 'HDFC Bank',
        accountNumber: newInfData.accountNumber.trim() || '998877665544',
        ifsc: newInfData.ifsc.trim().toUpperCase() || 'HDFC0000123',
        pan: newInfData.pan.trim().toUpperCase() || 'ABCDE1234F'
      },
      rateCard: {
        reel: Number(newInfData.reel) || 75000,
        collabReel: Number(newInfData.collabReel) || 95000,
        storeVisitReel: Number(newInfData.storeVisitReel) || 110000,
        ugcVideo: 50000,
        story: 20000,
        carousel: 35000,
        adRights30d: 25000,
        adRights90d: 60000,
        adRights1y: 150000
      }
    });

    alert(res.message);
    if (res.success) {
      setIsAddModalOpen(false);
      refreshInfluencers();
      const all = db.getInfluencers();
      const found = all.find(i => i.email === email) || all[0];
      if (found) {
        setSelectedInf(found);
        setFormData(found);
      }
      setNewInfData({
        name: '',
        handle: '',
        city: 'Bengaluru, India',
        email: '',
        phone: '+91 98000 00000',
        username: '',
        password: 'password123',
        invoicePrefix: '',
        reel: 75000,
        collabReel: 95000,
        storeVisitReel: 110000,
        accountName: '',
        bankName: 'HDFC Bank',
        accountNumber: '998877665544',
        ifsc: 'HDFC0000123',
        pan: 'ABCDE1234F',
        address: 'Tech Park, India'
      });
    }
  };

  const influencerCampaigns = selectedInf
    ? db.getCampaigns().filter(c => c.influencerId === selectedInf.id)
    : [];

  return (
    <div className="space-y-6 pb-12 text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Technology Influencers Roster
          </h2>
          <p className="text-slate-400">
            Single source of truth for creator profiles, rate cards, bank details, PAN & unique invoice codes.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Influencer</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Creator List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Creator Roster</h3>
          {influencers.map(inf => (
            <div
              key={inf.id}
              onClick={() => handleSelect(inf)}
              className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-3 transition-all ${
                selectedInf?.id === inf.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 border-cyan-500/50 shadow-md'
                  : 'bg-tech-card border-tech-border hover:border-slate-600'
              }`}
            >
              <img src={inf.avatarUrl} alt={inf.name} className="w-10 h-10 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-200 text-xs truncate">{inf.name}</h4>
                <p className="text-[10px] text-cyan-400 font-mono truncate">{inf.handle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Creator Detail Card */}
        {selectedInf && (
          <div className="md:col-span-3 bg-tech-card border border-tech-border rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-tech-border pb-4">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedInf.avatarUrl}
                  alt={selectedInf.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    {selectedInf.name}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      Invoice Prefix: {db.getInfluencerPrefix(selectedInf.id)}
                    </span>
                  </h3>
                  <p className="text-xs text-cyan-400 font-mono">{selectedInf.handle}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-500" /> {selectedInf.city}
                  </p>
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1.5 bg-tech-border hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Profile & Rates'}</span>
                  </button>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-6 text-xs">
                {/* Bio & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] text-slate-500">
                      About / Creator Bio
                    </h4>
                    <p className="text-slate-300 leading-relaxed">{selectedInf.bio}</p>
                    <p className="text-slate-400 pt-2 border-t border-tech-border">
                      <strong className="text-slate-300">Registered Address:</strong> {selectedInf.address}
                    </p>
                  </div>

                  <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] text-slate-500">
                      Official Contact & PAN
                    </h4>
                    <p className="text-slate-300 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" /> {selectedInf.email}
                    </p>
                    <p className="text-slate-300 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" /> {selectedInf.phone}
                    </p>
                    <p className="text-slate-300 font-mono flex items-center gap-2 pt-2 border-t border-tech-border">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" /> PAN: {selectedInf.pan}
                    </p>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Bank & Payout Remittance Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Account Holder</span>
                      <span className="font-semibold text-slate-200">{selectedInf.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Bank Name</span>
                      <span className="font-semibold text-slate-200">{selectedInf.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Account Number</span>
                      <span className="font-semibold font-mono text-cyan-400">{selectedInf.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">IFSC Code</span>
                      <span className="font-semibold font-mono text-slate-200">{selectedInf.bankDetails.ifsc}</span>
                    </div>
                  </div>
                </div>

                {/* Rate Card */}
                <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-400" /> Official Commercial Rate Card (INR ₹)
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-tech-card p-2.5 rounded-lg border border-tech-border">
                      <span className="text-[10px] text-slate-400 block">Reel</span>
                      <span className="font-extrabold text-slate-100 font-mono">
                        ₹{selectedInf.rateCard.reel.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-tech-card p-2.5 rounded-lg border border-tech-border">
                      <span className="text-[10px] text-slate-400 block">Collab Reel</span>
                      <span className="font-extrabold text-cyan-400 font-mono">
                        ₹{selectedInf.rateCard.collabReel.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-tech-card p-2.5 rounded-lg border border-tech-border">
                      <span className="text-[10px] text-slate-400 block">Store Visit Reel</span>
                      <span className="font-extrabold text-indigo-400 font-mono">
                        ₹{selectedInf.rateCard.storeVisitReel.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-tech-card p-2.5 rounded-lg border border-tech-border">
                      <span className="text-[10px] text-slate-400 block">UGC Video</span>
                      <span className="font-extrabold text-emerald-400 font-mono">
                        ₹{selectedInf.rateCard.ugcVideo.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-tech-card p-2.5 rounded-lg border border-tech-border">
                      <span className="text-[10px] text-slate-400 block">Story</span>
                      <span className="font-extrabold text-amber-400 font-mono">
                        ₹{selectedInf.rateCard.story.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-tech-card p-2.5 rounded-lg border border-tech-border">
                      <span className="text-[10px] text-slate-400 block">Carousel</span>
                      <span className="font-extrabold text-violet-400 font-mono">
                        ₹{selectedInf.rateCard.carousel.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-tech-card p-2.5 rounded-lg border border-tech-border">
                      <span className="text-[10px] text-slate-400 block">Ad Rights 30d</span>
                      <span className="font-extrabold text-pink-400 font-mono">
                        ₹{selectedInf.rateCard.adRights30d.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-tech-card p-2.5 rounded-lg border border-tech-border">
                      <span className="text-[10px] text-slate-400 block">Ad Rights 90d</span>
                      <span className="font-extrabold text-cyan-300 font-mono">
                        ₹{selectedInf.rateCard.adRights90d.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Form */
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={e => setFormData({ ...formData, handle: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Invoice Prefix (2 letters)</label>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="e.g. JD"
                      value={formData.invoicePrefix || ''}
                      onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-cyan-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={formData.pan}
                      onChange={e => setFormData({ ...formData, pan: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Creator Bio</label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                  />
                </div>

                {/* Rate Card Edit */}
                <div className="p-3 bg-[#0b0f17] rounded-xl border border-tech-border space-y-2">
                  <span className="font-bold text-slate-300 block">Edit Commercial Rates (₹)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[10px]">Reel (₹)</label>
                      <input
                        type="number"
                        value={formData.rateCard.reel}
                        onChange={e => setFormData({
                          ...formData,
                          rateCard: { ...formData.rateCard, reel: Number(e.target.value) }
                        })}
                        className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px]">Collab Reel (₹)</label>
                      <input
                        type="number"
                        value={formData.rateCard.collabReel}
                        onChange={e => setFormData({
                          ...formData,
                          rateCard: { ...formData.rateCard, collabReel: Number(e.target.value) }
                        })}
                        className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px]">Store Visit Reel (₹)</label>
                      <input
                        type="number"
                        value={formData.rateCard.storeVisitReel}
                        onChange={e => setFormData({
                          ...formData,
                          rateCard: { ...formData.rateCard, storeVisitReel: Number(e.target.value) }
                        })}
                        className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px]">Story (₹)</label>
                      <input
                        type="number"
                        value={formData.rateCard.story}
                        onChange={e => setFormData({
                          ...formData,
                          rateCard: { ...formData.rateCard, story: Number(e.target.value) }
                        })}
                        className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-tech-border">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg shadow-lg shadow-cyan-500/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Admin only) */}
      {isDeleteModalOpen && selectedInf && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-tech-card border border-red-500/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-sm">Delete Creator Confirmation</h3>
            </div>

            <p className="text-slate-300">
              Are you sure you want to permanently delete creator <strong className="text-white">{selectedInf.name} ({selectedInf.handle})</strong>?
            </p>

            {influencerCampaigns.length > 0 && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-1">
                <span className="font-bold text-red-300 block">Existing Collaborations Notice:</span>
                <p className="text-[11px] text-red-200">
                  This creator has <strong className="underline">{influencerCampaigns.length} linked collaborations</strong>. Deleting this creator will remove their record from the roster.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInfluencer}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-600/30"
              >
                Yes, Delete Creator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Influencer Modal (Admin only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-tech-card border border-tech-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-tech-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">+ Add New Technology Influencer</h3>
                  <p className="text-slate-400 text-xs">Create a new creator profile, assign custom rate cards, bank details & invoice sequence prefix.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInfluencer} className="space-y-4">
              {/* Profile Details */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">1. Creator Profile Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Creator Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rakshith Hegde"
                      value={newInfData.name}
                      onChange={e => setNewInfData({ ...newInfData, name: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-100 p-2 rounded-lg font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Instagram Handle *</label>
                    <input
                      type="text"
                      placeholder="e.g. @rakshithtech"
                      value={newInfData.handle}
                      onChange={e => setNewInfData({ ...newInfData, handle: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-cyan-400 p-2 rounded-lg font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">City / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, India"
                      value={newInfData.city}
                      onChange={e => setNewInfData({ ...newInfData, city: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Email</label>
                    <input
                      type="email"
                      placeholder="creator@techmail.com"
                      value={newInfData.email}
                      onChange={e => setNewInfData({ ...newInfData, email: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98000 00000"
                      value={newInfData.phone}
                      onChange={e => setNewInfData({ ...newInfData, phone: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Invoice Prefix (2 letters)</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. RA (Auto derived if blank)"
                      value={newInfData.invoicePrefix}
                      onChange={e => setNewInfData({ ...newInfData, invoicePrefix: e.target.value.toUpperCase() })}
                      className="w-full bg-tech-card border border-tech-border text-indigo-400 p-2 rounded-lg font-mono font-bold uppercase"
                      title="Used for invoice numbering sequence [Prefix]-[Year]-[0001]"
                    />
                  </div>
                </div>
              </div>

              {/* Portal Login Credentials */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-indigo-400 uppercase text-[10px] tracking-wider">2. Influencer Portal Login Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Login Username</label>
                    <input
                      type="text"
                      placeholder="e.g. rakshith"
                      value={newInfData.username}
                      onChange={e => setNewInfData({ ...newInfData, username: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-cyan-300 p-2 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Password</label>
                    <input
                      type="text"
                      value={newInfData.password}
                      onChange={e => setNewInfData({ ...newInfData, password: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Rate Card */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">3. Commercial Rate Card (INR ₹)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Single Reel (₹)</label>
                    <input
                      type="number"
                      value={newInfData.reel}
                      onChange={e => setNewInfData({ ...newInfData, reel: Number(e.target.value) })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Collab Reel (₹)</label>
                    <input
                      type="number"
                      value={newInfData.collabReel}
                      onChange={e => setNewInfData({ ...newInfData, collabReel: Number(e.target.value) })}
                      className="w-full bg-tech-card border border-tech-border text-cyan-400 p-2 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Store Visit (₹)</label>
                    <input
                      type="number"
                      value={newInfData.storeVisitReel}
                      onChange={e => setNewInfData({ ...newInfData, storeVisitReel: Number(e.target.value) })}
                      className="w-full bg-tech-card border border-tech-border text-indigo-400 p-2 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Banking & Tax Details */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-amber-400 uppercase text-[10px] tracking-wider">4. Bank & Tax Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Account holder name"
                      value={newInfData.accountName}
                      onChange={e => setNewInfData({ ...newInfData, accountName: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={newInfData.bankName}
                      onChange={e => setNewInfData({ ...newInfData, bankName: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account number"
                      value={newInfData.accountNumber}
                      onChange={e => setNewInfData({ ...newInfData, accountNumber: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="IFSC"
                      value={newInfData.ifsc}
                      onChange={e => setNewInfData({ ...newInfData, ifsc: e.target.value.toUpperCase() })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={newInfData.pan}
                      onChange={e => setNewInfData({ ...newInfData, pan: e.target.value.toUpperCase() })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Billing Address</label>
                    <input
                      type="text"
                      placeholder="Street, City, State, PIN"
                      value={newInfData.address}
                      onChange={e => setNewInfData({ ...newInfData, address: e.target.value })}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-tech-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  Create Influencer Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
