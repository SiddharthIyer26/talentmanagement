import React, { useState } from 'react';
import { db } from '../../services/db';
import { Expense } from '../../types';
import { DollarSign, Plus, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

export const FinancialsView: React.FC = () => {
  const metrics = db.getFinancialMetrics();
  const expenses = db.getExpenses();

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Software');
  const [amount, setAmount] = useState<number>(5000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveExpense({
      id: 'exp-' + Date.now(),
      title,
      category,
      amount: Number(amount),
      date,
      notes
    });
    setShowExpenseModal(false);
    setTitle('');
    alert('Expense recorded successfully!');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Revenue, Expenses & Net Earnings
          </h2>
          <p className="text-xs text-slate-400">
            Financial ledger tracking gross agency revenues, operational expenses & net business earnings.
          </p>
        </div>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-red-500 to-indigo-600 hover:from-red-400 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Operating Expense</span>
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-tech-card border border-tech-border rounded-xl p-5">
          <span className="text-xs text-slate-400 block mb-1">Total Gross Revenue</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-tech-card border border-tech-border rounded-xl p-5">
          <span className="text-xs text-slate-400 block mb-1">Total Operating Expenses</span>
          <span className="text-2xl font-extrabold text-red-400 font-mono">
            ₹{metrics.totalExpenses.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-tech-card border border-cyan-500/30 rounded-xl p-5">
          <span className="text-xs text-cyan-400 font-bold block mb-1">Net Business Earnings</span>
          <span className="text-2xl font-extrabold text-cyan-300 font-mono">
            ₹{metrics.netEarnings.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-5 space-y-3 text-xs">
        <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Operational Expense Log</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-tech-border text-slate-400">
                <th className="py-2.5 px-3">Expense Item</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-200">{exp.title}</p>
                    {exp.notes && <p className="text-[10px] text-slate-500">{exp.notes}</p>}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{exp.date}</td>
                  <td className="py-3 px-3 font-mono font-bold text-red-400">
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-tech-card border border-tech-border rounded-2xl w-full max-w-md p-5 text-xs space-y-4">
            <h3 className="font-bold text-slate-100 text-sm">Record Business Expense</h3>
            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Expense Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Adobe Premiere License"
                  className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200"
                  >
                    <option value="Software">Software</option>
                    <option value="Travel">Travel</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Agency Fee">Agency Fee</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-tech-border rounded p-2 text-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg shadow-md"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
