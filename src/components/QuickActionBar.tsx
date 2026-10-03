'use client';

import React from 'react';
import { TransactionType } from '@/types';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ReceiptText, Zap } from 'lucide-react';

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
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800/80 p-3.5 sm:p-5 shadow-xl shadow-black/20 hover:border-slate-700/80 transition-all duration-300">
      {/* Background ambient glow effect */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Title and Ledger Info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner flex-shrink-0">
            <ReceiptText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-lg font-extrabold text-white tracking-tight">
                Quick Ledger &amp; Spends
              </h2>
              <span className="inline-flex items-center space-x-1 text-[9px] sm:text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-2.5 h-2.5" />
                <span>Instant</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              <span className="font-bold text-emerald-400">{transactionCount}</span> {transactionCount === 1 ? 'entry' : 'entries'} this month
            </p>
          </div>
        </div>

        {/* Action Buttons Grid on Mobile, Flex on Tablet/Desktop */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
          {/* Quick Expense */}
          <button
            onClick={() => onOpenAddModal('EXPENSE')}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-600/25 active:scale-95 transition-all duration-200 cursor-pointer group text-center truncate"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform flex-shrink-0" />
            <span className="truncate">+ Expense</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-rose-700/50 border border-rose-400/30 text-rose-200 ml-1">
              E
            </kbd>
          </button>

          {/* Quick Income */}
          <button
            onClick={() => onOpenAddModal('INCOME')}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all duration-200 cursor-pointer group text-center truncate"
          >
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
            <span className="truncate">+ Income</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-700/50 border border-emerald-400/30 text-emerald-200 ml-1">
              I
            </kbd>
          </button>

          {/* Transfer */}
          <button
            onClick={() => onOpenAddModal('TRANSFER')}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-750 hover:text-white border border-slate-700/80 shadow-md active:scale-95 transition-all duration-200 cursor-pointer group text-center truncate"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 group-hover:rotate-180 transition-transform duration-300 flex-shrink-0" />
            <span className="truncate">Transfer</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-700/60 border border-slate-600 text-slate-300 ml-1">
              T
            </kbd>
          </button>
        </div>
      </div>
    </section>
  );
};
