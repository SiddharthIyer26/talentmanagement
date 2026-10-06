import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { pdfService } from '../../services/pdfService';
import { Invoice } from '../../types';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  RefreshCw,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  X,
  FileCheck
} from 'lucide-react';

interface InvoicesManagementViewProps {
  onNavigateToGenerator: (invoiceId?: string, campaignId?: string) => void;
}

export const InvoicesManagementView: React.FC<InvoicesManagementViewProps> = ({
  onNavigateToGenerator
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>(() => db.getInvoices());
  const influencers = db.getInfluencers();

  const [selectedInfluencer, setSelectedInfluencer] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview modal state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<Invoice | null>(null);

  // Dynamic months derived from invoices
  const dynamicMonths = useMemo(() => {
    const monthSet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.invoiceDate) {
        const d = new Date(inv.invoiceDate);
        if (!isNaN(d.getTime())) {
          const mLabel = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
          monthSet.add(mLabel);
        }
      }
    });
    return Array.from(monthSet);
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Influencer filter
      if (selectedInfluencer !== 'ALL' && inv.influencerId !== selectedInfluencer) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && inv.paymentStatus !== statusFilter) {
        return false;
      }

      // Month filter
      if (selectedMonth !== 'ALL') {
        const d = new Date(inv.invoiceDate);
        const mLabel = !isNaN(d.getTime())
          ? d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
          : '';
        if (mLabel !== selectedMonth) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchesInf = inv.influencerName?.toLowerCase().includes(q);
        const matchesClient = inv.clientName?.toLowerCase().includes(q);
        const matchesCamp = inv.campaignName?.toLowerCase().includes(q);
        if (!matchesNum && !matchesInf && !matchesClient && !matchesCamp) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, selectedInfluencer, selectedMonth, statusFilter, searchQuery]);

  // Invoice Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const now = new Date();
    const currentMonthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    let thisMonthCount = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;

    filteredInvoices.forEach(inv => {
      const invFinal = inv.finalAmount || (inv.amount - (inv.tdsAmount || 0));
      totalInvoiced += invFinal;

      const d = new Date(inv.invoiceDate);
      if (!isNaN(d.getTime()) && d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }) === currentMonthLabel) {
        thisMonthCount++;
      }

      if (inv.paymentStatus === 'Paid') {
        totalPaid += invFinal;
      } else {
        totalPending += invFinal;
      }
    });

    return {
      totalInvoices,
      thisMonthCount,
      totalInvoiced,
      totalPaid,
      totalPending
    };
  }, [filteredInvoices]);

  const handleStatusChange = (inv: Invoice, newStatus: 'Draft' | 'Issued' | 'Paid' | 'Pending') => {
    const updated = { ...inv, paymentStatus: newStatus };
    db.saveInvoice(updated);
    setInvoices(db.getInvoices());
  };

  const handleDelete = (inv: Invoice) => {
    db.deleteInvoice(inv.id);
    setInvoices(db.getInvoices());
    setDeleteConfirmInvoice(null);
  };

  const handleDownload = async (inv: Invoice) => {
    // If element is already rendered or we can export directly
    await pdfService.exportInvoice(inv.invoiceNumber);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" /> Invoices Management
          </h2>
          <p className="text-xs text-slate-400">
            Dedicated admin billing hub. Independent sequential numbering per influencer (<span className="text-cyan-400 font-mono">[Prefix]-[Year]-[0001]</span>).
          </p>
        </div>

        <button
          onClick={() => onNavigateToGenerator()}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-tech-card border border-tech-border rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Invoices
          </span>
          <div className="text-xl font-bold text-slate-100">{summaryMetrics.totalInvoices}</div>
          <span className="text-[10px] text-slate-500">Across matching filters</span>
        </div>

        <div className="bg-tech-card border border-tech-border rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            This Month
          </span>
          <div className="text-xl font-bold text-cyan-400">{summaryMetrics.thisMonthCount}</div>
          <span className="text-[10px] text-slate-500">Invoices issued</span>
        </div>

        <div className="bg-tech-card border border-tech-border rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Invoiced
          </span>
          <div className="text-xl font-bold text-slate-100 font-mono">
            ₹{summaryMetrics.totalInvoiced.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500">Net receivable value</span>
        </div>

        <div className="bg-tech-card border border-tech-border rounded-xl p-4">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </span>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            ₹{summaryMetrics.totalPaid.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500">Cleared payments</span>
        </div>

        <div className="bg-tech-card border border-tech-border rounded-xl p-4 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
          <div className="text-xl font-bold text-amber-400 font-mono">
            ₹{summaryMetrics.totalPending.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500">Awaiting brand clearance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-tech-card border border-tech-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice #, influencer, brand..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0b0f17] border border-tech-border rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Influencer Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedInfluencer}
              onChange={e => setSelectedInfluencer(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Influencers ({influencers.length})</option>
              {influencers.map(inf => (
                <option key={inf.id} value={inf.id}>
                  {inf.name} ({inf.invoicePrefix || 'INF'})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Months ({dynamicMonths.length} available)</option>
              {dynamicMonths.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#0b0f17] border border-tech-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Issued">Issued</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-tech-card border border-tech-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-tech-border bg-tech-surface text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Influencer</th>
                <th className="py-3.5 px-4">Brand / Client</th>
                <th className="py-3.5 px-4">Collaboration</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-right">TDS</th>
                <th className="py-3.5 px-4 text-right">Final Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
                    No invoices match the specified criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const tdsVal = inv.tdsAmount || 0;
                  const finalVal = inv.finalAmount || (inv.amount - tdsVal);

                  return (
                    <tr key={inv.id} className="hover:bg-tech-surface/40 transition-colors">
                      {/* Invoice Number */}
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>

                      {/* Influencer */}
                      <td className="py-3 px-4 text-slate-200 font-medium whitespace-nowrap">
                        {inv.influencerName}
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {inv.clientName}
                      </td>

                      {/* Collaboration */}
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={inv.campaignName}>
                        {inv.campaignName}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {inv.invoiceDate || '—'}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono text-slate-200 whitespace-nowrap">
                        ₹{inv.amount.toLocaleString('en-IN')}
                      </td>

                      {/* TDS */}
                      <td className="py-3 px-4 text-right font-mono text-amber-400/90 whitespace-nowrap">
                        {tdsVal > 0 ? `₹${tdsVal.toLocaleString('en-IN')}` : '₹0'}
                      </td>

                      {/* Final Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ₹{finalVal.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <select
                          value={inv.paymentStatus}
                          onChange={e => handleStatusChange(inv, e.target.value as any)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer bg-[#0b0f17] focus:outline-none ${
                            inv.paymentStatus === 'Paid'
                              ? 'border-emerald-500/40 text-emerald-400'
                              : inv.paymentStatus === 'Issued'
                              ? 'border-cyan-500/40 text-cyan-400'
                              : inv.paymentStatus === 'Pending'
                              ? 'border-amber-500/40 text-amber-400'
                              : 'border-slate-500/40 text-slate-400'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Issued">Issued</option>
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Preview */}
                          <button
                            onClick={() => setPreviewInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="View Invoice Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Regenerate in generator without changing invoice number */}
                          <button
                            onClick={() => onNavigateToGenerator(inv.id, inv.campaignId)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Regenerate / Open in Generator"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-tech-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-tech-border pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Invoice {previewInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#080b12] p-3 rounded-xl border border-tech-border">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Creator</span>
                  <span className="text-slate-200 font-bold">{previewInvoice.influencerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Client / Brand</span>
                  <span className="text-slate-200 font-bold">{previewInvoice.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Invoice Date</span>
                  <span className="text-slate-300">{previewInvoice.invoiceDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Due Date</span>
                  <span className="text-slate-300">{previewInvoice.dueDate || '30 days net'}</span>
                </div>
              </div>

              <div className="bg-[#080b12] p-3 rounded-xl border border-tech-border space-y-2">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Collaboration & Scope</span>
                <p className="text-slate-200 font-medium">{previewInvoice.campaignName}</p>
                <p className="text-slate-400 text-[11px] whitespace-pre-line">{previewInvoice.serviceDescription}</p>
              </div>

              <div className="bg-[#080b12] p-3 rounded-xl border border-tech-border space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Gross Amount:</span>
                  <span className="font-mono">₹{previewInvoice.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-400/90">
                  <span>TDS ({previewInvoice.tdsPercentage || 10}%):</span>
                  <span className="font-mono">-₹{(previewInvoice.tdsAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-tech-border pt-1.5 flex justify-between font-bold text-emerald-400 text-sm">
                  <span>Net Due:</span>
                  <span className="font-mono">₹{(previewInvoice.finalAmount || (previewInvoice.amount - (previewInvoice.tdsAmount || 0))).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-tech-border">
              <button
                onClick={() => {
                  onNavigateToGenerator(previewInvoice.id, previewInvoice.campaignId);
                  setPreviewInvoice(null);
                }}
                className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold"
              >
                Open in Generator
              </button>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Confirm Invoice Deletion</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete invoice <strong className="text-cyan-400 font-mono">{deleteConfirmInvoice.invoiceNumber}</strong> issued to <strong className="text-slate-100">{deleteConfirmInvoice.clientName}</strong>?
            </p>
            <p className="text-[11px] text-rose-400/80">
              This will remove the saved invoice record. It does not delete the collaboration.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmInvoice(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmInvoice)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/20"
              >
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
