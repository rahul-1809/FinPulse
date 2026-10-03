'use client';

import React, { useState, useEffect } from 'react';
import { Account, MonthlyBalance } from '@/types';
import { formatCurrency, formatMonthName } from '@/lib/utils';
import { X, CalendarCheck2, Check, Building2, Info } from 'lucide-react';

interface OpeningBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  monthlyBalances: MonthlyBalance[];
  currentMonth: string;
  currency: string;
  selectedAccountId?: string;
  onSaveBalances: (updates: Array<{ accountId: string; balance: number; notes?: string }>) => void;
}

export const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({
  isOpen,
  onClose,
  accounts,
  monthlyBalances,
  currentMonth,
  currency,
  selectedAccountId,
  onSaveBalances,
}) => {
  const [balancesMap, setBalancesMap] = useState<Record<string, string>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const bMap: Record<string, string> = {};
      const nMap: Record<string, string> = {};

      accounts.forEach((acc) => {
        const mb = monthlyBalances.find((m) => m.account_id === acc.id && m.month === currentMonth);
        bMap[acc.id] = mb !== undefined ? String(mb.opening_balance) : String(acc.initial_balance || 0);
        nMap[acc.id] = mb?.notes || '';
      });

      setBalancesMap(bMap);
      setNotesMap(nMap);
    }
  }, [isOpen, accounts, monthlyBalances, currentMonth]);

  const handleBalanceChange = (accId: string, val: string) => {
    setBalancesMap((prev) => ({ ...prev, [accId]: val }));
  };

  const handleNotesChange = (accId: string, val: string) => {
    setNotesMap((prev) => ({ ...prev, [accId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Array<{ accountId: string; balance: number; notes?: string }> = [];

    for (const acc of accounts) {
      const valStr = balancesMap[acc.id];
      const parsed = parseFloat(valStr);
      if (!isNaN(parsed)) {
        updates.push({
          accountId: acc.id,
          balance: parsed,
          notes: notesMap[acc.id]?.trim() || undefined,
        });
      }
    }

    onSaveBalances(updates);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Monthly Starting Balances
              </h3>
              <p className="text-xs text-slate-400">
                Opening balance for <span className="text-emerald-400 font-semibold">{formatMonthName(currentMonth)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 flex items-start space-x-2.5 text-xs text-blue-300">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p>
            Enter each account&apos;s starting balance on the 1st of <strong>{formatMonthName(currentMonth)}</strong> (from your bank passbook/statement). The ledger will calculate your live net worth and monthly cash flow accordingly.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            {accounts.map((acc) => {
              const isHighlighted = selectedAccountId === acc.id;
              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl bg-slate-950 border transition-all ${
                    isHighlighted
                      ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: acc.color || '#3B82F6' }}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">{acc.name}</span>
                        <span className="text-xs text-slate-400 ml-2 font-normal">({acc.type})</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Opening Balance ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={balancesMap[acc.id] ?? ''}
                        onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Statement / Verification Note
                      </label>
                      <input
                        type="text"
                        value={notesMap[acc.id] ?? ''}
                        onChange={(e) => handleNotesChange(acc.id, e.target.value)}
                        placeholder="e.g. As per Oct 1 Netbanking"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Opening Balances</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
