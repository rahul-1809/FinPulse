'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  BarChart3, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Transaction, Category, Account } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { computeSmartInsights } from '@/lib/insights';

interface DownloadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currentMonth: string;
  currency: string;
}

export const DownloadReportModal: React.FC<DownloadReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  accounts,
  currentMonth,
  currency,
}) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  if (!isOpen) return null;

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));

  // Compute transactions based on selected report scope
  let filteredTx: Transaction[] = [];
  let periodLabel = '';

  if (reportType === 'daily') {
    filteredTx = transactions.filter((t) => t.date === selectedDate);
    periodLabel = `Daily Analysis (${selectedDate})`;
  } else if (reportType === 'weekly') {
    // Current week (last 7 days from selected date)
    const end = new Date(selectedDate + 'T23:59:59');
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const startStr = start.toISOString().split('T')[0];
    filteredTx = transactions.filter((t) => t.date >= startStr && t.date <= selectedDate);
    periodLabel = `Weekly Analysis (${startStr} to ${selectedDate})`;
  } else {
    filteredTx = transactions.filter((t) => t.date.startsWith(selectedMonth));
    periodLabel = `Monthly Analysis (${selectedMonth})`;
  }

  const expenses = filteredTx.filter((t) => t.type === 'EXPENSE');
  const income = filteredTx.filter((t) => t.type === 'INCOME');
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
  const netSavings = totalIncome - totalExpense;

  // Compute category totals
  const categoryTotals = new Map<string, number>();
  expenses.forEach((t) => {
    const cid = t.category_id || 'uncategorized';
    categoryTotals.set(cid, (categoryTotals.get(cid) || 0) + Number(t.amount));
  });

  const categoryRows = Array.from(categoryTotals.entries())
    .map(([cid, total]) => ({
      name: catMap.get(cid) || 'Uncategorized',
      total,
      percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Compute insights
  const insights = computeSmartInsights(transactions, categories, selectedMonth);

  // --- Print/PDF Report Generator ---
  const handleGeneratePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FinPulse Executive Financial Report - ${periodLabel}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              color: #059669;
              letter-spacing: -0.5px;
            }
            .sub {
              font-size: 12px;
              color: #64748b;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .metric-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              background: #f8fafc;
            }
            .metric-title {
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
            }
            .metric-value {
              font-size: 20px;
              font-weight: 700;
              margin-top: 6px;
            }
            .inflow { color: #059669; }
            .outflow { color: #e11d48; }
            .net { color: #2563eb; }
            
            .section-title {
              font-size: 16px;
              font-weight: 700;
              margin-top: 30px;
              margin-bottom: 12px;
              color: #0f172a;
              border-left: 4px solid #059669;
              padding-left: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            th, td {
              padding: 10px 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: 600;
            }
            .callout {
              background-color: #f0fdf4;
              border: 1px solid #bbf7d0;
              padding: 15px;
              border-radius: 12px;
              margin-bottom: 25px;
              font-size: 13px;
              color: #166534;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">FinPulse Financial Report</div>
              <div class="sub">${periodLabel} • Generated on ${new Date().toLocaleDateString()}</div>
            </div>
            <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Print / Download PDF
            </button>
          </div>

          <div class="callout">
            <strong>UPI Smart Insights:</strong> ${insights.weekendInsight.message}
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">Total Inflow (Income)</div>
              <div class="metric-value inflow">${formatCurrency(totalIncome, currency)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Total Outflow (Expenses)</div>
              <div class="metric-value outflow">${formatCurrency(totalExpense, currency)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Net Surplus</div>
              <div class="metric-value net">${formatCurrency(netSavings, currency)}</div>
            </div>
          </div>

          <div class="section-title">Expense Breakdown by Category</div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Spent</th>
                <th>Share (%)</th>
              </tr>
            </thead>
            <tbody>
              ${
                categoryRows.length === 0
                  ? '<tr><td colspan="3">No expense transactions recorded for this period.</td></tr>'
                  : categoryRows
                      .map(
                        (cat) => `
                <tr>
                  <td><strong>${cat.name}</strong></td>
                  <td>${formatCurrency(cat.total, currency)}</td>
                  <td>${cat.percentage}%</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>

          <div class="section-title">Itemized Transactions Log</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Account</th>
                <th>Category / Note</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredTx.length === 0
                  ? '<tr><td colspan="5">No transactions found for this timeframe.</td></tr>'
                  : filteredTx
                      .map(
                        (tx) => `
                <tr>
                  <td>${tx.date}</td>
                  <td><span style="color: ${tx.type === 'EXPENSE' ? '#e11d48' : tx.type === 'INCOME' ? '#059669' : '#2563eb'}; font-weight: 600;">${tx.type}</span></td>
                  <td>${accMap.get(tx.account_id) || tx.account_id}</td>
                  <td>${catMap.get(tx.category_id || '') || ''} ${tx.note ? '(' + tx.note + ')' : ''}</td>
                  <td><strong>${formatCurrency(tx.amount, currency)}</strong></td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>

          <div class="footer">
            FinPulse Ledger Analytics • End-to-End Encrypted Financial Tracking Report
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- Export Analytical CSV ---
  const handleExportCSV = () => {
    const headers = ['Report Scope', periodLabel];
    const metricsHeader = ['Metric', 'Amount'];
    const metricsRows = [
      ['Total Inflow', totalIncome],
      ['Total Outflow', totalExpense],
      ['Net Surplus', netSavings],
      ['Total Transactions Count', filteredTx.length],
    ];

    const catHeader = ['Category', 'Total Spent', 'Percentage'];
    const catDataRows = categoryRows.map((c) => [c.name, c.total, `${c.percentage}%`]);

    const txHeader = ['Date', 'Type', 'Account', 'To Account', 'Category', 'Mode', 'Amount', 'Note'];
    const txDataRows = filteredTx.map((tx) => [
      tx.date,
      tx.type,
      `"${accMap.get(tx.account_id) || tx.account_id}"`,
      tx.to_account_id ? `"${accMap.get(tx.to_account_id) || tx.to_account_id}"` : '""',
      tx.category_id ? `"${catMap.get(tx.category_id) || ''}"` : '""',
      `"${tx.payment_mode || ''}"`,
      tx.amount,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      '',
      '--- EXECUTIVE SUMMARY ---',
      metricsHeader.join(','),
      ...metricsRows.map((r) => r.join(',')),
      '',
      '--- CATEGORY BREAKDOWN ---',
      catHeader.join(','),
      ...catDataRows.map((r) => r.join(',')),
      '',
      '--- TRANSACTIONS LOG ---',
      txHeader.join(','),
      ...txDataRows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finpulse-analysis-${reportType}-${selectedDate || selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Download Analysis Report</h3>
              <p className="text-xs text-slate-400">Export Daily, Weekly or Monthly Financial Insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Step 1: Timeframe Selection Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              1. Select Analysis Timeframe
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setReportType('daily')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  reportType === 'daily'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily Analysis
              </button>
              <button
                type="button"
                onClick={() => setReportType('weekly')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  reportType === 'weekly'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly Analysis
              </button>
              <button
                type="button"
                onClick={() => setReportType('monthly')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  reportType === 'monthly'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Analysis
              </button>
            </div>
          </div>

          {/* Step 2: Date / Month Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Select Target {reportType === 'monthly' ? 'Month' : 'Date'}
            </label>
            {reportType === 'monthly' ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* Quick Summary Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Selected Scope: <strong className="text-white">{periodLabel}</strong></span>
              <span><strong>{filteredTx.length}</strong> transactions</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-center">
              <div>
                <div className="text-[10px] text-slate-400">Inflow</div>
                <div className="text-xs font-bold text-emerald-400">{formatCurrency(totalIncome, currency)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Outflow</div>
                <div className="text-xs font-bold text-rose-400">{formatCurrency(totalExpense, currency)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Net Surplus</div>
                <div className="text-xs font-bold text-blue-400">{formatCurrency(netSavings, currency)}</div>
              </div>
            </div>
          </div>

          {/* Step 3: Download Buttons */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              3. Choose Export Format
            </label>

            <button
              onClick={handleGeneratePrintPDF}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <Printer className="w-5 h-5 text-emerald-100" />
                <div className="text-left">
                  <div>Print / Save Styled PDF Report</div>
                  <div className="text-[11px] font-normal text-emerald-100/80">Formatted executive summary with insights</div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-400">
                    Export Analytical CSV File
                  </div>
                  <div className="text-xs text-slate-400">Includes summary metrics &amp; itemized records</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
