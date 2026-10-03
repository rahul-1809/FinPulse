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
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FinPulse
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                0ms Lag
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Personal Inflow & Expense Ledger</p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center bg-slate-800/90 border border-slate-700/60 rounded-xl p-1 shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleCurrentMonth}
            className="px-3 py-1 text-sm font-semibold text-slate-100 hover:text-emerald-400 transition-colors"
            title="Jump to Current Month"
          >
            {formatMonthName(currentMonth)}
          </button>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Actions / Settings */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Currency Switcher */}
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSupabaseConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
            }`}
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
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
              title="Sync with Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          {/* Backup / Export button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
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
