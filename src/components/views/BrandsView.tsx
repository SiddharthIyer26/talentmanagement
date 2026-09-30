import React, { useState } from 'react';
import { db } from '../../services/db';
import { Brand } from '../../types';
import { Building2, Mail, Phone, DollarSign, Briefcase, Plus } from 'lucide-react';

export const BrandsView: React.FC = () => {
  const brands = db.getBrands();
  const campaigns = db.getCampaigns();
  const [selectedBrand, setSelectedBrand] = useState<Brand>(brands[0]);

  const brandCampaigns = campaigns.filter(c => c.brandId === selectedBrand.id);
  const totalSpent = brandCampaigns.reduce((acc, c) => acc + c.dealAmount, 0);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-cyan-400" /> Sponsoring Brand CRM Database
        </h2>
        <p className="text-xs text-slate-400">
          Central directory of advertising partners, contact leads, spent volume & deal history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Brand List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Brand Directory</h3>
          {brands.map(b => {
            const camps = campaigns.filter(c => c.brandId === b.id);
            const spent = camps.reduce((acc, c) => acc + c.dealAmount, 0);

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBrand(b)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedBrand.id === b.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 border-cyan-500/50'
                    : 'bg-tech-card border-tech-border hover:border-slate-600'
                }`}
              >
                <h4 className="font-bold text-slate-200 text-xs">{b.name}</h4>
                <p className="text-[10px] text-slate-400 truncate">{b.contactPerson}</p>
                <div className="mt-2 text-[10px] text-cyan-400 font-mono flex justify-between border-t border-tech-border pt-1">
                  <span>{camps.length} Deals</span>
                  <span>₹{(spent/1000).toFixed(0)}k Spent</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Brand CRM Hub */}
        <div className="md:col-span-3 bg-tech-card border border-tech-border rounded-2xl p-6 space-y-6">
          <div className="border-b border-tech-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">{selectedBrand.name}</h3>
              <p className="text-xs text-slate-400">Lead Contact: <strong className="text-cyan-400">{selectedBrand.contactPerson}</strong></p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Lifetime Collaboration Volume</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                ₹{totalSpent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0b0f17] border border-tech-border p-3 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Email</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" /> {selectedBrand.email}
              </span>
            </div>
            <div className="bg-[#0b0f17] border border-tech-border p-3 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Phone</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" /> {selectedBrand.phone}
              </span>
            </div>
          </div>

          {selectedBrand.notes && (
            <div className="bg-[#0b0f17] border border-tech-border p-3 rounded-xl text-xs">
              <span className="text-slate-500 text-[10px] block uppercase font-bold mb-1">Brand Strategy & Notes</span>
              <p className="text-slate-300">{selectedBrand.notes}</p>
            </div>
          )}

          {/* History */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Brand Collaboration History ({brandCampaigns.length})
            </h4>
            <div className="space-y-2 text-xs">
              {brandCampaigns.map(c => (
                <div key={c.id} className="p-3 bg-[#0b0f17] border border-tech-border rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-200">{c.campaignName}</h5>
                    <p className="text-[10px] text-slate-400">Locked: {c.dealLockedDate} • Status: {c.productionStatus}</p>
                  </div>
                  <span className="font-mono font-bold text-cyan-400">₹{c.dealAmount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
