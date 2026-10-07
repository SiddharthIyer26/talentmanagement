import React, { useState } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
import { ProductionStatus, TalentType } from '../../types';
import { Plus, X, Sparkles, Calendar, IndianRupee, Briefcase, Percent, UserCheck, UserPlus, Info } from 'lucide-react';

interface QuickAddCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCampaignId: string) => void;
}

export const QuickAddCampaignModal: React.FC<QuickAddCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const influencers = db.getInfluencers();
  const brands = db.getBrands();
  const activeInfluencer = authService.getActiveInfluencer();

  // Talent Type: Exclusive vs Non-Exclusive
  const [talentType, setTalentType] = useState<TalentType>('exclusive');
  const [influencerId, setInfluencerId] = useState(activeInfluencer?.id || influencers[0]?.id || '');
  
  // Non-exclusive talent fields
  const [nonExclusiveName, setNonExclusiveName] = useState('');
  const [nonExclusiveHandle, setNonExclusiveHandle] = useState('');
  const [nonExclusiveContact, setNonExclusiveContact] = useState('');

  const [brandId, setBrandId] = useState(brands[0]?.id || '');
  const [newBrandName, setNewBrandName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  
  // Financial fields
  const [lockedCommercial, setLockedCommercial] = useState<number>(100000);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(10);
  const [commissionEarned, setCommissionEarned] = useState<number>(10000);
  const [tdsPercentage, setTdsPercentage] = useState<number>(10);
  const [tdsDeductedAmount, setTdsDeductedAmount] = useState<number>(10000);

  const [dealLockedDate, setDealLockedDate] = useState(new Date().toISOString().split('T')[0]);
  const [liveDate, setLiveDate] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [productionStatus, setProductionStatus] = useState<ProductionStatus>('Locked');
  const [deliverablesText, setDeliverablesText] = useState('1x Collab Reel\n2x Instagram Stories');

  if (!isOpen) return null;

  // Auto calculate commission and TDS when commercial changes
  const handleCommercialChange = (val: number) => {
    setLockedCommercial(val);
    setCommissionEarned(Math.round((val * commissionPercentage) / 100));
    setTdsDeductedAmount(Math.round((val * tdsPercentage) / 100));
  };

  const handleCommissionPctChange = (pct: number) => {
    setCommissionPercentage(pct);
    setCommissionEarned(Math.round((lockedCommercial * pct) / 100));
  };

  const handleTdsPctChange = (pct: number) => {
    setTdsPercentage(pct);
    setTdsDeductedAmount(Math.round((lockedCommercial * pct) / 100));
  };

  // Auto calculate due date preview
  let calculatedDueDatePreview = 'Enter Live Date';
  if (liveDate && paymentTermsDays) {
    const d = new Date(liveDate);
    d.setDate(d.getDate() + Number(paymentTermsDays));
    calculatedDueDatePreview = d.toISOString().split('T')[0];
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (talentType === 'non_exclusive') {
      if (!nonExclusiveName.trim()) {
        alert('Please enter the Non-Exclusive Influencer Name.');
        return;
      }
      if (!nonExclusiveHandle.trim()) {
        alert('Please enter the Instagram / Social Handle.');
        return;
      }
    }

    const selectedBrand = brands.find(b => b.id === brandId);
    const finalBrandName = brandId === 'NEW' ? newBrandName : selectedBrand?.name || 'Brand';

    const deliverablesList = deliverablesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((title, idx) => ({
        id: 'd-' + idx + '-' + Date.now(),
        title,
        completed: false
      }));

    const selectedInf = influencers.find(i => i.id === influencerId);
    const talentDisplayName = talentType === 'exclusive'
      ? (selectedInf?.name || 'Influencer')
      : nonExclusiveName.trim();

    const generatedTitle = campaignName || `${talentDisplayName} × ${finalBrandName}`;

    try {
      const newCampaign = await db.saveCampaign({
        talentType,
        influencerId: talentType === 'exclusive' ? influencerId : 'non-exclusive',
        nonExclusiveTalent: talentType === 'non_exclusive' ? {
          name: nonExclusiveName.trim(),
          handle: nonExclusiveHandle.trim().startsWith('@') ? nonExclusiveHandle.trim() : `@${nonExclusiveHandle.trim()}`,
          email: nonExclusiveContact.trim() || undefined
        } : undefined,
        brandId: brandId === 'NEW' ? 'brand-' + Date.now() : brandId,
        brandName: finalBrandName,
        campaignName: generatedTitle,
        dealAmount: Number(lockedCommercial),
        lockedCommercial: Number(lockedCommercial),
        receivedCommercial: 0,
        tdsDeductedAmount: Number(tdsDeductedAmount),
        tdsDeductedPercentage: Number(tdsPercentage),
        commissionEarned: Number(commissionEarned),
        commissionPercentage: Number(commissionPercentage),
        dealLockedDate,
        liveDate: liveDate || undefined,
        paymentTermsDays: Number(paymentTermsDays),
        productionStatus,
        paymentStatus: 'Pending',
        deliverables: deliverablesList
      });

      onSuccess(newCampaign.id);
      onClose();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      alert(`Error creating collaboration in database: ${err?.message || 'Database write rejected'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-tech-card border border-tech-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="p-4 border-b border-tech-border flex items-center justify-between bg-[#0e1420]">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> + Add New Brand Collaboration
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Talent Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">Talent Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTalentType('exclusive')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  talentType === 'exclusive'
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0b0f17] border-tech-border text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${talentType === 'exclusive' ? 'bg-cyan-400 text-black' : 'bg-slate-800 text-slate-400'}`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-xs">Exclusive Talent</span>
                  <span className="text-[10px] text-slate-400 block">From Exclusive Roster</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTalentType('non_exclusive')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  talentType === 'non_exclusive'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-[#0b0f17] border-tech-border text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${talentType === 'non_exclusive' ? 'bg-amber-400 text-black' : 'bg-slate-800 text-slate-400'}`}>
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-xs">Non-Exclusive Talent</span>
                  <span className="text-[10px] text-slate-400 block">External / One-Off</span>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Talent Input */}
          {talentType === 'exclusive' ? (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select from Exclusive Roster *</label>
              <select
                value={influencerId}
                onChange={e => setInfluencerId(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-cyan-400 focus:outline-none"
                required
              >
                {influencers.map(inf => (
                  <option key={inf.id} value={inf.id}>
                    {inf.name} ({inf.handle})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-[#0b0f17] border border-amber-500/30 rounded-xl p-3.5 space-y-3">
              <div className="flex items-start gap-2 text-amber-400/90 text-[11px] pb-2 border-b border-amber-500/20">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>Non-Exclusive Talent: This creator is not added to the Exclusive Influencer Roster. Details are saved securely with this collaboration only.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Influencer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Aman Dhattarwal / Tech Burner"
                    value={nonExclusiveName}
                    onChange={e => setNonExclusiveName(e.target.value)}
                    className="w-full bg-tech-card border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none"
                    required={talentType === 'non_exclusive'}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Instagram / Social Handle *</label>
                  <input
                    type="text"
                    placeholder="e.g. @techburner"
                    value={nonExclusiveHandle}
                    onChange={e => setNonExclusiveHandle(e.target.value)}
                    className="w-full bg-tech-card border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none"
                    required={talentType === 'non_exclusive'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email / Contact Info</label>
                <input
                  type="text"
                  placeholder="e.g. creator@gmail.com / +91 98765 43210"
                  value={nonExclusiveContact}
                  onChange={e => setNonExclusiveContact(e.target.value)}
                  className="w-full bg-tech-card border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Select / Add Brand */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Sponsoring Brand *</label>
            <select
              value={brandId}
              onChange={e => setBrandId(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-cyan-400 focus:outline-none"
            >
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} (Contact: {b.contactPerson})
                </option>
              ))}
              <option value="NEW">+ Add New Brand Entity</option>
            </select>

            {brandId === 'NEW' && (
              <input
                type="text"
                placeholder="Enter Brand Name (e.g. Asus ROG, Keychron)"
                value={newBrandName}
                onChange={e => setNewBrandName(e.target.value)}
                className="mt-2 w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-cyan-400 focus:outline-none"
                required
              />
            )}
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campaign Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. JD Tech × GoBoult Mustang Earbuds Launch"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Commercial & Financials */}
          <div className="bg-[#080b12] border border-tech-border rounded-xl p-3.5 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-cyan-400" /> Commercials & Commission Terms
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Locked Commercial (₹) *</label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    value={lockedCommercial}
                    onChange={e => handleCommercialChange(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg pl-8 p-2.5 focus:border-cyan-400 focus:outline-none font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Terms *</label>
                <select
                  value={paymentTermsDays}
                  onChange={e => setPaymentTermsDays(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-cyan-400 focus:outline-none font-mono"
                >
                  <option value={15}>15 Days Post Live</option>
                  <option value={30}>30 Days Post Live (Standard)</option>
                  <option value={45}>45 Days Post Live (Corporate)</option>
                  <option value={60}>60 Days Post Live</option>
                </select>
              </div>
            </div>

            {/* Commission & TDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Commission %</label>
                <input
                  type="number"
                  value={commissionPercentage}
                  onChange={e => handleCommissionPctChange(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-tech-border text-indigo-400 rounded p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">My Commission (₹)</label>
                <input
                  type="number"
                  value={commissionEarned}
                  onChange={e => setCommissionEarned(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-indigo-500/50 text-indigo-400 rounded p-2 font-mono font-bold"
                  title="Calculated automatically or override manually"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">TDS %</label>
                <input
                  type="number"
                  value={tdsPercentage}
                  onChange={e => handleTdsPctChange(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-tech-border text-amber-400 rounded p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">TDS Amount (₹)</label>
                <input
                  type="number"
                  value={tdsDeductedAmount}
                  onChange={e => setTdsDeductedAmount(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-tech-border text-amber-400 rounded p-2 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Dates & Auto Calculated Due Date */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Deal Locked Date</label>
              <input
                type="date"
                value={dealLockedDate}
                onChange={e => setDealLockedDate(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Live Date</label>
              <input
                type="date"
                value={liveDate}
                onChange={e => setLiveDate(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-cyan-400 font-semibold mb-1">Auto Due Date</label>
              <div className="w-full bg-[#0b0f17] border border-cyan-500/30 text-cyan-400 rounded-lg p-2 font-mono font-bold text-center">
                {calculatedDueDatePreview}
              </div>
            </div>
          </div>

          {/* Initial Deliverables Checklist */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Deliverables Checklist (One per line)</label>
            <textarea
              rows={3}
              value={deliverablesText}
              onChange={e => setDeliverablesText(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-cyan-400 focus:outline-none font-sans"
              placeholder="e.g. 1x Collab Reel&#10;2x Instagram Story Slides"
            />
          </div>

          {/* Production Status */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Initial Production Stage</label>
            <select
              value={productionStatus}
              onChange={e => setProductionStatus(e.target.value as ProductionStatus)}
              className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2.5 focus:border-cyan-400 focus:outline-none"
            >
              <option value="Locked">1. Locked</option>
              <option value="Scripting Underway">2. Scripting Underway</option>
              <option value="Under Production">3. Under Production</option>
              <option value="Waiting for Approval">4. Waiting for Approval</option>
              <option value="Video Published">5. Video Published</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-tech-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/20"
            >
              Save Collaboration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
