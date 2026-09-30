import React, { useState } from 'react';
import { db } from '../../services/db';
import { Influencer } from '../../types';
import { Users, Edit3, DollarSign, CreditCard, Sparkles, MapPin, Mail, Phone, FileText, Check } from 'lucide-react';
import { ImageCropModal } from '../common/ImageCropModal';

export const InfluencersView: React.FC = () => {
  const influencers = db.getInfluencers();
  const [selectedInf, setSelectedInf] = useState<Influencer>(influencers[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Influencer>(influencers[0]);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

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
    alert('Influencer profile updated successfully!');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Centralized Technology Influencer Profiles
          </h2>
          <p className="text-xs text-slate-400">
            Single source of truth for creator profiles, rate cards, bank details, PAN & Media Kits.
          </p>
        </div>
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
                selectedInf.id === inf.id
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
        <div className="md:col-span-3 bg-tech-card border border-tech-border rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-tech-border pb-4">
            <div className="flex items-center space-x-4">
              <img
                src={selectedInf.avatarUrl}
                alt={selectedInf.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-100">{selectedInf.name}</h3>
                <p className="text-xs text-cyan-400 font-mono">{selectedInf.handle}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-500" /> {selectedInf.city}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 bg-tech-border hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile & Rates'}</span>
            </button>
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
                    Address: {selectedInf.address}
                  </p>
                </div>

                <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] text-slate-500">
                    Contact & Authentication Credentials
                  </h4>
                  <p className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" /> {selectedInf.email}
                  </p>
                  <p className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" /> {selectedInf.phone}
                  </p>
                  <p className="flex items-center gap-2 text-slate-300 font-mono">
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> PAN: {selectedInf.pan}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono pt-2 border-t border-tech-border">
                    Login ID: <strong className="text-slate-200">{selectedInf.username}</strong> | Password: <strong className="text-slate-200">{selectedInf.password}</strong>
                  </p>
                </div>
              </div>

              {/* Fixed Bank & Invoice Details */}
              <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Fixed Invoice & Banking Details (Auto-filled on Invoices)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
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
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Official Commercial Rate Card
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
                    <span className="font-extrabold text-slate-100 font-mono">
                      ₹{selectedInf.rateCard.ugcVideo.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Editing Form */
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Profile Photo Upload / Replace Section */}
              <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Profile Photo Management (Device Upload & Cropping)
                </h4>
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <img
                    src={formData.avatarUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-lg shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="flex-1 space-y-2 w-full">
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upload & Position Photo From Device</span>
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Upload any image from your computer/device and interactively zoom, scale, and crop it to fit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bio / Profile Description</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={e => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Rate Card Inputs */}
              <div className="bg-[#0b0f17] p-3 rounded-xl border border-tech-border">
                <h4 className="font-bold text-slate-300 mb-2">Edit Rate Card Rates (₹)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px]">Reel</label>
                    <input
                      type="number"
                      value={formData.rateCard.reel}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          rateCard: { ...formData.rateCard, reel: Number(e.target.value) }
                        })
                      }
                      className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px]">Collab Reel</label>
                    <input
                      type="number"
                      value={formData.rateCard.collabReel}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          rateCard: { ...formData.rateCard, collabReel: Number(e.target.value) }
                        })
                      }
                      className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px]">Store Visit Reel</label>
                    <input
                      type="number"
                      value={formData.rateCard.storeVisitReel}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          rateCard: { ...formData.rateCard, storeVisitReel: Number(e.target.value) }
                        })
                      }
                      className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
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
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Profile Photo Crop & Upload Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        initialImageUrl={formData.avatarUrl}
        onSaveCrop={(croppedBase64) => {
          setFormData({ ...formData, avatarUrl: croppedBase64 });
        }}
      />
    </div>
  );
};
