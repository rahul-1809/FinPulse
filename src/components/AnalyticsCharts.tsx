'use client';

import React, { useState } from 'react';
import { Transaction, Category, MonthSummary, PaymentMode } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { computeSmartInsights } from '@/lib/insights';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Layers,
  LineChart as LineIcon,
  Calendar,
  CreditCard,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Sparkles
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  currency: string;
  summary: MonthSummary;
  onOpenDownloadReport?: () => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  categories,
  currentMonth,
  currency,
  summary,
  onOpenDownloadReport,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'mom' | 'payment'>('overview');

  const insights = computeSmartInsights(transactions, categories, currentMonth);

  // Month filtering
  const monthTx = transactions.filter((t) => t.date.startsWith(currentMonth));
  const expenseTx = monthTx.filter((t) => t.type === 'EXPENSE');

  // Compute category totals
  const categoryMap = new Map<string, { name: string; color: string; total: number }>();
  categories.forEach((cat) => {
    if (cat.type === 'EXPENSE') {
      categoryMap.set(cat.id, { name: cat.name, color: cat.color, total: 0 });
    }
  });

  expenseTx.forEach((tx) => {
    const catId = tx.category_id || 'other';
    if (categoryMap.has(catId)) {
      const entry = categoryMap.get(catId)!;
      entry.total += Number(tx.amount);
    } else {
      categoryMap.set(catId, { name: 'Uncategorized', color: '#94A3B8', total: Number(tx.amount) });
    }
  });

  const categoryChartData = Array.from(categoryMap.values())
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Cash flow comparison data
  const cashFlowData = [
    {
      name: 'Flow',
      Inflow: summary.monthInflow,
      Outflow: summary.monthOutflow,
      Savings: Math.max(0, summary.netSavings),
    },
  ];

  // 6 Months Historical Cashflow Diagram Data
  const getPastMonths = () => {
    const months = [];
    const [y, m] = currentMonth.split('-').map(Number);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${yearStr}-${monthStr}`;
      const name = d.toLocaleString('default', { month: 'short' });

      const txs = transactions.filter((t) => t.date.startsWith(key));
      const inf = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
      const out = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

      months.push({
        monthKey: key,
        name,
        Income: inf,
        Expense: out,
      });
    }
    return months;
  };

  const pastMonthsData = getPastMonths();
  const totalExpenses = summary.monthOutflow || 1;

  // Colors for Payment Modes
  const PAYMENT_COLORS: Record<string, string> = {
    UPI: '#10B981',
    Card: '#8B5CF6',
    Cash: '#F59E0B',
    'Net Banking': '#3B82F6',
    Cheque: '#64748B',
    Other: '#EC4899',
  };

  return (
    <section className="space-y-4">
      {/* Header Bar with Tabs and Download Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Advanced Insights &amp; Analytics</h2>
        </div>

        {/* Filter Tabs & Download Action */}
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Category &amp; Flow
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'daily' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Trend
            </button>
            <button
              onClick={() => setActiveTab('mom')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'mom' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              MoM &amp; 6M Bar
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'payment' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              UPI &amp; Payment Mode
            </button>
          </div>

          {onOpenDownloadReport && (
            <button
              onClick={onOpenDownloadReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md cursor-pointer ml-auto sm:ml-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW (Category Donut + Inflow vs Outflow Bar) --- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Category Breakdown Donut + List */}
          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-pink-400" />
                <span>Expense by Category</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Total: {formatCurrency(summary.monthOutflow, currency)}
              </span>
            </div>

            {categoryChartData.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No expenses recorded yet for this month.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-5 h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => [formatCurrency(Number(val) || 0, currency), 'Spent']}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-7 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {categoryChartData.map((cat) => {
                    const percent = Math.round((cat.total / totalExpenses) * 100);
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-slate-200 font-medium truncate">{cat.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-right">
                            <span className="text-white font-bold">{formatCurrency(cat.total, currency)}</span>
                            <span className="text-[10px] text-slate-400 font-semibold w-7">{percent}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Cash Flow Comparison Bar */}
          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 border border-slate-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Inflow vs Outflow</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">Monthly Ratio</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" tickLine={false} tick={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0, currency), '']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="Inflow" fill="#10B981" radius={[6, 6, 0, 0]} name="Inflow (Credits)" />
                  <Bar dataKey="Outflow" fill="#F43F5E" radius={[6, 6, 0, 0]} name="Outflow (Debits)" />
                  <Bar dataKey="Savings" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Net Surplus" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
                <div className="flex items-center justify-center text-emerald-400 font-semibold mb-0.5 space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Inflow</span>
                </div>
                <div className="text-white font-bold">{formatCurrency(summary.monthInflow, currency)}</div>
              </div>

              <div className="p-2 rounded-xl bg-rose-950/20 border border-rose-900/30">
                <div className="flex items-center justify-center text-rose-400 font-semibold mb-0.5 space-x-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>Outflow</span>
                </div>
                <div className="text-white font-bold">{formatCurrency(summary.monthOutflow, currency)}</div>
              </div>

              <div className="p-2 rounded-xl bg-blue-950/20 border border-blue-900/30">
                <div className="flex items-center justify-center text-blue-400 font-semibold mb-0.5">
                  <span>Net Retained</span>
                </div>
                <div className="text-white font-bold">{formatCurrency(summary.netSavings, currency)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: DAILY SPENDING TREND CHART --- */}
      {activeTab === 'daily' && (
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <LineIcon className="w-4 h-4 text-emerald-400" />
                <span>Daily Spending Spikes (Day 1 to {insights.dailySpendTrend.length})</span>
              </h3>
              <p className="text-xs text-slate-400">Track daily spending activity &amp; weekend spikes</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-rose-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" /> Expenses
              </span>
              <span className="flex items-center text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" /> Income
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={insights.dailySpendTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickFormatter={(d) => `Day ${d}`} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(val: unknown, name?: any) => [
                    formatCurrency(Number(val) || 0, currency),
                    String(name) === 'expense' ? 'Daily Expense' : 'Daily Income',
                  ]}
                  labelFormatter={(day: unknown) => {
                    const pt = insights.dailySpendTrend.find((p) => p.day === Number(day));
                    return pt ? `Day ${pt.day} (${pt.dayName}) ${pt.isWeekend ? '• Weekend' : ''}` : `Day ${day}`;
                  }}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Weekday Daily Average:</span>
              <strong className="text-white font-bold">{formatCurrency(insights.weekdayAvgSpend, currency)} / day</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Weekend Daily Average:</span>
              <strong className="text-amber-400 font-bold">{formatCurrency(insights.weekendAvgSpend, currency)} / day</strong>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: MoM CATEGORY COMPARISON & 6-MONTH COMPARATIVE BAR --- */}
      {activeTab === 'mom' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 6-Month Income vs Expense Bar */}
          <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-1">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>6-Month Cashflow Diagram</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">Historical comparison of income vs expenses</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pastMonthsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: unknown, name?: any) => [formatCurrency(Number(val) || 0, currency), String(name || '')]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MoM Category Comparison Progress List */}
          <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Category MoM Comparison</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">This month vs previous month spending</p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
              {insights.categoryComparisons.slice(0, 6).map((c) => (
                <div key={c.categoryId} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{c.categoryName}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-200">{formatCurrency(c.currentAmount, currency)}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.diffAmount <= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {c.diffAmount <= 0 ? '' : '+'}{c.diffPercent}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Prev Month: {formatCurrency(c.prevAmount, currency)}</span>
                    <span>Diff: {c.diffAmount > 0 ? `+${formatCurrency(c.diffAmount, currency)}` : formatCurrency(c.diffAmount, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: PAYMENT MODE & DAY OF WEEK BREAKDOWN --- */}
      {activeTab === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Payment Method Distribution */}
          <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-1">
              <CreditCard className="w-4 h-4 text-teal-400" />
              <span>Spend by Payment Method (UPI, Card, Cash)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">How you paid for your expenses this month</p>

            {insights.paymentModeBreakdown.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No transactions recorded.</div>
            ) : (
              <div className="space-y-3">
                {insights.paymentModeBreakdown.map((pm) => (
                  <div key={pm.mode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PAYMENT_COLORS[pm.mode] || '#3B82F6' }}
                        />
                        <span className="font-semibold text-white">{pm.mode}</span>
                        <span className="text-[10px] text-slate-400">({pm.count} tx)</span>
                      </div>
                      <div className="space-x-2 text-right">
                        <span className="font-bold text-white">{formatCurrency(pm.total, currency)}</span>
                        <span className="text-xs text-slate-400">{pm.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pm.percentage}%`,
                          backgroundColor: PAYMENT_COLORS[pm.mode] || '#3B82F6',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Day of Week Spending Diagram */}
          <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Day of Week Spending Diagram</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Distribution across Sun - Sat</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.dayOfWeekBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="dayName" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0, currency), 'Spent']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="totalAmount" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Total Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
