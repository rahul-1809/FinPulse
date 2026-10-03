'use client';

import React from 'react';
import { TransactionType } from '@/types';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ReceiptText, Sparkles, Zap } from 'lucide-react';

interface QuickActionBarProps {
  transactionCount: number;
  currentMonth: string;
  onOpenAddModal: (type: TransactionType) => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  transactionCount,
  onOpenAddModal,
}) => {
  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800/80 p-4 sm:p-5 shadow-xl shadow-black/20 hover:border-slate-700/80 transition-all duration-300">
      {/* Background ambient glow effect */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Ledger Info */}
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner flex-shrink-0">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Quick Ledger &amp; Spends
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-3 h-3" />
                <span>Instant</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-semibold text-emerald-400">{transactionCount}</span> {transactionCount === 1 ? 'entry' : 'entries'} recorded for this month
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Quick Expense */}
          <button
            onClick={() => onOpenAddModal('EXPENSE')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-600/25 active:scale-95 transition-all duration-200 cursor-pointer group"
          >
            <ArrowDownLeft className="w-4 h-4 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
            <span>+ Expense</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-rose-700/50 border border-rose-400/30 text-rose-200 ml-1">
              E
            </kbd>
          </button>

          {/* Quick Income */}
          <button
            onClick={() => onOpenAddModal('INCOME')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all duration-200 cursor-pointer group"
          >
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>+ Income (Credit)</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-700/50 border border-emerald-400/30 text-emerald-200 ml-1">
              I
            </kbd>
          </button>

          {/* Transfer */}
          <button
            onClick={() => onOpenAddModal('TRANSFER')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-750 hover:text-white border border-slate-700/80 shadow-md active:scale-95 transition-all duration-200 cursor-pointer group"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-400 group-hover:rotate-180 transition-transform duration-300" />
            <span>Transfer</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-700/60 border border-slate-600 text-slate-300 ml-1">
              T
            </kbd>
          </button>
        </div>
      </div>
    </section>
  );
};
