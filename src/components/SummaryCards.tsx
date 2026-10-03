'use client';

import React from 'react';
import { MonthSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight,
  Scale
} from 'lucide-react';

interface SummaryCardsProps {
  summary: MonthSummary;
  currency: string;
  onOpenOpeningBalanceModal: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  currency,
  onOpenOpeningBalanceModal,
}) => {
  const isPositiveSavings = summary.netSavings >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Live Balance / Net Worth */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-850 p-4 sm:p-5 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Live Balance</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
            {formatCurrency(summary.totalLiquidBalance, currency)}
          </h3>
          <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs">
            <span className="text-slate-400">Month Opening:</span>
            <button
              onClick={onOpenOpeningBalanceModal}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 flex items-center space-x-1 cursor-pointer"
            >
              <span>{formatCurrency(summary.monthOpeningTotal, currency)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Total Inflow (Credits) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-850 p-4 sm:p-5 border border-slate-800 shadow-lg hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Inflow (Credits)</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 tracking-tight flex items-center truncate">
            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 mr-0.5 flex-shrink-0" />
            <span className="truncate">{formatCurrency(summary.monthInflow, currency)}</span>
          </h3>
          <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-slate-400 truncate">
            Salary, freelance &amp; credited funds
          </p>
        </div>
      </div>

      {/* 3. Total Outflow (Expenses / Debits) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-850 p-4 sm:p-5 border border-slate-800 shadow-lg hover:border-rose-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Outflow (Debits)</span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-400 tracking-tight flex items-center truncate">
            <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 mr-0.5 flex-shrink-0" />
            <span className="truncate">{formatCurrency(summary.monthOutflow, currency)}</span>
          </h3>
          <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-slate-400 truncate">
            Bills, food, living &amp; daily spends
          </p>
        </div>
      </div>

      {/* 4. Net Monthly Savings */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-850 p-4 sm:p-5 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Net Month Savings</span>
          <div className={`w-8 h-8 rounded-xl ${isPositiveSavings ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'} border flex items-center justify-center`}>
            {isPositiveSavings ? <PiggyBank className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight truncate ${isPositiveSavings ? 'text-emerald-400' : 'text-amber-400'}`}>
            {formatCurrency(summary.netSavings, currency)}
          </h3>
          <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
            <span>Savings Rate:</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full ${isPositiveSavings ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {summary.savingsRate}% of inflow
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
