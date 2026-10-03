'use client';

import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '@/types';
import { X, Building2, Trash2, Check, Palette, DollarSign } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
  currency: string;
  onSave: (account: Omit<Account, 'id'> | Account) => void;
  onDelete?: (id: string) => void;
}

const COLOR_PRESETS = [
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#16A34A', // Green
  '#9333EA', // Purple
  '#EA580C', // Orange
  '#DC2626', // Red
  '#4F46E5', // Indigo
  '#0891B2', // Cyan
  '#CA8A04', // Yellow/Gold
  '#475569', // Slate
];

const ACCOUNT_TYPES: AccountType[] = [
  'Checking',
  'Savings',
  'Credit Card',
  'Cash',
  'Wallet',
  'Investment',
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount,
  currency,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Checking');
  const [color, setColor] = useState('#2563EB');
  const [initialBalance, setInitialBalance] = useState('0');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setColor(editingAccount.color || '#2563EB');
      setInitialBalance(String(editingAccount.initial_balance ?? 0));
    } else {
      setName('');
      setType('Checking');
      setColor('#2563EB');
      setInitialBalance('0');
    }
  }, [isOpen, editingAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an account name.');
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      currency,
      color,
      initial_balance: parseFloat(initialBalance) || 0,
    };

    if (editingAccount) {
      onSave({ ...payload, id: editingAccount.id });
    } else {
      onSave(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (editingAccount && onDelete) {
      if (confirm(`Are you sure you want to delete "${editingAccount.name}" and its related transactions?`)) {
        onDelete(editingAccount.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingAccount ? 'Edit Bank Account & Amount' : 'Add New Bank Account'}
              </h3>
              <p className="text-xs text-slate-400">Update account name, base amount & branding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Account / Bank Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Salary, Chase, Cash Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Base / Initial Balance */}
          <div>
            <label className="flex items-center space-x-1 text-xs font-medium text-slate-400 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Base / Initial Balance ({currency}) <span className="text-rose-400">*</span></span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The starting amount when this account was created or baseline balance.
            </p>
          </div>

          {/* Color Accent Picker */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-2">
              <Palette className="w-3.5 h-3.5" />
              <span>Card Accent Color</span>
            </label>
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            {editingAccount && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-rose-950/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingAccount ? 'Update Account & Amount' : 'Create Account'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
