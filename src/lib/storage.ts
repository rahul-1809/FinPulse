import { Account, Category, MonthlyBalance, Transaction, AccountComputedBalance, MonthSummary } from '@/types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_MONTHLY_BALANCES, DEFAULT_TRANSACTIONS } from './constants';
import { getSupabase } from './supabase';

const STORAGE_KEYS = {
  ACCOUNTS: 'pe_accounts_v1',
  MONTHLY_BALANCES: 'pe_monthly_balances_v1',
  CATEGORIES: 'pe_categories_v1',
  TRANSACTIONS: 'pe_transactions_v1',
  ACTIVE_MONTH: 'pe_active_month_v1',
  CURRENCY: 'pe_currency_v1',
};

// --- In-Memory & LocalStorage Cache ---
class DataStore {
  private accounts: Account[] = [];
  private monthlyBalances: MonthlyBalance[] = [];
  private categories: Category[] = [];
  private transactions: Transaction[] = [];
  private initialized = false;

  public init() {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;

    try {
      const storedAcc = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      this.accounts = storedAcc ? JSON.parse(storedAcc) : DEFAULT_ACCOUNTS;

      const storedMb = localStorage.getItem(STORAGE_KEYS.MONTHLY_BALANCES);
      this.monthlyBalances = storedMb ? JSON.parse(storedMb) : DEFAULT_MONTHLY_BALANCES;

      const storedCat = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      this.categories = storedCat ? JSON.parse(storedCat) : DEFAULT_CATEGORIES;

      const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      this.transactions = storedTx ? JSON.parse(storedTx) : DEFAULT_TRANSACTIONS;

      this.saveLocal();
      this.initialized = true;

      // Asynchronously attempt to sync from Supabase if connected
      this.syncFromSupabase();
    } catch (e) {
      console.error('Error initializing DataStore:', e);
      this.accounts = DEFAULT_ACCOUNTS;
      this.monthlyBalances = DEFAULT_MONTHLY_BALANCES;
      this.categories = DEFAULT_CATEGORIES;
      this.transactions = DEFAULT_TRANSACTIONS;
    }
  }

  private saveLocal() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(this.accounts));
      localStorage.setItem(STORAGE_KEYS.MONTHLY_BALANCES, JSON.stringify(this.monthlyBalances));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // --- SUPABASE SYNC ---
  public async syncFromSupabase(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const [accRes, mbRes, catRes, txRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('monthly_balances').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
      ]);

      if (accRes.data && accRes.data.length > 0) {
        this.accounts = accRes.data;
      }
      if (mbRes.data && mbRes.data.length > 0) {
        this.monthlyBalances = mbRes.data;
      }
      if (catRes.data && catRes.data.length > 0) {
        this.categories = catRes.data;
      }
      if (txRes.data && txRes.data.length > 0) {
        this.transactions = txRes.data;
      }

      this.saveLocal();
      return true;
    } catch (err) {
      console.error('Supabase fetch failed:', err);
      return false;
    }
  }

  // Push all local data into Supabase
  public async pushLocalToSupabase(): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase credentials not set or invalid.' };
    }

    try {
      if (this.accounts.length > 0) {
        await supabase.from('accounts').upsert(this.accounts);
      }
      if (this.categories.length > 0) {
        await supabase.from('categories').upsert(this.categories);
      }
      if (this.monthlyBalances.length > 0) {
        await supabase.from('monthly_balances').upsert(this.monthlyBalances);
      }
      if (this.transactions.length > 0) {
        await supabase.from('transactions').upsert(this.transactions);
      }
      return { success: true, message: 'Local data synced with Supabase successfully!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Sync error: ${msg}` };
    }
  }

  // --- GETTERS ---
  public getAccounts(): Account[] {
    this.init();
    return [...this.accounts];
  }

  public getCategories(): Category[] {
    this.init();
    return [...this.categories];
  }

  public getMonthlyBalances(): MonthlyBalance[] {
    this.init();
    return [...this.monthlyBalances];
  }

  public getTransactions(): Transaction[] {
    this.init();
    return [...this.transactions];
  }

  // --- ACCOUNTS MUTATIONS ---
  public addAccount(account: Omit<Account, 'id'>): Account {
    this.init();
    const newAccount: Account = {
      ...account,
      id: 'acc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      created_at: new Date().toISOString(),
    };
    this.accounts.push(newAccount);
    this.saveLocal();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('accounts').insert([newAccount]).then();
    }
    return newAccount;
  }

  public updateAccount(id: string, updates: Partial<Account>): Account | null {
    this.init();
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    this.accounts[idx] = { ...this.accounts[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveLocal();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('accounts').update(updates).eq('id', id).then();
    }
    return this.accounts[idx];
  }

  public deleteAccount(id: string): boolean {
    this.init();
    this.accounts = this.accounts.filter((a) => a.id !== id);
    this.monthlyBalances = this.monthlyBalances.filter((mb) => mb.account_id !== id);
    this.transactions = this.transactions.filter((tx) => tx.account_id !== id && tx.to_account_id !== id);
    this.saveLocal();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('accounts').delete().eq('id', id).then();
    }
    return true;
  }

  // --- MONTHLY OPENING BALANCE MUTATIONS ---
  public setMonthlyOpeningBalance(accountId: string, month: string, balance: number, notes?: string): MonthlyBalance {
    this.init();
    const existingIdx = this.monthlyBalances.findIndex((mb) => mb.account_id === accountId && mb.month === month);

    let result: MonthlyBalance;
    if (existingIdx >= 0) {
      this.monthlyBalances[existingIdx] = {
        ...this.monthlyBalances[existingIdx],
        opening_balance: balance,
        notes: notes ?? this.monthlyBalances[existingIdx].notes,
      };
      result = this.monthlyBalances[existingIdx];
    } else {
      result = {
        id: 'mb-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        account_id: accountId,
        month,
        opening_balance: balance,
        notes,
        created_at: new Date().toISOString(),
      };
      this.monthlyBalances.push(result);
    }
    this.saveLocal();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('monthly_balances').upsert([result]).then();
    }
    return result;
  }

  // --- CATEGORY MUTATIONS ---
  public addCategory(cat: Omit<Category, 'id'>): Category {
    this.init();
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    };
    this.categories.push(newCat);
    this.saveLocal();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('categories').insert([newCat]).then();
    }
    return newCat;
  }

  // --- TRANSACTIONS MUTATIONS ---
  public addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
    this.init();
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      created_at: new Date().toISOString(),
    };
    // Insert at beginning for chronological order
    this.transactions.unshift(newTx);
    this.saveLocal();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('transactions').insert([newTx]).then();
    }
    return newTx;
  }

  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    this.init();
    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    this.transactions[idx] = { ...this.transactions[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveLocal();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('transactions').update(updates).eq('id', id).then();
    }
    return this.transactions[idx];
  }

  public deleteTransaction(id: string): boolean {
    this.init();
    this.transactions = this.transactions.filter((t) => t.id !== id);
    this.saveLocal();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('transactions').delete().eq('id', id).then();
    }
    return true;
  }

  // --- COMPUTATION ENGINE ---
  public computeAccountBalances(month: string): AccountComputedBalance[] {
    this.init();
    return this.accounts.map((acc) => {
      // 1. Determine opening balance for the month
      const configuredMb = this.monthlyBalances.find((mb) => mb.account_id === acc.id && mb.month === month);
      
      let openingBalance: number;
      if (configuredMb !== undefined) {
        openingBalance = Number(configuredMb.opening_balance);
      } else {
        // Compute previous months' roll-over or fallback to initial_balance
        // All transactions strictly before this month (date < month + '-01')
        const prevTx = this.transactions.filter(
          (t) => t.date < `${month}-01` && (t.account_id === acc.id || t.to_account_id === acc.id)
        );
        let balance = Number(acc.initial_balance || 0);
        for (const tx of prevTx) {
          const amt = Number(tx.amount);
          if (tx.type === 'INCOME' && tx.account_id === acc.id) balance += amt;
          else if (tx.type === 'EXPENSE' && tx.account_id === acc.id) balance -= amt;
          else if (tx.type === 'TRANSFER') {
            if (tx.account_id === acc.id) balance -= amt;
            if (tx.to_account_id === acc.id) balance += amt;
          }
        }
        openingBalance = balance;
      }

      // 2. Selected month transactions
      const monthTx = this.transactions.filter(
        (t) => t.date.startsWith(month) && (t.account_id === acc.id || t.to_account_id === acc.id)
      );

      let totalIncome = 0;
      let totalExpense = 0;
      let transfersIn = 0;
      let transfersOut = 0;

      for (const tx of monthTx) {
        const amt = Number(tx.amount);
        if (tx.type === 'INCOME' && tx.account_id === acc.id) {
          totalIncome += amt;
        } else if (tx.type === 'EXPENSE' && tx.account_id === acc.id) {
          totalExpense += amt;
        } else if (tx.type === 'TRANSFER') {
          if (tx.account_id === acc.id) transfersOut += amt;
          if (tx.to_account_id === acc.id) transfersIn += amt;
        }
      }

      const monthClosingBalance = openingBalance + totalIncome - totalExpense + transfersIn - transfersOut;

      // 3. All-time live balance
      const allTx = this.transactions.filter((t) => t.account_id === acc.id || t.to_account_id === acc.id);
      let currentBalance = Number(acc.initial_balance || 0);
      for (const tx of allTx) {
        const amt = Number(tx.amount);
        if (tx.type === 'INCOME' && tx.account_id === acc.id) currentBalance += amt;
        else if (tx.type === 'EXPENSE' && tx.account_id === acc.id) currentBalance -= amt;
        else if (tx.type === 'TRANSFER') {
          if (tx.account_id === acc.id) currentBalance -= amt;
          if (tx.to_account_id === acc.id) currentBalance += amt;
        }
      }

      return {
        account: acc,
        openingBalance,
        totalIncome,
        totalExpense,
        transfersIn,
        transfersOut,
        currentBalance,
        monthClosingBalance,
      };
    });
  }

  public computeMonthSummary(month: string): MonthSummary {
    const computedAccounts = this.computeAccountBalances(month);
    
    // Total live net worth / liquid balance (excluding liability accounts if negative)
    const totalLiquidBalance = computedAccounts.reduce((sum, item) => sum + item.currentBalance, 0);
    const monthOpeningTotal = computedAccounts.reduce((sum, item) => sum + item.openingBalance, 0);

    // Sum transactions in this month
    const monthTx = this.transactions.filter((t) => t.date.startsWith(month));
    let monthInflow = 0;
    let monthOutflow = 0;

    for (const tx of monthTx) {
      const amt = Number(tx.amount);
      if (tx.type === 'INCOME') {
        monthInflow += amt;
      } else if (tx.type === 'EXPENSE') {
        monthOutflow += amt;
      }
    }

    const netSavings = monthInflow - monthOutflow;
    const savingsRate = monthInflow > 0 ? Math.round((netSavings / monthInflow) * 100) : 0;

    return {
      totalLiquidBalance,
      monthInflow,
      monthOutflow,
      netSavings,
      savingsRate,
      monthOpeningTotal,
    };
  }

  // --- IMPORT / EXPORT UTILS ---
  public exportDataJSON(): string {
    this.init();
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        accounts: this.accounts,
        monthlyBalances: this.monthlyBalances,
        categories: this.categories,
        transactions: this.transactions,
      },
      null,
      2
    );
  }

  public importDataJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.accounts)) this.accounts = data.accounts;
      if (Array.isArray(data.monthlyBalances)) this.monthlyBalances = data.monthlyBalances;
      if (Array.isArray(data.categories)) this.categories = data.categories;
      if (Array.isArray(data.transactions)) this.transactions = data.transactions;
      this.saveLocal();
      return { success: true, message: 'Data imported successfully!' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, message: 'Failed to import: ' + msg };
    }
  }

  public exportTransactionsCSV(month?: string): string {
    this.init();
    const list = month ? this.transactions.filter((t) => t.date.startsWith(month)) : this.transactions;
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Account', 'To Account', 'Category', 'Payment Mode', 'Note'];

    const accMap = new Map(this.accounts.map((a) => [a.id, a.name]));
    const catMap = new Map(this.categories.map((c) => [c.id, c.name]));

    const rows = list.map((tx) => [
      tx.id,
      tx.date,
      tx.type,
      tx.amount,
      `"${accMap.get(tx.account_id) || tx.account_id}"`,
      tx.to_account_id ? `"${accMap.get(tx.to_account_id) || tx.to_account_id}"` : '""',
      tx.category_id ? `"${catMap.get(tx.category_id) || tx.category_id}"` : '""',
      `"${tx.payment_mode || ''}"`,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public resetToDefaults() {
    this.accounts = DEFAULT_ACCOUNTS;
    this.monthlyBalances = DEFAULT_MONTHLY_BALANCES;
    this.categories = DEFAULT_CATEGORIES;
    this.transactions = DEFAULT_TRANSACTIONS;
    this.saveLocal();
  }
}

export const dataStore = new DataStore();
