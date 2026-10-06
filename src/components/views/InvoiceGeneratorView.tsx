import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { pdfService } from '../../services/pdfService';
import { FileText, Download, Sparkles, Check, ArrowLeft, Save } from 'lucide-react';
import { Invoice } from '../../types';

interface InvoiceGeneratorViewProps {
  initialCampaignId?: string;
  initialInvoiceId?: string;
  onNavigateToInvoices?: () => void;
}

export const InvoiceGeneratorView: React.FC<InvoiceGeneratorViewProps> = ({
  initialCampaignId,
  initialInvoiceId,
  onNavigateToInvoices
}) => {
  const influencers = db.getInfluencers();
  const campaigns = db.getCampaigns();

  // If loading existing invoice
  const existingInvoice = initialInvoiceId ? db.getInvoiceById(initialInvoiceId) : undefined;

  const defaultCampaign = initialCampaignId
    ? db.getCampaignById(initialCampaignId)
    : existingInvoice?.campaignId
    ? db.getCampaignById(existingInvoice.campaignId)
    : campaigns[0];

  const [selectedInfluencerId, setSelectedInfluencerId] = useState(
    existingInvoice?.influencerId || defaultCampaign?.influencerId || influencers[0]?.id || ''
  );

  const [selectedCampaignId, setSelectedCampaignId] = useState(
    existingInvoice?.campaignId || defaultCampaign?.id || ''
  );

  const selectedInfluencer = db.getInfluencerById(selectedInfluencerId) || influencers[0];
  const selectedCampaign = db.getCampaignById(selectedCampaignId) || defaultCampaign;

  // Invoice Number: if existing invoice use its number, else generate sequential format [Prefix]-[Year]-[0001]
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    if (existingInvoice) return existingInvoice.invoiceNumber;
    return db.getNextInvoiceNumber(selectedInfluencerId);
  });

  const [invoiceDateText, setInvoiceDateText] = useState(
    existingInvoice?.invoiceDate || '21st August 2026'
  );
  const [dueDateText, setDueDateText] = useState(
    existingInvoice?.dueDate || '20th September 2026'
  );

  // Influencer / Creator Details
  const [influencerName, setInfluencerName] = useState(
    existingInvoice?.influencerName || selectedInfluencer?.bankDetails.accountName || selectedInfluencer?.name || 'Jnanadeepu J S'
  );
  const [influencerAddress, setInfluencerAddress] = useState(
    selectedInfluencer?.address || 'Kyatsandra CM Extension\n1st Main Road 6th Cross\nTumkur Karnataka 572104'
  );

  // Client / Invoice To Details
  const [clientName, setClientName] = useState(
    existingInvoice?.clientName || 'TORCHLIGHT BRAND CONSULTING LLP'
  );
  const [clientAddress, setClientAddress] = useState(
    existingInvoice?.clientAddress || 'A-175, First Floor, Shivalik,\nMalviya Nagar, New Delhi 110017'
  );
  const [clientGstin, setClientGstin] = useState(
    existingInvoice?.clientGstin || '07AAXFT2697PIZU'
  );

  // Line Item Details
  const [serviceDescription, setServiceDescription] = useState(
    existingInvoice?.serviceDescription || selectedCampaign?.campaignName || 'JD x Realme - Pai : 1 Store Visit Reel'
  );
  const [amount, setAmount] = useState<number>(
    existingInvoice?.amount || selectedCampaign?.dealAmount || 35000
  );
  const [quantity, setQuantity] = useState<number>(1);

  // TDS configuration
  const [tdsPercentage, setTdsPercentage] = useState<number>(existingInvoice?.tdsPercentage || 10);
  const [tdsAmount, setTdsAmount] = useState<number>(() => {
    if (existingInvoice?.tdsAmount !== undefined) return existingInvoice.tdsAmount;
    return Math.round(((selectedCampaign?.dealAmount || 35000) * 10) / 100);
  });
  const [paymentStatus, setPaymentStatus] = useState<'Draft' | 'Issued' | 'Paid' | 'Pending'>(
    existingInvoice?.paymentStatus || 'Issued'
  );

  // Bank & Contact Details
  const [bankAccountName, setBankAccountName] = useState(
    selectedInfluencer?.bankDetails.accountName || 'Jnanadeepu J S'
  );
  const [bankName, setBankName] = useState(
    selectedInfluencer?.bankDetails.bankName || 'Canara Bank'
  );
  const [accountNumber, setAccountNumber] = useState(
    selectedInfluencer?.bankDetails.accountNumber || '110040997151'
  );
  const [ifsc, setIfsc] = useState(selectedInfluencer?.bankDetails.ifsc || 'CNRB0005558');
  const [pan, setPan] = useState(
    selectedInfluencer?.bankDetails.pan || selectedInfluencer?.pan || 'CDQPJ0428Q'
  );
  const [contactPhone, setContactPhone] = useState(selectedInfluencer?.phone || '7899733779');
  const [contactEmail, setContactEmail] = useState(
    selectedInfluencer?.email || 'Jdtechhcontact@gmail.com'
  );

  // GST & Disclaimer configuration
  const [gstDisclaimerText, setGstDisclaimerText] = useState(
    'We Are Not GST Registered . No GST Is Charged On This Invoice'
  );

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto calculate TDS amount when amount or tdsPercentage changes
  const handleTdsPercentageChange = (pct: number) => {
    setTdsPercentage(pct);
    setTdsAmount(Math.round(((amount * quantity) * pct) / 100));
  };

  const handleAmountChange = (newAmt: number) => {
    setAmount(newAmt);
    setTdsAmount(Math.round(((newAmt * quantity) * tdsPercentage) / 100));
  };

  const handleInfluencerChange = (infId: string) => {
    setSelectedInfluencerId(infId);
    // If not editing an existing invoice, generate sequential number for the newly selected influencer
    if (!existingInvoice) {
      setInvoiceNumber(db.getNextInvoiceNumber(infId));
    }
    const inf = db.getInfluencerById(infId);
    if (inf) {
      setInfluencerName(inf.bankDetails.accountName || inf.name);
      setInfluencerAddress(inf.address);
      setBankAccountName(inf.bankDetails.accountName || inf.name);
      setBankName(inf.bankDetails.bankName);
      setAccountNumber(inf.bankDetails.accountNumber);
      setIfsc(inf.bankDetails.ifsc);
      setPan(inf.bankDetails.pan || inf.pan);
      setContactPhone(inf.phone);
      setContactEmail(inf.email);
    }
    const infCamps = campaigns.filter(c => c.influencerId === infId);
    if (infCamps.length > 0) {
      setSelectedCampaignId(infCamps[0].id);
      setServiceDescription(infCamps[0].campaignName);
      setAmount(infCamps[0].dealAmount);
      setTdsAmount(Math.round((infCamps[0].dealAmount * tdsPercentage) / 100));
      setClientName(infCamps[0].brandName.toUpperCase());
    }
  };

  const handleCampaignChange = (campId: string) => {
    setSelectedCampaignId(campId);
    const c = db.getCampaignById(campId);
    if (c) {
      setServiceDescription(c.campaignName);
      setAmount(c.dealAmount);
      setTdsAmount(Math.round((c.dealAmount * tdsPercentage) / 100));
      setClientName(c.brandName.toUpperCase());
    }
  };

  const saveInvoiceRecord = () => {
    const totalGross = amount * quantity;
    const finalAmount = totalGross - tdsAmount;

    const invoiceData: Invoice = {
      id: existingInvoice?.id || `inv-${Date.now()}`,
      invoiceNumber,
      influencerId: selectedInfluencerId,
      influencerName,
      clientName,
      clientAddress,
      clientGstin,
      campaignId: selectedCampaignId,
      campaignName: serviceDescription,
      serviceDescription,
      invoiceDate: invoiceDateText,
      dueDate: dueDateText,
      amount: totalGross,
      tdsAmount,
      tdsPercentage,
      finalAmount,
      paymentStatus,
      generatedDate: existingInvoice?.generatedDate || new Date().toISOString()
    };

    db.saveInvoice(invoiceData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadPDF = async () => {
    saveInvoiceRecord();
    const fullInvoiceTo = `${clientName}\n${clientAddress}\nGSTIN - ${clientGstin}`;
    db.generateInvoice(selectedCampaignId, invoiceDateText, fullInvoiceTo, serviceDescription);
    await pdfService.exportInvoice(invoiceNumber);
  };

  const netPayable = (amount * quantity) - tdsAmount;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onNavigateToInvoices && (
              <button
                onClick={onNavigateToInvoices}
                className="text-slate-400 hover:text-cyan-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Back to Invoices"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Commercial Invoice Generator
            </h2>
          </div>
          <p className="text-xs text-slate-400 ml-7">
            Sequential auto-numbering per creator (<span className="text-cyan-400 font-mono">[Prefix]-[Year]-[0001]</span>).
            {existingInvoice && (
              <span className="text-amber-400 font-medium ml-1">
                Editing existing invoice #{existingInvoice.invoiceNumber}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveInvoiceRecord}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-tech-border active:scale-95 transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-cyan-400" />
                <span>Save Record</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Save & Export PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form Controls */}
        <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Dynamic Invoice Controls
          </h3>

          <div>
            <label className="block text-slate-400 mb-1">Select Technology Influencer *</label>
            <select
              value={selectedInfluencerId}
              onChange={e => handleInfluencerChange(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
            >
              {influencers.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.invoicePrefix || 'INF'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Select Campaign *</label>
            <select
              value={selectedCampaignId}
              onChange={e => handleCampaignChange(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
            >
              {campaigns
                .filter(c => c.influencerId === selectedInfluencerId)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.campaignName} (₹{c.dealAmount.toLocaleString('en-IN')})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Invoice No (Auto)</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full bg-[#0b0f17] border border-cyan-500/50 text-cyan-400 font-bold rounded p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Date</label>
              <input
                type="text"
                value={invoiceDateText}
                onChange={e => setInvoiceDateText(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
                placeholder="21st August 2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Due Date</label>
              <input
                type="text"
                value={dueDateText}
                onChange={e => setDueDateText(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
                placeholder="20th September 2026"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Invoice Status</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as any)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              >
                <option value="Draft">Draft</option>
                <option value="Issued">Issued</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="border-t border-tech-border pt-3 space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">Influencer Information</h4>
            <div>
              <label className="block text-slate-400 mb-1">Influencer Name</label>
              <input
                type="text"
                value={influencerName}
                onChange={e => setInfluencerName(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Influencer Address</label>
              <textarea
                rows={2}
                value={influencerAddress}
                onChange={e => setInfluencerAddress(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
          </div>

          <div className="border-t border-tech-border pt-3 space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">Invoice To (Client Information)</h4>
            <div>
              <label className="block text-slate-400 mb-1">Client Company Name</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Client Address</label>
              <textarea
                rows={2}
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">GSTIN</label>
              <input
                type="text"
                value={clientGstin}
                onChange={e => setClientGstin(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 font-mono"
              />
            </div>
          </div>

          <div className="border-t border-tech-border pt-3 space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">Service & Pricing</h4>
            <div>
              <label className="block text-slate-400 mb-1">Service Description</label>
              <textarea
                rows={2}
                value={serviceDescription}
                onChange={e => setServiceDescription(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => handleAmountChange(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-tech-border text-cyan-400 rounded p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 font-mono"
                />
              </div>
            </div>

            {/* TDS configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">TDS %</label>
                <input
                  type="number"
                  value={tdsPercentage}
                  onChange={e => handleTdsPercentageChange(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-tech-border text-amber-400 rounded p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">TDS Amount (₹)</label>
                <input
                  type="number"
                  value={tdsAmount}
                  onChange={e => setTdsAmount(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-tech-border text-amber-400 rounded p-2 font-mono font-bold"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#080b12] border border-tech-border flex justify-between items-center text-xs">
              <span className="text-slate-400">Net Receivable:</span>
              <span className="font-mono font-bold text-emerald-400">₹{netPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="border-t border-tech-border pt-3 space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">Payment Method & Banking</h4>
            <div>
              <label className="block text-slate-400 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={bankAccountName}
                onChange={e => setBankAccountName(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Account No</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={e => setIfsc(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Pan No</label>
              <input
                type="text"
                value={pan}
                onChange={e => setPan(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2 font-mono"
              />
            </div>
          </div>

          <div className="border-t border-tech-border pt-3 space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">Contact Info</h4>
            <div>
              <label className="block text-slate-400 mb-1">Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Email</label>
              <input
                type="text"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
              />
            </div>
          </div>

          <div className="border-t border-tech-border pt-3 space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">GST & Footer Disclaimer</h4>
            <div>
              <label className="block text-slate-400 mb-1">Bottom Footer Disclaimer</label>
              <textarea
                rows={2}
                value={gstDisclaimerText}
                onChange={e => setGstDisclaimerText(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-200 rounded p-2"
                placeholder="We Are Not GST Registered . No GST Is Charged On This Invoice"
              />
            </div>
          </div>
        </div>

        {/* Live Visual Invoice Document Preview (Digital Recreation of Reference Image) */}
        <div className="md:col-span-2 bg-[#05070a] border border-tech-border rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-x-auto">
          <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between">
            <span>Reference Design Canvas Preview (A4 Dimensions)</span>
            <span className="text-cyan-400 font-bold">Pixel-Matched Reference Template</span>
          </div>

          <div className="flex justify-center overflow-x-auto py-2">
            <div
              id={`invoice-preview-${invoiceNumber}`}
              className="bg-white text-black w-[794px] min-w-[794px] min-h-[1123px] h-auto p-10 font-sans shadow-2xl flex flex-col justify-between box-border relative overflow-hidden"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {/* Main Content Body */}
              <div className="space-y-6">
                {/* 1. Header: Huge INVOICE title */}
                <div>
                  <div className="text-right pb-1">
                    <h1 className="text-4xl font-extrabold tracking-widest text-black uppercase">
                      INVOICE
                    </h1>
                  </div>
                </div>

                {/* 2. Metadata line */}
                <div className="space-y-0.5 pt-1">
                  <p className="text-xs text-black">
                    Invoice No : <span className="font-medium">{invoiceNumber}</span>
                  </p>
                  <p className="text-xs text-black">
                    Date : <span className="font-medium">{invoiceDateText}</span>
                  </p>
                  <div className="border-b border-black w-full pt-2" />
                </div>

                {/* 3. Details Row: Influencer Details on Left, Invoice to on Right */}
                <div className="grid grid-cols-2 gap-8 pt-1">
                  {/* Left Column */}
                  <div className="space-y-1">
                    <p className="text-xs text-black font-normal">Influencer Details:</p>
                    <h2 className="text-base font-extrabold text-black tracking-tight">
                      {influencerName}
                    </h2>
                    <div className="text-xs text-black leading-snug whitespace-pre-line">
                      {influencerAddress}
                    </div>

                    <div className="pt-2">
                      <p className="text-xs font-bold text-black">Total Due</p>
                      <p className="text-2xl font-extrabold text-black">
                        ₹{amount.toLocaleString('en-IN')}/-
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="text-right space-y-1">
                    <p className="text-xs text-black font-normal">Invoice to :</p>
                    <h2 className="text-base font-extrabold text-black uppercase tracking-tight">
                      {clientName}
                    </h2>
                    <div className="text-xs text-black leading-snug whitespace-pre-line">
                      {clientAddress}
                    </div>
                    {clientGstin && (
                      <p className="text-xs text-black font-normal mt-2">
                        GSTIN – {clientGstin}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Line Items Table */}
                <div className="pt-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-t-2 border-b-2 border-black text-xs font-bold text-black uppercase">
                        <th className="py-2 px-1 text-left w-1/2">SERVICE</th>
                        <th className="py-2 px-1 text-center">PRICE</th>
                        <th className="py-2 px-1 text-center">QTY</th>
                        <th className="py-2 px-1 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b-2 border-black text-xs text-black font-medium">
                        <td className="py-3 px-1 text-left">{serviceDescription}</td>
                        <td className="py-3 px-1 text-center">
                          ₹{amount.toLocaleString('en-IN')}/-
                        </td>
                        <td className="py-3 px-1 text-center">{quantity}</td>
                        <td className="py-3 px-1 text-right font-semibold">
                          ₹{(amount * quantity).toLocaleString('en-IN')}/-
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Subtotal Summary */}
                <div className="text-right pt-1">
                  <p className="text-sm font-extrabold text-black">
                    Total : ₹{(amount * quantity).toLocaleString('en-IN')}/-
                  </p>
                </div>

                {/* 6. Payment Method Section */}
                <div className="pt-2 space-y-0.5 text-xs text-black">
                  <p className="font-bold text-black mb-1">Payment Method :</p>
                  <p>Account Holder Name: {bankAccountName}</p>
                  <p>Bank Name: {bankName}</p>
                  <p>Account No : {accountNumber}</p>
                  <p>IFSC : {ifsc}</p>
                  <p>Pan No : {pan}</p>
                </div>

                {/* 7. Thank You Note */}
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-black">
                    Thank You For Working With Us!
                  </h3>
                </div>

                {/* 8. Contact Us Section */}
                <div className="pt-2 space-y-0.5 text-xs text-black">
                  <p className="font-bold text-black">Contact Us</p>
                  <p>{contactPhone}</p>
                  <p>{contactEmail}</p>
                </div>
              </div>

              {/* 9. Configurable GST / Non-GST Centered Footer */}
              <div className="pt-8 text-center text-[10px] text-black font-medium">
                {gstDisclaimerText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
