'use client';

import React from 'react';
import { Transaction, Category, MonthSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Layers
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
  CartesianGrid 
} from 'recharts';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  currency: string;
  summary: MonthSummary;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  categories,
  currentMonth,
  currency,
  summary,
}) => {
  // Filter for selected month
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

  // Cash flow comparison data for bar chart
  const cashFlowData = [
    {
      name: 'Flow',
      Inflow: summary.monthInflow,
      Outflow: summary.monthOutflow,
      Savings: Math.max(0, summary.netSavings),
    },
  ];

  const totalExpenses = summary.monthOutflow || 1;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <span>Spending & Flow Analytics</span>
        </h2>
        <span className="text-xs text-slate-400">Month Insights</span>
      </div>

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
              {/* Donut Chart */}
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

              {/* Category Ranking List */}
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
    </section>
  );
};
