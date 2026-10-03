'use client';

import React, { useState, useMemo } from 'react';
import { Account, Category, Transaction, TransactionType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Trash2, 
  Edit3, 
  Download, 
  Plus, 
  ReceiptText,
  CreditCard,
  Building2,
  Tag
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currentMonth: string;
  currency: string;
  onOpenAddModal: (type: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onExportCSV: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  categories,
  currentMonth,
  currency,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onExportCSV,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Filter transactions
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      // Month match
      if (!tx.date.startsWith(currentMonth)) return false;

      // Type match
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      // Account match
      if (accountFilter !== 'ALL' && tx.account_id !== accountFilter && tx.to_account_id !== accountFilter) {
        return false;
      }

      // Category match
      if (categoryFilter !== 'ALL' && tx.category_id !== categoryFilter) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const noteMatch = (tx.note || '').toLowerCase().includes(query);
        const catName = tx.category_id ? catMap.get(tx.category_id)?.name.toLowerCase() || '' : '';
        const accName = accMap.get(tx.account_id)?.name.toLowerCase() || '';
        const toAccName = tx.to_account_id ? accMap.get(tx.to_account_id)?.name.toLowerCase() || '' : '';
        if (!noteMatch && !catName.includes(query) && !accName.includes(query) && !toAccName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, currentMonth, typeFilter, accountFilter, categoryFilter, searchQuery, accMap, catMap]);

  return (
    <section className="space-y-4">
      {/* Top Banner with Quick Logging Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <ReceiptText className="w-5 h-5 text-emerald-400" />
            <span>Monthly Ledger & Spends</span>
          </h2>
          <p className="text-xs text-slate-400">
            {filteredList.length} transactions recorded for this month
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Expense */}
          <button
            onClick={() => onOpenAddModal('EXPENSE')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Expense</span>
          </button>

          {/* Quick Income */}
          <button
            onClick={() => onOpenAddModal('INCOME')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Income (Credit)</span>
          </button>

          {/* Transfer */}
          <button
            onClick={() => onOpenAddModal('TRANSFER')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes, accounts, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'ALL' | TransactionType)}
            className="bg-slate-950 text-xs font-medium text-slate-300 border border-slate-800 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="EXPENSE">Expenses Only</option>
            <option value="INCOME">Income Only</option>
            <option value="TRANSFER">Transfers Only</option>
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-slate-950 text-xs font-medium text-slate-300 border border-slate-800 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[140px] truncate"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={onExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            title="Download CSV for this month"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Transaction List Cards / Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ReceiptText className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-60" />
            <p className="text-sm font-medium text-slate-400">No transactions found</p>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;+ Expense&quot; or &quot;+ Income&quot; to log your first transaction.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredList.map((tx) => {
              const fromAcc = accMap.get(tx.account_id);
              const toAcc = tx.to_account_id ? accMap.get(tx.to_account_id) : null;
              const cat = tx.category_id ? catMap.get(tx.category_id) : null;

              const isIncome = tx.type === 'INCOME';
              const isExpense = tx.type === 'EXPENSE';
              const isTransfer = tx.type === 'TRANSFER';

              return (
                <div
                  key={tx.id}
                  className="p-4 hover:bg-slate-850/80 transition-colors flex items-center justify-between gap-3 group"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isExpense
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {isIncome && <ArrowUpRight className="w-5 h-5" />}
                      {isExpense && <ArrowDownLeft className="w-5 h-5" />}
                      {isTransfer && <ArrowRightLeft className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">
                          {tx.note || (cat ? cat.name : isTransfer ? 'Account Transfer' : 'General')}
                        </span>
                        {cat && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {cat.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 text-slate-300">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span>{fromAcc?.name || 'Account'}</span>
                          {isTransfer && toAcc && (
                            <>
                              <span className="text-slate-500">→</span>
                              <span>{toAcc.name}</span>
                            </>
                          )}
                        </span>
                        {tx.payment_mode && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{tx.payment_mode}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-base font-extrabold tracking-tight ${
                          isIncome
                            ? 'text-emerald-400'
                            : isExpense
                            ? 'text-rose-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {isIncome && '+'}
                        {isExpense && '-'}
                        {formatCurrency(tx.amount, currency)}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">
                        {tx.type}
                      </div>
                    </div>

                    {/* Action buttons on hover */}
                    <div className="flex items-center space-x-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit entry"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this transaction?')) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
