'use client';

import React, { useState, useEffect } from 'react';
import { Account, Category, PaymentMode, Transaction, TransactionType } from '@/types';
import { getTodayDateString } from '@/lib/utils';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Check, 
  Tag, 
  Building2, 
  Calendar, 
  FileText,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  currency: string;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  onSave: (tx: Omit<Transaction, 'id'> | Transaction) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  currency,
  initialType = 'EXPENSE',
  editingTransaction,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setAccountId(editingTransaction.account_id);
      setToAccountId(editingTransaction.to_account_id || '');
      setCategoryId(editingTransaction.category_id || '');
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
      setPaymentMode(editingTransaction.payment_mode || 'UPI');
    } else {
      setType(initialType);
      setAmount('');
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        if (accounts.length > 1) {
          setToAccountId(accounts[1].id);
        }
      }
      setDate(getTodayDateString());
      setNote('');
      setPaymentMode('UPI');

      // Auto pick first category for type
      const firstCat = categories.find((c) => c.type === (initialType === 'INCOME' ? 'INCOME' : 'EXPENSE'));
      if (firstCat) setCategoryId(firstCat.id);
    }
  }, [isOpen, editingTransaction, initialType, accounts, categories]);

  // When type changes, update category selection
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType !== 'TRANSFER') {
      const match = categories.find((c) => c.type === (newType === 'INCOME' ? 'INCOME' : 'EXPENSE'));
      if (match) setCategoryId(match.id);
    }
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + addValue));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    if (!accountId) {
      alert('Please select an account.');
      return;
    }

    if (type === 'TRANSFER' && accountId === toAccountId) {
      alert('Sender and Receiver accounts cannot be the same for transfer.');
      return;
    }

    const payload: Omit<Transaction, 'id'> = {
      type,
      amount: numAmount,
      account_id: accountId,
      to_account_id: type === 'TRANSFER' ? toAccountId : null,
      category_id: type !== 'TRANSFER' ? categoryId : null,
      date,
      note: note.trim() || undefined,
      payment_mode: paymentMode,
    };

    if (editingTransaction) {
      onSave({ ...payload, id: editingTransaction.id });
    } else {
      onSave(payload);
      // Small celebration confetti on income
      if (type === 'INCOME') {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // ignore
        }
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
            </h3>
            <p className="text-xs text-slate-400">
              {editingTransaction ? 'Update entry details' : 'Fast and frictionless logging (<3s)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Type Segmented Buttons */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-rose-400" />
              <span>Expense (Debit)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Income (Credit)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('TRANSFER')}
              className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                type === 'TRANSFER'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Big Amount Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Amount ({currency}) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-2xl font-black text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center space-x-2 mt-2">
              {[100, 500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Account & Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account (From Account if transfer, or Account for expense/income) */}
            <div>
              <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{type === 'TRANSFER' ? 'From Bank Account' : type === 'INCOME' ? 'Credited To' : 'Debited From'}</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account (Only for TRANSFER) OR Category (for Expense/Income) */}
            {type === 'TRANSFER' ? (
              <div>
                <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>To Bank Account</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Category</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payment Mode</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Note / Description (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy lunch, Salary credit, Amazon order..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'Update Entry' : 'Save Entry (0ms)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
