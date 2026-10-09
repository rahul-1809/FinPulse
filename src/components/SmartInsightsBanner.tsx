'use client';

import React from 'react';
import { Transaction, Category } from '@/types';
import { computeSmartInsights } from '@/lib/insights';
import { formatCurrency } from '@/lib/utils';
import { 
  Sparkles, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  Flame, 
  CreditCard,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';

interface SmartInsightsBannerProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  currency: string;
}

export const SmartInsightsBanner: React.FC<SmartInsightsBannerProps> = ({
  transactions,
  categories,
  currentMonth,
  currency,
}) => {
  const insights = computeSmartInsights(transactions, categories, currentMonth);
  const { weekendInsight, momVelocity, topCategorySurge, peakSpendDay, weekdayAvgSpend, weekendAvgSpend } = insights;

  return (
    <div className="space-y-4">
      {/* Banner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Smart UPI-Style Spending Insights</h2>
        </div>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
          Auto-Calculated vs Last Month
        </span>
      </div>

      {/* Grid of UPI Callout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Weekend Spending Callout (User's Main Request!) */}
        <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all ${
          weekendInsight.isLess 
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30 hover:border-emerald-500/50' 
            : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/30 hover:border-rose-500/50'
        }`}>
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-slate-800/80 text-emerald-400 border border-slate-700/50">
              <Calendar className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
              weekendInsight.isLess
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {weekendInsight.isLess ? 'Weekend Saver' : 'Weekend Spike'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-400 font-medium">This Weekend Spending</div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-extrabold text-white">
                {formatCurrency(weekendInsight.currentWeekendSpend, currency)}
              </span>
              <span className={`text-xs font-semibold flex items-center ${
                weekendInsight.isLess ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {weekendInsight.isLess ? <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
                {weekendInsight.diffPercent}%
              </span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-300 leading-snug">
            {weekendInsight.message}
          </p>

          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Last Month Wknd Avg:</span>
            <span className="font-semibold text-slate-200">{formatCurrency(weekendInsight.prevMonthWeekendAvg, currency)}</span>
          </div>
        </div>

        {/* 2. Month-over-Month Velocity & Pace */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30 hover:border-blue-500/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-slate-800/80 text-blue-400 border border-slate-700/50">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Monthly Pace
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-400 font-medium">Spending to Date vs Last Month</div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-extrabold text-white">
                {formatCurrency(momVelocity.currentSpentToDate, currency)}
              </span>
              <span className={`text-xs font-semibold flex items-center ${
                momVelocity.diffPercent <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {momVelocity.diffPercent <= 0 ? <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> : <TrendingUp className="w-3.5 h-3.5 mr-0.5" />}
                {Math.abs(momVelocity.diffPercent)}%
              </span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-300 leading-snug">
            {momVelocity.diffPercent <= 0
              ? `You are spending ${Math.abs(momVelocity.diffPercent)}% less than last month at this time.`
              : `Spending is up by ${momVelocity.diffPercent}% compared to the same date last month.`}
          </p>

          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Projected Month End:</span>
            <span className="font-semibold text-slate-200">{formatCurrency(momVelocity.projectedTotalMonth, currency)}</span>
          </div>
        </div>

        {/* 3. Top Category Surge */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 hover:border-purple-500/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-slate-800/80 text-purple-400 border border-slate-700/50">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Category Surge
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-400 font-medium">Highest Spend Growth</div>
            {topCategorySurge ? (
              <>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-lg font-extrabold text-white truncate max-w-[140px]">
                    {topCategorySurge.categoryName}
                  </span>
                  <span className="text-xs font-semibold text-rose-400">
                    +{topCategorySurge.diffPercent}%
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-300 leading-snug">
                  Spent {formatCurrency(topCategorySurge.currentAmount, currency)} ({formatCurrency(topCategorySurge.diffAmount, currency)} more than last month).
                </p>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-slate-400">
                No category surges detected vs last month.
              </p>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Weekday Avg / Weekend Avg:</span>
            <span className="font-semibold text-slate-200">
              {formatCurrency(weekdayAvgSpend, currency)} / {formatCurrency(weekendAvgSpend, currency)}
            </span>
          </div>
        </div>

        {/* 4. Peak Spending Day */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 hover:border-amber-500/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-slate-800/80 text-amber-400 border border-slate-700/50">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Peak Day
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-400 font-medium">Highest Single Spend Day</div>
            {peakSpendDay ? (
              <>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-xl font-extrabold text-white">
                    {formatCurrency(peakSpendDay.amount, currency)}
                  </span>
                  <span className="text-[10px] text-slate-400">{peakSpendDay.date.slice(5)}</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-300 truncate">
                  {peakSpendDay.note || 'Multiple transactions'}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-slate-400">No expenses recorded yet.</p>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Healthy Budget Status:</span>
            <span className="font-semibold text-emerald-400 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> On Track
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
