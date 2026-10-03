'use client';

import React from 'react';
import { Account, AccountComputedBalance } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  Building2, 
  CreditCard, 
  Wallet, 
  Coins, 
  Plus, 
  Settings2, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  CalendarCheck2,
  Edit3
} from 'lucide-react';

interface BankAccountsSectionProps {
  computedAccounts: AccountComputedBalance[];
  currency: string;
  currentMonth: string;
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onOpenOpeningBalanceModal: (accountId?: string) => void;
}

export const BankAccountsSection: React.FC<BankAccountsSectionProps> = ({
  computedAccounts,
  currency,
  onAddAccount,
  onEditAccount,
  onOpenOpeningBalanceModal,
}) => {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Credit Card':
        return <CreditCard className="w-5 h-5" />;
      case 'Cash':
      case 'Wallet':
        return <Coins className="w-5 h-5" />;
      case 'Investment':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Bank &amp; Wallet Accounts</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              {computedAccounts.length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Track and edit starting amounts, monthly inflows, expenses, and live balance per account
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick configure month opening balance */}
          <button
            onClick={() => onOpenOpeningBalanceModal()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Set Month Opening Balances</span>
          </button>

          {/* Add Account */}
          <button
            onClick={onAddAccount}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {computedAccounts.map((item) => {
          const { account, openingBalance, totalIncome, totalExpense, currentBalance } = item;
          const isNegative = currentBalance < 0;

          return (
            <div
              key={account.id}
              className="relative group overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4 border border-slate-800 hover:border-slate-700 transition-all shadow-md hover:shadow-xl flex flex-col justify-between"
            >
              {/* Account Top Ribbon */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: account.color || '#3B82F6' }}
                  >
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {account.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {account.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onEditAccount(account)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Account details and Base Amount"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Balances Display */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Live Balance</span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-lg font-extrabold tracking-tight ${isNegative ? 'text-rose-400' : 'text-white'}`}>
                      {formatCurrency(currentBalance, currency)}
                    </span>
                    <button
                      onClick={() => onEditAccount(account)}
                      className="text-slate-500 hover:text-emerald-400 transition-colors"
                      title="Edit base amount"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Opening Balance Badge (Clickable to edit this month's starting balance) */}
                <div className="mt-2.5 flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-xl border border-slate-800/50 group/open">
                  <span className="text-slate-400">Month Opening:</span>
                  <button
                    onClick={() => onOpenOpeningBalanceModal(account.id)}
                    className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center space-x-1 cursor-pointer"
                    title="Click to edit opening balance for this month"
                  >
                    <span>{formatCurrency(openingBalance, currency)}</span>
                    <Edit3 className="w-3 h-3 opacity-60 group-hover/open:opacity-100 ml-0.5" />
                  </button>
                </div>

                {/* Month Inflow & Outflow Mini Pills */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-900/30">
                    <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">+{formatCurrency(totalIncome, currency)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-rose-400 bg-rose-950/20 px-2 py-1 rounded-lg border border-rose-900/30">
                    <ArrowDownRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">-{formatCurrency(totalExpense, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
