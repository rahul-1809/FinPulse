'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Database, Download, Sparkles, RefreshCw } from 'lucide-react';
import { formatMonthName } from '@/lib/utils';
import { getSupabaseCredentials } from '@/lib/supabase';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onOpenSupabaseModal: () => void;
  onOpenExportModal: () => void;
  isSyncing?: boolean;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  currency,
  onCurrencyChange,
  onOpenSupabaseModal,
  onOpenExportModal,
  isSyncing,
  onManualSync,
}) => {
  const { url } = getSupabaseCredentials();
  const isSupabaseConnected = Boolean(url);

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    const d = new Date();
    const cur = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(cur);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FinPulse
              </h1>
              <span className="hidden xs:inline text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                0ms
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Personal Inflow &amp; Expense Ledger</p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center bg-slate-900/90 border border-slate-700/60 rounded-xl p-0.5 sm:p-1 shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          
          <button
            onClick={handleCurrentMonth}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-slate-100 hover:text-emerald-400 transition-colors whitespace-nowrap"
            title="Jump to Current Month"
          >
            {formatMonthName(currentMonth)}
          </button>

          <button
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Actions / Settings */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
          {/* Currency Switcher */}
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="bg-slate-900 text-[11px] sm:text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="AED">AED</option>
          </select>

          {/* Supabase Status Button */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSupabaseConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
            title={isSupabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}
          >
            <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden md:inline">
              {isSupabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          </button>

          {/* Sync icon if connected */}
          {isSupabaseConnected && onManualSync && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
              title="Sync with Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          {/* Backup / Export button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            title="Export / Backup Data"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
