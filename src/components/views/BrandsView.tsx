import React, { useState } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
import { Brand } from '../../types';
import {
  Building2,
  Mail,
  Phone,
  IndianRupee,
  Briefcase,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Search,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const BrandsView: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>(db.getBrands());
  const [campaigns, setCampaigns] = useState(db.getCampaigns());
  const [selectedBrand, setSelectedBrand] = useState<Brand>(brands[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin check
  const isAdmin = authService.isAdmin();

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    contactPerson: '',
    brandManager: '',
    email: '',
    phone: '',
    notes: ''
  });

  const refreshData = () => {
    const updatedBrands = db.getBrands();
    setBrands(updatedBrands);
    setCampaigns(db.getCampaigns());
    if (selectedBrand) {
      const stillExists = updatedBrands.find(b => b.id === selectedBrand.id);
      setSelectedBrand(stillExists || updatedBrands[0] || null);
    } else {
      setSelectedBrand(updatedBrands[0] || null);
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({
      name: '',
      contactPerson: '',
      brandManager: '',
      email: '',
      phone: '',
      notes: ''
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = () => {
    if (!selectedBrand) return;
    setIsEditMode(true);
    setFormData({
      ...selectedBrand,
      brandManager: selectedBrand.brandManager || selectedBrand.contactPerson
    });
    setIsAddEditOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const brandToSave: Brand = {
      id: isEditMode && selectedBrand ? selectedBrand.id : 'brand-' + Date.now(),
      name: formData.name.trim(),
      contactPerson: formData.contactPerson?.trim() || 'Contact Manager',
      brandManager: formData.brandManager?.trim() || formData.contactPerson?.trim() || '',
      email: formData.email?.trim() || '',
      phone: formData.phone?.trim() || '',
      notes: formData.notes?.trim() || ''
    };

    try {
      await db.saveBrand(brandToSave);
      refreshData();
      setSelectedBrand(brandToSave);
      setIsAddEditOpen(false);
    } catch (err: any) {
      alert(`Error saving brand: ${err?.message || 'Database write rejected'}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBrand) return;
    try {
      await db.deleteBrand(selectedBrand.id);
      setIsDeleteOpen(false);
      refreshData();
    } catch (err: any) {
      alert(`Error deleting brand: ${err?.message || 'Database delete rejected'}`);
    }
  };

  const filteredBrands = brands.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.contactPerson.toLowerCase().includes(q) ||
      (b.brandManager && b.brandManager.toLowerCase().includes(q)) ||
      b.email.toLowerCase().includes(q)
    );
  });

  const brandCampaigns = selectedBrand ? campaigns.filter(c => c.brandId === selectedBrand.id) : [];
  const totalSpent = brandCampaigns.reduce((acc, c) => acc + (c.lockedCommercial || c.dealAmount || 0), 0);
  const totalCommissionFromBrand = brandCampaigns.reduce((acc, c) => acc + (c.commissionEarned || 0), 0);

  return (
    <div className="space-y-6 pb-12 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" /> Sponsoring Brands CRM Directory
          </h2>
          <p className="text-slate-400">
            Central directory of advertising partners, brand managers, deal volume & collaboration history.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Brand Partner</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Brand List Column */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search brands or managers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border rounded-xl pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredBrands.length === 0 ? (
              <div className="p-4 text-center text-slate-500 bg-tech-card rounded-xl border border-tech-border">
                No brand partners match your search.
              </div>
            ) : (
              filteredBrands.map(b => {
                const camps = campaigns.filter(c => c.brandId === b.id);
                const spent = camps.reduce((acc, c) => acc + (c.lockedCommercial || c.dealAmount || 0), 0);
                const isSelected = selectedBrand?.id === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBrand(b)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 border-cyan-500/50 shadow-md'
                        : 'bg-tech-card border-tech-border hover:border-slate-600'
                    }`}
                  >
                    <h4 className="font-bold text-slate-200 text-xs truncate">{b.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      Lead: {b.brandManager || b.contactPerson}
                    </p>
                    <div className="mt-2 text-[10px] text-cyan-400 font-mono flex justify-between border-t border-tech-border pt-1">
                      <span>{camps.length} Deals</span>
                      <span>₹{(spent / 1000).toFixed(0)}k Volume</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Brand CRM Hub */}
        <div className="md:col-span-3">
          {selectedBrand ? (
            <div className="bg-tech-card border border-tech-border rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Brand Top Header with Admin Actions */}
              <div className="border-b border-tech-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    {selectedBrand.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lead Brand Manager: <strong className="text-cyan-400">{selectedBrand.brandManager || selectedBrand.contactPerson}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={handleOpenEdit}
                        className="px-3 py-1.5 rounded-lg bg-tech-border hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit Brand</span>
                      </button>

                      <button
                        onClick={() => setIsDeleteOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">Lifetime Commercial Volume</span>
                  <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                    ₹{totalSpent.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">My Commission Earned</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    ₹{totalCommissionFromBrand.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">Total Brand Collaborations</span>
                  <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">
                    {brandCampaigns.length}
                  </span>
                </div>
              </div>

              {/* Contact Lead Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0b0f17] border border-tech-border p-3.5 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Official Email</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    {selectedBrand.email || 'No email registered'}
                  </span>
                </div>

                <div className="bg-[#0b0f17] border border-tech-border p-3.5 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Contact Phone</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    {selectedBrand.phone || 'No phone registered'}
                  </span>
                </div>
              </div>

              {selectedBrand.notes && (
                <div className="bg-[#0b0f17] border border-tech-border p-4 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    Brand Strategy, Terms & Brief Notes
                  </span>
                  <p className="text-slate-300 leading-relaxed">{selectedBrand.notes}</p>
                </div>
              )}

              {/* Collaboration Deal History */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Brand Collaboration History ({brandCampaigns.length})
                </h4>

                <div className="space-y-2">
                  {brandCampaigns.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 bg-[#0b0f17] rounded-xl border border-tech-border">
                      No collaborations recorded with this brand yet.
                    </div>
                  ) : (
                    brandCampaigns.map(c => {
                      const inf = db.getInfluencerById(c.influencerId);
                      return (
                        <div
                          key={c.id}
                          className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <h5 className="font-bold text-slate-200">{c.campaignName}</h5>
                            <p className="text-[10px] text-slate-400">
                              Creator: <strong className="text-cyan-400">{inf?.name}</strong> • Locked: {c.dealLockedDate} • Status: {c.productionStatus}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-200 block">
                              ₹{(c.lockedCommercial || c.dealAmount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400">
                              Comm: ₹{(c.commissionEarned || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-tech-card rounded-2xl border border-tech-border">
              Select a brand partner from the directory to view CRM details.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Brand Modal (Admin only) */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-tech-card border border-tech-border rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-tech-border pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                {isEditMode ? 'Edit Brand Partner' : 'Add New Sponsoring Brand'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samsung India, ASUS ROG, Keychron"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Brand Manager / Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Saurabh Malhotra"
                    value={formData.contactPerson || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contactPerson: e.target.value,
                      brandManager: e.target.value
                    })}
                    className="w-full bg-[#0b0f17] border border-tech-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-tech-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="marketing@brand.com"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Strategy & Collaboration Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. 45-day payment cycle, prefers high-energy tech reels..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-tech-border">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg shadow-lg shadow-cyan-500/20"
                >
                  {isEditMode ? 'Update Brand' : 'Save Brand Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog (Admin only) */}
      {isDeleteOpen && selectedBrand && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-tech-card border border-red-500/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-sm">Delete Brand Confirmation</h3>
            </div>

            <p className="text-slate-300">
              Are you sure you want to permanently delete <strong className="text-white">{selectedBrand.name}</strong> from the CRM directory?
            </p>

            {brandCampaigns.length > 0 && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-1">
                <span className="font-bold text-red-300 block">Existing Collaborations Notice:</span>
                <p className="text-[11px] text-red-200">
                  This brand has <strong className="underline">{brandCampaigns.length} existing collaborations</strong>. Deleting this brand record will unassign or affect those historical campaign records.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-600/30"
              >
                Yes, Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
