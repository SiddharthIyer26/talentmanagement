import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Search, X, Briefcase, Building2, User, FileText, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (type: string, id: string) => void;
  onSelectCampaign?: (id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
  onSelectCampaign,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search logic handled in parent header
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const campaigns = db.getCampaigns().filter(
    c =>
      c.campaignName.toLowerCase().includes(q) ||
      c.brandName.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q)
  );

  const influencers = db.getInfluencers().filter(
    i => i.name.toLowerCase().includes(q) || i.handle.toLowerCase().includes(q)
  );

  const brands = db.getBrands().filter(
    b => b.name.toLowerCase().includes(q) || b.contactPerson.toLowerCase().includes(q)
  );

  const invoices = db.getInvoices().filter(
    inv =>
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
      (inv.serviceDescription && inv.serviceDescription.toLowerCase().includes(q)) ||
      (inv.clientName && inv.clientName.toLowerCase().includes(q))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-tech-card border border-tech-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="p-4 border-b border-tech-border flex items-center space-x-3 bg-[#0e1420]">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search campaigns, brands, influencers, invoices (e.g. GoBoult, JD Tech)..."
            className="w-full bg-transparent text-slate-100 text-sm font-medium focus:outline-none placeholder-slate-500"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {q === '' ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Type keywords to search across campaigns, brand CRM, creator profiles, and invoice records.
            </p>
          ) : (
            <>
              {/* Campaigns */}
              {campaigns.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> Campaigns ({campaigns.length})
                  </h4>
                  <div className="space-y-1.5">
                    {campaigns.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (onSelectCampaign) onSelectCampaign(c.id);
                          if (onSelectResult) onSelectResult('campaign', c.id);
                          onClose();
                        }}
                        className="p-2.5 bg-[#0b0f17] hover:bg-slate-800/80 rounded-lg cursor-pointer flex items-center justify-between border border-tech-border text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">{c.campaignName}</p>
                          <p className="text-[10px] text-slate-400">Brand: {c.brandName} • Status: {c.productionStatus}</p>
                        </div>
                        <span className="font-mono text-cyan-400 text-xs flex items-center gap-1">
                          ₹{c.dealAmount.toLocaleString('en-IN')} <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Influencers */}
              {influencers.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Influencers ({influencers.length})
                  </h4>
                  <div className="space-y-1.5">
                    {influencers.map(i => (
                      <div
                        key={i.id}
                        onClick={() => {
                          if (onSelectResult) onSelectResult('influencer', i.id);
                          onClose();
                        }}
                        className="p-2.5 bg-[#0b0f17] hover:bg-slate-800/80 rounded-lg cursor-pointer flex items-center justify-between border border-tech-border text-xs transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <img src={i.avatarUrl} alt={i.name} className="w-7 h-7 rounded-full object-cover" />
                          <div>
                            <p className="font-semibold text-slate-200">{i.name}</p>
                            <p className="text-[10px] text-cyan-400">{i.handle}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{i.city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Brands ({brands.length})
                  </h4>
                  <div className="space-y-1.5">
                    {brands.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          if (onSelectResult) onSelectResult('brand', b.id);
                          onClose();
                        }}
                        className="p-2.5 bg-[#0b0f17] hover:bg-slate-800/80 rounded-lg cursor-pointer flex items-center justify-between border border-tech-border text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">{b.name}</p>
                          <p className="text-[10px] text-slate-400">Contact: {b.contactPerson}</p>
                        </div>
                        <span className="text-[10px] text-cyan-400">{b.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {invoices.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> Invoices ({invoices.length})
                  </h4>
                  <div className="space-y-1.5">
                    {invoices.map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          if (onSelectResult) onSelectResult('invoice', inv.id);
                          onClose();
                        }}
                        className="p-2.5 bg-[#0b0f17] hover:bg-slate-800/80 rounded-lg cursor-pointer flex items-center justify-between border border-tech-border text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-200 font-mono">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-md">{inv.serviceDescription}</p>
                        </div>
                        <span className="font-mono text-amber-400 font-bold">
                          ₹{(inv.finalAmount || inv.totalDue || inv.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campaigns.length === 0 && influencers.length === 0 && brands.length === 0 && invoices.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No matching records found for "{query}".</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
