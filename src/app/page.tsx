'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Account, 
  Category, 
  Transaction, 
  MonthlyBalance, 
  TransactionType,
  AccountComputedBalance,
  MonthSummary
} from '@/types';
import { dataStore } from '@/lib/storage';
import { getCurrentMonthString } from '@/lib/utils';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { BankAccountsSection } from '@/components/BankAccountsSection';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { OpeningBalanceModal } from '@/components/OpeningBalanceModal';
import { AccountModal } from '@/components/AccountModal';
import { SupabaseConfigModal } from '@/components/SupabaseConfigModal';
import { ExportModal } from '@/components/ExportModal';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthString());
  const [currency, setCurrency] = useState<string>('INR');

  // State data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Computed metrics
  const [computedAccounts, setComputedAccounts] = useState<AccountComputedBalance[]>([]);
  const [summary, setSummary] = useState<MonthSummary>({
    totalLiquidBalance: 0,
    monthInflow: 0,
    monthOutflow: 0,
    netSavings: 0,
    savingsRate: 0,
    monthOpeningTotal: 0,
  });

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('EXPENSE');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
  const [selectedAccountIdForOpening, setSelectedAccountIdForOpening] = useState<string | undefined>();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh all data from memory store
  const refreshData = useCallback(() => {
    const accs = dataStore.getAccounts();
    const cats = dataStore.getCategories();
    const mbs = dataStore.getMonthlyBalances();
    const txs = dataStore.getTransactions();

    setAccounts(accs);
    setCategories(cats);
    setMonthlyBalances(mbs);
    setTransactions(txs);

    const compAccs = dataStore.computeAccountBalances(currentMonth);
    setComputedAccounts(compAccs);

    const sum = dataStore.computeMonthSummary(currentMonth);
    setSummary(sum);
  }, [currentMonth]);

  useEffect(() => {
    setIsClient(true);
    dataStore.init();
    refreshData();
  }, [refreshData]);

  // Keyboard shortcut listener for rapid entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'e' || e.key === 'E') {
        setTxModalType('EXPENSE');
        setEditingTx(null);
        setIsTxModalOpen(true);
      } else if (e.key === 'i' || e.key === 'I') {
        setTxModalType('INCOME');
        setEditingTx(null);
        setIsTxModalOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        setTxModalType('TRANSFER');
        setEditingTx(null);
        setIsTxModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Handlers ---
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'> | Transaction) => {
    if ('id' in txData) {
      dataStore.updateTransaction(txData.id, txData);
    } else {
      dataStore.addTransaction(txData);
    }
    refreshData();
  };

  const handleDeleteTransaction = (id: string) => {
    dataStore.deleteTransaction(id);
    refreshData();
  };

  const handleSaveOpeningBalances = (updates: Array<{ accountId: string; balance: number; notes?: string }>) => {
    updates.forEach((item) => {
      dataStore.setMonthlyOpeningBalance(item.accountId, currentMonth, item.balance, item.notes);
    });
    refreshData();
  };

  const handleSaveAccount = (accData: Omit<Account, 'id'> | Account) => {
    if ('id' in accData) {
      dataStore.updateAccount(accData.id, accData);
    } else {
      dataStore.addAccount(accData);
    }
    refreshData();
  };

  const handleDeleteAccount = (id: string) => {
    dataStore.deleteAccount(id);
    refreshData();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await dataStore.syncFromSupabase();
    refreshData();
    setIsSyncing(false);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading FinPulse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={(m) => setCurrentMonth(m)}
        currency={currency}
        onCurrencyChange={(c) => setCurrency(c)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        {/* 1. Month Summary Metrics */}
        <SummaryCards
          summary={summary}
          currency={currency}
          onOpenOpeningBalanceModal={() => {
            setSelectedAccountIdForOpening(undefined);
            setIsOpeningBalanceModalOpen(true);
          }}
        />

        {/* 2. Bank Accounts & Starting Balance Overview */}
        <BankAccountsSection
          computedAccounts={computedAccounts}
          currency={currency}
          currentMonth={currentMonth}
          onAddAccount={() => {
            setEditingAccount(null);
            setIsAccountModalOpen(true);
          }}
          onEditAccount={(acc) => {
            setEditingAccount(acc);
            setIsAccountModalOpen(true);
          }}
          onOpenOpeningBalanceModal={(accId) => {
            setSelectedAccountIdForOpening(accId);
            setIsOpeningBalanceModalOpen(true);
          }}
        />

        {/* 3. Visual Charts & Analytics */}
        <AnalyticsCharts
          transactions={transactions}
          categories={categories}
          currentMonth={currentMonth}
          currency={currency}
          summary={summary}
        />

        {/* 4. Transactions Ledger & Quick Actions */}
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          currentMonth={currentMonth}
          currency={currency}
          onOpenAddModal={(t) => {
            setTxModalType(t);
            setEditingTx(null);
            setIsTxModalOpen(true);
          }}
          onEditTransaction={(tx) => {
            setEditingTx(tx);
            setIsTxModalOpen(true);
          }}
          onDeleteTransaction={handleDeleteTransaction}
          onExportCSV={() => {
            const csv = dataStore.exportTransactionsCSV(currentMonth);
            const a = document.createElement('a');
            const file = new Blob([csv], { type: 'text/csv' });
            a.href = URL.createObjectURL(file);
            a.download = `transactions-${currentMonth}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        />
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        accounts={accounts}
        categories={categories}
        currency={currency}
        initialType={txModalType}
        editingTransaction={editingTx}
        onSave={handleSaveTransaction}
      />

      <OpeningBalanceModal
        isOpen={isOpeningBalanceModalOpen}
        onClose={() => setIsOpeningBalanceModalOpen(false)}
        accounts={accounts}
        monthlyBalances={monthlyBalances}
        currentMonth={currentMonth}
        currency={currency}
        selectedAccountId={selectedAccountIdForOpening}
        onSaveBalances={handleSaveOpeningBalances}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
        currency={currency}
        onSave={handleSaveAccount}
        onDelete={handleDeleteAccount}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSyncComplete={refreshData}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentMonth={currentMonth}
        onDataImported={refreshData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>FinPulse Ledger • Lag-Free Inflow &amp; Expense Tracking</div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Shortcuts: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-[10px]">E</kbd> Expense</span>
            <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-[10px]">I</kbd> Income</span>
            <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-[10px]">T</kbd> Transfer</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
