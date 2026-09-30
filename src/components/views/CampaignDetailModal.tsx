import React, { useState } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
import { Campaign, ProductionStatus, PaymentStatus } from '../../types';
import {
  X,
  Copy,
  CheckSquare,
  Square,
  ExternalLink,
  DollarSign,
  Clock,
  Sparkles,
  FileText,
  Activity,
  User,
  Building2,
  Calendar,
  MessageSquare,
  Save,
  Link as LinkIcon,
  Lock
} from 'lucide-react';

interface CampaignDetailModalProps {
  campaignId: string | null;
  onClose: () => void;
  onNavigateToInvoice: (campaignId: string) => void;
  onRefresh: () => void;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  campaignId,
  onClose,
  onNavigateToInvoice,
  onRefresh,
}) => {
  if (!campaignId) return null;

  const campaign = db.getCampaignById(campaignId);
  if (!campaign) return null;

  const influencer = db.getInfluencerById(campaign.influencerId);
  const brand = db.getBrandById(campaign.brandId);
  const isAdmin = authService.isAdmin();
  const isInfluencer = authService.isInfluencer();
  const activeInfluencer = authService.getActiveInfluencer();

  // Security Check: Influencer can ONLY access & edit their OWN collaborations
  if (isInfluencer && activeInfluencer && campaign.influencerId !== activeInfluencer.id) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-tech-card border border-red-500/50 rounded-2xl p-6 text-center space-y-3 max-w-md">
          <Lock className="w-8 h-8 text-red-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-100">Access Restricted</h3>
          <p className="text-xs text-slate-400">
            You do not have permission to view or edit collaboration details belonging to another creator.
          </p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  // State bindings for all editable fields
  const [brandName, setBrandName] = useState(campaign.brandName || '');
  const [campaignName, setCampaignName] = useState(campaign.campaignName || '');
  const [dealAmount, setDealAmount] = useState<number>(campaign.dealAmount || 0);
  const [productionStatus, setProductionStatus] = useState<ProductionStatus>(campaign.productionStatus || 'Locked');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(campaign.paymentStatus || 'Pending');

  // Payment Terms
  const [paymentTermsOption, setPaymentTermsOption] = useState<string>(
    ['100% Before Live', '50% on Script Approval + 50% Before Live', 'Within 7 Days After Live', 'Within 15 Days After Live', 'Within 30 Working Days'].includes(campaign.paymentTermsText || '')
      ? campaign.paymentTermsText!
      : (campaign.paymentTermsText ? 'Custom' : 'Within 30 Working Days')
  );
  const [customPaymentTerms, setCustomPaymentTerms] = useState<string>(
    ['100% Before Live', '50% on Script Approval + 50% Before Live', 'Within 7 Days After Live', 'Within 15 Days After Live', 'Within 30 Working Days'].includes(campaign.paymentTermsText || '')
      ? ''
      : (campaign.paymentTermsText || '')
  );

  // Payment ETA
  const [paymentEtaDate, setPaymentEtaDate] = useState(campaign.paymentEtaDate || '');
  const [paymentEtaNotes, setPaymentEtaNotes] = useState(campaign.paymentEtaNotes || '');

  // Post-Live & Payment Tracking
  const [contentLiveDate, setContentLiveDate] = useState(campaign.contentLiveDate || campaign.liveDate || '');
  const [invoiceSubmittedDate, setInvoiceSubmittedDate] = useState(campaign.invoiceSubmittedDate || '');
  const [paymentDueDate, setPaymentDueDate] = useState(campaign.paymentDueDate || campaign.calculatedDueDate || '');
  const [paymentReceivedDate, setPaymentReceivedDate] = useState(campaign.paymentReceivedDate || '');
  const [amountReceived, setAmountReceived] = useState<number>(campaign.amountReceived || (campaign.paymentStatus === 'Received' || campaign.paymentStatus === 'Paid' ? campaign.dealAmount : 0));
  const [paymentNotes, setPaymentNotes] = useState(campaign.paymentNotes || '');

  // Tracking Link
  const [trackingLink, setTrackingLink] = useState(campaign.trackingLink || campaign.liveLink || '');

  // Contact Info
  const [contactPerson, setContactPerson] = useState(campaign.contactPerson || brand?.contactPerson || '');
  const [contactNumber, setContactNumber] = useState(campaign.contactNumber || brand?.phone || '');
  const [contactEmail, setContactEmail] = useState(campaign.contactEmail || brand?.email || '');

  // Campaign Dates
  const [campaignStartDate, setCampaignStartDate] = useState(campaign.campaignStartDate || campaign.dealLockedDate || '');
  const [contentDeadline, setContentDeadline] = useState(campaign.contentDeadline || '');
  const [goLiveDate, setGoLiveDate] = useState(campaign.goLiveDate || campaign.liveDate || '');

  // Usage Rights & Notes
  const [usageRights, setUsageRights] = useState(campaign.usageRights || '');
  const [adRights, setAdRights] = useState(campaign.adRights || '');
  const [notes, setNotes] = useState(campaign.notes || '');
  const [internalNotes, setInternalNotes] = useState(campaign.internalNotes || '');

  // Deliverables Checklist
  const [deliverables, setDeliverables] = useState(campaign.deliverables || []);
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');

  // Performance metrics
  const [editMetrics, setEditMetrics] = useState(campaign.metrics || {
    views: 0,
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    reach: 0,
    interactions: 0
  });

  // Follow up state
  const [fuContactPerson, setFuContactPerson] = useState(brand?.contactPerson || '');
  const [fuNote, setFuNote] = useState('');
  const [fuNextDate, setFuNextDate] = useState('');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  // Status lists
  const statusOptions: ProductionStatus[] = [
    'Locked',
    'Scripting Underway',
    'Under Production',
    'Waiting for Approval',
    'Video Published',
    'Cancelled'
  ];

  const paymentStatusOptions: PaymentStatus[] = [
    'Payment Pending',
    'Advance Received',
    'Partially Paid',
    'Payment Processing',
    'Paid',
    'Overdue',
    'Pending',
    'Received'
  ];

  const paymentTermsPresets = [
    '100% Before Live',
    '50% on Script Approval + 50% Before Live',
    'Within 7 Days After Live',
    'Within 15 Days After Live',
    'Within 30 Working Days',
    'Custom'
  ];

  // Auto calculate pending amount
  const amountPending = Math.max(0, dealAmount - (amountReceived || 0));

  const handleToggleDeliverable = (id: string) => {
    const updated = deliverables.map(d => d.id === id ? { ...d, completed: !d.completed } : d);
    setDeliverables(updated);
  };

  const handleAddDeliverable = () => {
    if (!newDeliverableTitle.trim()) return;
    const newDel = {
      id: 'd-' + Date.now(),
      title: newDeliverableTitle.trim(),
      completed: false
    };
    setDeliverables([...deliverables, newDel]);
    setNewDeliverableTitle('');
  };

  const handleRemoveDeliverable = (id: string) => {
    setDeliverables(deliverables.filter(d => d.id !== id));
  };

  const handleSaveAll = () => {
    const finalTermsText = paymentTermsOption === 'Custom' ? customPaymentTerms : paymentTermsOption;

    const patch: Partial<Campaign> = {
      id: campaign.id,
      brandName,
      campaignName,
      dealAmount,
      productionStatus,
      paymentStatus,
      paymentTermsText: finalTermsText,
      paymentEtaDate,
      paymentEtaNotes,
      contentLiveDate,
      invoiceSubmittedDate,
      paymentDueDate,
      calculatedDueDate: paymentDueDate || campaign.calculatedDueDate,
      paymentReceivedDate,
      amountReceived,
      amountPending,
      paymentNotes,
      trackingLink,
      liveLink: trackingLink || campaign.liveLink,
      contactPerson,
      contactNumber,
      contactEmail,
      campaignStartDate,
      contentDeadline,
      goLiveDate,
      usageRights,
      adRights,
      notes,
      internalNotes,
      deliverables,
      metrics: editMetrics
    };

    db.saveCampaign(patch);
    alert('Collaboration Details saved successfully!');
    onRefresh();
  };

  const handleDuplicate = () => {
    const dup = db.duplicateCampaign(campaign.id);
    if (dup) {
      alert(`Campaign duplicated as "${dup.campaignName}"!`);
      onRefresh();
      onClose();
    }
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuNote) return;
    db.addFollowUp(campaign.id, fuContactPerson, fuNote, fuNextDate);
    setFuNote('');
    setShowFollowUpForm(false);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-tech-card border border-tech-border rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-150 text-xs">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0e1420] border-b border-tech-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{campaignName || campaign.campaignName}</h2>
              <p className="text-slate-400 text-[11px] flex items-center gap-2">
                <span>Influencer: <strong className="text-cyan-400">{influencer?.name}</strong></span>
                <span>•</span>
                <span>Brand: <strong className="text-indigo-400">{brandName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <>
                <button
                  onClick={handleSaveAll}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Details</span>
                </button>

                <button
                  onClick={handleDuplicate}
                  className="flex items-center space-x-1 px-3 py-2 bg-tech-border hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  title="Duplicate Campaign for repeat deal"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Duplicate</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateToInvoice(campaign.id);
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-xl text-xs font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Invoice</span>
                </button>
              </>
            ) : (
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-lg font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Read-Only View
              </span>
            )}

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Top Status Control Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-[#0b0f17] border border-tech-border rounded-xl p-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Collaboration Status *</label>
              {isAdmin ? (
                <select
                  value={productionStatus}
                  onChange={e => setProductionStatus(e.target.value as ProductionStatus)}
                  className="w-full bg-tech-card border border-tech-border text-cyan-300 font-bold rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
                >
                  {statusOptions.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-tech-card border border-tech-border text-cyan-300 font-bold rounded-lg p-2 flex items-center min-h-[38px]">
                  {productionStatus}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Payment Status *</label>
              {isAdmin ? (
                <select
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-tech-card border border-tech-border text-emerald-400 font-bold rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
                >
                  {paymentStatusOptions.map(pst => (
                    <option key={pst} value={pst}>
                      {pst}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-tech-card border border-tech-border text-emerald-400 font-bold rounded-lg p-2 flex items-center min-h-[38px]">
                  {paymentStatus}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Deal Commercial Amount (₹)</label>
              {isAdmin ? (
                <input
                  type="number"
                  value={dealAmount}
                  onChange={e => setDealAmount(Number(e.target.value))}
                  className="w-full bg-tech-card border border-tech-border text-slate-100 font-mono font-bold rounded-lg p-2"
                />
              ) : (
                <div className="w-full bg-tech-card border border-tech-border text-slate-100 font-mono font-bold rounded-lg p-2 flex items-center min-h-[38px]">
                  ₹{dealAmount.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: General Info, Deliverables, Tracking Link */}
            <div className="space-y-5">
              {/* General Info */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Collaboration Overview
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Brand Name</label>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={brandName}
                        onChange={e => setBrandName(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center font-bold">
                        {brandName || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Campaign Name</label>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={campaignName}
                        onChange={e => setCampaignName(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center font-bold">
                        {campaignName || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Person</label>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={e => setContactPerson(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center truncate">
                        {contactPerson || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Phone</label>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={contactNumber}
                        onChange={e => setContactNumber(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center truncate font-mono">
                        {contactNumber || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Email</label>
                    {isAdmin ? (
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center truncate font-mono">
                        {contactEmail || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 mb-1">Start Date</label>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={campaignStartDate}
                        onChange={e => setCampaignStartDate(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono min-h-[36px] flex items-center">
                        {campaignStartDate || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Content Deadline</label>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={contentDeadline}
                        onChange={e => setContentDeadline(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono min-h-[36px] flex items-center">
                        {contentDeadline || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Go-Live Date</label>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={goLiveDate}
                        onChange={e => setGoLiveDate(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono min-h-[36px] flex items-center">
                        {goLiveDate || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Redirect / Tracking Link */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5 text-cyan-400" /> Redirect / Tracking Link</span>
                  {trackingLink && (
                    <a
                      href={trackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-lg font-bold text-[11px] inline-flex items-center space-x-1"
                    >
                      <span>OPEN LINK</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </h3>

                <div>
                  <label className="block text-slate-400 mb-1">Tracking Link URL</label>
                  {isAdmin ? (
                    <input
                      type="url"
                      value={trackingLink}
                      onChange={e => setTrackingLink(e.target.value)}
                      placeholder="https://instagram.com/reel/... or tracking URL"
                      className="w-full bg-tech-card border border-tech-border text-cyan-300 rounded p-2 focus:border-cyan-400 focus:outline-none"
                    />
                  ) : (
                    <div className="w-full bg-tech-card border border-tech-border text-cyan-300 rounded p-2 font-mono min-h-[36px] flex items-center truncate">
                      {trackingLink || 'No tracking URL provided'}
                    </div>
                  )}
                </div>
              </div>

              {/* Deliverables Checklist */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Deliverables Checklist</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {deliverables.filter(d => d.completed).length} / {deliverables.length} Completed
                  </span>
                </h3>

                <div className="space-y-2">
                  {deliverables.map(del => (
                    <div
                      key={del.id}
                      className="p-2.5 bg-tech-card border border-tech-border rounded-lg flex items-center justify-between space-x-2"
                    >
                      <div
                        onClick={() => isAdmin && handleToggleDeliverable(del.id)}
                        className={`flex items-center space-x-2 flex-1 min-w-0 ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {del.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className={`truncate ${del.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {del.title}
                        </span>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveDeliverable(del.id)}
                          className="text-slate-500 hover:text-red-400 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-tech-border">
                    <input
                      type="text"
                      value={newDeliverableTitle}
                      onChange={e => setNewDeliverableTitle(e.target.value)}
                      placeholder="Add new deliverable item..."
                      className="flex-1 bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                    />
                    <button
                      onClick={handleAddDeliverable}
                      className="px-3 py-2 bg-tech-border hover:bg-slate-700 text-slate-200 font-bold rounded"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>

              {/* Usage Rights & Notes */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Rights & Notes</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Usage Rights</label>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={usageRights}
                        onChange={e => setUsageRights(e.target.value)}
                        placeholder="e.g. 30-Day Digital Ad Rights"
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center">
                        {usageRights || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Ad Rights</label>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={adRights}
                        onChange={e => setAdRights(e.target.value)}
                        placeholder="e.g. Organic + Paid Spark Ads"
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center">
                        {adRights || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Public Notes</label>
                  {isAdmin ? (
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                    />
                  ) : (
                    <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[48px]">
                      {notes || 'No public notes recorded.'}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-slate-400 mb-1">Internal Notes (Manager Only)</label>
                    <textarea
                      rows={2}
                      value={internalNotes}
                      onChange={e => setInternalNotes(e.target.value)}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Payment Terms, Payment ETA, Post-Live Tracking, Performance */}
            <div className="space-y-5">
              {/* Payment Terms & Payment ETA */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Payment Terms & Payment ETA
                </h3>

                <div>
                  <label className="block text-slate-400 mb-1">Payment Terms *</label>
                  {isAdmin ? (
                    <select
                      value={paymentTermsOption}
                      onChange={e => setPaymentTermsOption(e.target.value)}
                      className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 focus:border-cyan-400 focus:outline-none"
                    >
                      {paymentTermsPresets.map(term => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center">
                      {paymentTermsOption === 'Custom' ? customPaymentTerms : paymentTermsOption}
                    </div>
                  )}
                </div>

                {isAdmin && paymentTermsOption === 'Custom' && (
                  <div>
                    <label className="block text-slate-400 mb-1">Specify Custom Payment Terms</label>
                    <input
                      type="text"
                      value={customPaymentTerms}
                      onChange={e => setCustomPaymentTerms(e.target.value)}
                      placeholder="e.g. 30% Advance + 70% Post-Live"
                      className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-tech-border">
                  <div>
                    <label className="block text-slate-400 mb-1">Payment ETA / Expected Date</label>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={paymentEtaDate}
                        onChange={e => setPaymentEtaDate(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 font-mono rounded p-2 min-h-[36px] flex items-center">
                        {paymentEtaDate || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Payment ETA Notes</label>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={paymentEtaNotes}
                        onChange={e => setPaymentEtaNotes(e.target.value)}
                        placeholder="e.g. Approved by accounts department"
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[36px] flex items-center">
                        {paymentEtaNotes || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Post-Live & Payment Tracking */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Post-Live & Payment Tracking
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Content Live Date</label>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={contentLiveDate}
                        onChange={e => setContentLiveDate(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 font-mono rounded p-2 min-h-[36px] flex items-center">
                        {contentLiveDate || 'N/A'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Invoice Submitted Date</label>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={invoiceSubmittedDate}
                        onChange={e => setInvoiceSubmittedDate(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 font-mono rounded p-2 min-h-[36px] flex items-center">
                        {invoiceSubmittedDate || 'N/A'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Payment Due Date</label>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={paymentDueDate}
                        onChange={e => setPaymentDueDate(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 font-mono rounded p-2 min-h-[36px] flex items-center">
                        {paymentDueDate || 'N/A'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Payment Received Date</label>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={paymentReceivedDate}
                        onChange={e => setPaymentReceivedDate(e.target.value)}
                        className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-slate-200 font-mono rounded p-2 min-h-[36px] flex items-center">
                        {paymentReceivedDate || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-tech-border">
                  <div>
                    <label className="block text-slate-400 mb-1">Amount Received (₹)</label>
                    {isAdmin ? (
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={e => setAmountReceived(Number(e.target.value))}
                        className="w-full bg-tech-card border border-tech-border text-emerald-400 font-mono font-bold rounded p-2"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border text-emerald-400 font-mono font-bold rounded p-2 min-h-[36px] flex items-center">
                        ₹{(amountReceived || 0).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Amount Pending (Auto)</label>
                    <div className="w-full bg-[#070a0f] border border-tech-border text-amber-400 font-mono font-bold rounded p-2 min-h-[36px] flex items-center">
                      ₹{(amountPending || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Payment Notes</label>
                  {isAdmin ? (
                    <textarea
                      rows={2}
                      value={paymentNotes}
                      onChange={e => setPaymentNotes(e.target.value)}
                      placeholder="e.g. Received partial 50% advance, remainder scheduled post-live"
                      className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2"
                    />
                  ) : (
                    <div className="w-full bg-tech-card border border-tech-border text-slate-200 rounded p-2 min-h-[48px] flex items-center">
                      {paymentNotes || 'N/A'}
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Performance & Analytics</span>
                </h3>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">Views</label>
                    {isAdmin ? (
                      <input
                        type="number"
                        value={editMetrics.views}
                        onChange={e => setEditMetrics({ ...editMetrics, views: Number(e.target.value) })}
                        className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-cyan-400 font-mono font-bold"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-cyan-400 font-mono font-bold">
                        {(editMetrics.views || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Likes</label>
                    {isAdmin ? (
                      <input
                        type="number"
                        value={editMetrics.likes}
                        onChange={e => setEditMetrics({ ...editMetrics, likes: Number(e.target.value) })}
                        className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono font-bold">
                        {(editMetrics.likes || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Comments</label>
                    {isAdmin ? (
                      <input
                        type="number"
                        value={editMetrics.comments}
                        onChange={e => setEditMetrics({ ...editMetrics, comments: Number(e.target.value) })}
                        className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-slate-200 font-mono font-bold">
                        {(editMetrics.comments || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Interactions</label>
                    {isAdmin ? (
                      <input
                        type="number"
                        value={editMetrics.interactions}
                        onChange={e => setEditMetrics({ ...editMetrics, interactions: Number(e.target.value) })}
                        className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-indigo-400 font-mono font-bold"
                      />
                    ) : (
                      <div className="w-full bg-tech-card border border-tech-border rounded p-1.5 text-indigo-400 font-mono font-bold">
                        {(editMetrics.interactions || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Brand Follow-up Tracker (Admin Only) */}
              {isAdmin && (
                <div className="bg-[#0b0f17] border border-tech-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Brand Follow-up History
                    </h3>
                    <button
                      onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                      className="text-cyan-400 text-[11px] font-semibold hover:underline"
                    >
                      {showFollowUpForm ? 'Cancel' : '+ Log Follow-up'}
                    </button>
                  </div>

                  {showFollowUpForm && (
                    <form onSubmit={handleSaveFollowUp} className="space-y-2 mb-3 bg-tech-card p-3 rounded-lg border border-tech-border">
                      <input
                        type="text"
                        placeholder="Contact Person"
                        value={fuContactPerson}
                        onChange={e => setFuContactPerson(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-tech-border rounded p-1.5 text-slate-200"
                        required
                      />
                      <textarea
                        placeholder="What was discussed? (e.g. Sent invoice reminder, client approved payment)"
                        value={fuNote}
                        onChange={e => setFuNote(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-tech-border rounded p-1.5 text-slate-200"
                        rows={2}
                        required
                      />
                      <input
                        type="date"
                        placeholder="Next Follow-up Date"
                        value={fuNextDate}
                        onChange={e => setFuNextDate(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-tech-border rounded p-1.5 text-slate-200 font-mono"
                      />
                      <button
                        type="submit"
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-1.5 rounded"
                      >
                        Save Follow-up Record
                      </button>
                    </form>
                  )}

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {campaign.followUps.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No follow-ups recorded yet.</p>
                    ) : (
                      campaign.followUps.map(fu => (
                        <div key={fu.id} className="p-2 bg-tech-card rounded-lg border border-tech-border text-[11px]">
                          <div className="flex justify-between font-semibold text-slate-300">
                            <span>{fu.contactPerson}</span>
                            <span className="font-mono text-slate-500">{fu.date}</span>
                          </div>
                          <p className="text-slate-400 mt-1">{fu.note}</p>
                          {fu.nextFollowUpDate && (
                            <p className="text-cyan-400 text-[10px] mt-1 font-mono">
                              Next Follow-up: {fu.nextFollowUpDate}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-tech-border">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
            >
              Close
            </button>
            {isAdmin && (
              <button
                onClick={handleSaveAll}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20"
              >
                Save & Update Collaboration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
