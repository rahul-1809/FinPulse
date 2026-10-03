import { Account, Category, MonthlyBalance, Transaction, AccountComputedBalance, MonthSummary } from '@/types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_MONTHLY_BALANCES, DEFAULT_TRANSACTIONS } from './constants';
import { getSupabase } from './supabase';
import { generateUUID } from './utils';

const STORAGE_KEYS = {
  ACCOUNTS: 'pe_accounts_v2',
  MONTHLY_BALANCES: 'pe_monthly_balances_v2',
  CATEGORIES: 'pe_categories_v2',
  TRANSACTIONS: 'pe_transactions_v2',
};

type Listener = () => void;

class DataStore {
  private accounts: Account[] = [];
  private monthlyBalances: MonthlyBalance[] = [];
  private categories: Category[] = [];
  private transactions: Transaction[] = [];
  private initialized = false;
  private listeners: Set<Listener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private realtimeSubscribed = false;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifySubscribers() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('Subscriber notification error:', e);
      }
    });
  }

  public init() {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;

    try {
      // Setup cross-tab BroadcastChannel
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('finpulse_tab_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data === 'sync_required') {
            this.syncFromLocal();
            this.notifySubscribers();
          }
        };
      }

      // 1. Initial quick load from LocalStorage
      this.syncFromLocal();
      this.initialized = true;

      // 2. Fetch from Supabase and listen for Realtime events
      this.syncFromSupabase();
      this.setupSupabaseRealtime();
    } catch (e) {
      console.error('Error initializing DataStore:', e);
      this.accounts = DEFAULT_ACCOUNTS;
      this.monthlyBalances = DEFAULT_MONTHLY_BALANCES;
      this.categories = DEFAULT_CATEGORIES;
      this.transactions = DEFAULT_TRANSACTIONS;
    }
  }

  private syncFromLocal() {
    if (typeof window === 'undefined') return;
    const storedAcc = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    this.accounts = storedAcc ? JSON.parse(storedAcc) : DEFAULT_ACCOUNTS;

    const storedMb = localStorage.getItem(STORAGE_KEYS.MONTHLY_BALANCES);
    this.monthlyBalances = storedMb ? JSON.parse(storedMb) : DEFAULT_MONTHLY_BALANCES;

    const storedCat = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    this.categories = storedCat ? JSON.parse(storedCat) : DEFAULT_CATEGORIES;

    const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    this.transactions = storedTx ? JSON.parse(storedTx) : DEFAULT_TRANSACTIONS;
  }

  private saveLocal() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(this.accounts));
      localStorage.setItem(STORAGE_KEYS.MONTHLY_BALANCES, JSON.stringify(this.monthlyBalances));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      
      // Notify other tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage('sync_required');
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // --- SUPABASE REALTIME & SYNC ---
  private setupSupabaseRealtime() {
    if (this.realtimeSubscribed) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      supabase
        .channel('finpulse_db_changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          this.syncFromSupabase();
        })
        .subscribe();
      this.realtimeSubscribed = true;
    } catch (err) {
      console.warn('Supabase realtime setup failed:', err);
    }
  }

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

      let hasSupabaseData = false;

      if (accRes.data && accRes.data.length > 0) {
        this.accounts = accRes.data;
        hasSupabaseData = true;
      }
      if (mbRes.data && mbRes.data.length > 0) {
        this.monthlyBalances = mbRes.data;
        hasSupabaseData = true;
      }
      if (catRes.data && catRes.data.length > 0) {
        this.categories = catRes.data;
      }
      if (txRes.data && txRes.data.length > 0) {
        this.transactions = txRes.data;
        hasSupabaseData = true;
      }

      // If Supabase database is empty, auto-push initial defaults to cloud
      if (!hasSupabaseData && accRes.data?.length === 0) {
        await this.pushLocalToSupabase();
      } else {
        this.saveLocal();
        this.notifySubscribers();
      }

      return true;
    } catch (err) {
      console.error('Supabase sync error:', err);
      return false;
    }
  }

  public async pushLocalToSupabase(): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase credentials not configured.' };
    }

    try {
      if (this.categories.length > 0) {
        await supabase.from('categories').upsert(this.categories);
      }
      if (this.accounts.length > 0) {
        await supabase.from('accounts').upsert(this.accounts);
      }
      if (this.monthlyBalances.length > 0) {
        await supabase.from('monthly_balances').upsert(this.monthlyBalances);
      }
      if (this.transactions.length > 0) {
        await supabase.from('transactions').upsert(this.transactions);
      }
      return { success: true, message: 'Synced with Supabase successfully!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Supabase push error:', msg);
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
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.accounts.push(newAccount);
    this.saveLocal();
    this.notifySubscribers();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('accounts').insert([newAccount]).then(({ error }) => {
        if (error) console.error('Supabase insert account error:', error);
      });
    }
    return newAccount;
  }

  public updateAccount(id: string, updates: Partial<Account>): Account | null {
    this.init();
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    this.accounts[idx] = { ...this.accounts[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveLocal();
    this.notifySubscribers();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('accounts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase update account error:', error);
      });
    }
    return this.accounts[idx];
  }

  public deleteAccount(id: string): boolean {
    this.init();
    this.accounts = this.accounts.filter((a) => a.id !== id);
    this.monthlyBalances = this.monthlyBalances.filter((mb) => mb.account_id !== id);
    this.transactions = this.transactions.filter((tx) => tx.account_id !== id && tx.to_account_id !== id);
    this.saveLocal();
    this.notifySubscribers();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('accounts').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete account error:', error);
      });
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
        id: generateUUID(),
        account_id: accountId,
        month,
        opening_balance: balance,
        notes,
        created_at: new Date().toISOString(),
      };
      this.monthlyBalances.push(result);
    }
    this.saveLocal();
    this.notifySubscribers();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('monthly_balances').upsert([result]).then(({ error }) => {
        if (error) console.error('Supabase upsert monthly balance error:', error);
      });
    }
    return result;
  }

  // --- TRANSACTIONS MUTATIONS ---
  public addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
    this.init();
    const newTx: Transaction = {
      ...tx,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.transactions.unshift(newTx);
    this.saveLocal();
    this.notifySubscribers();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('transactions').insert([newTx]).then(({ error }) => {
        if (error) console.error('Supabase insert transaction error:', error);
      });
    }
    return newTx;
  }

  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    this.init();
    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    this.transactions[idx] = { ...this.transactions[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveLocal();
    this.notifySubscribers();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('transactions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase update transaction error:', error);
      });
    }
    return this.transactions[idx];
  }

  public deleteTransaction(id: string): boolean {
    this.init();
    this.transactions = this.transactions.filter((t) => t.id !== id);
    this.saveLocal();
    this.notifySubscribers();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('transactions').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete transaction error:', error);
      });
    }
    return true;
  }

  // --- COMPUTATION ENGINE ---
  public computeAccountBalances(month: string): AccountComputedBalance[] {
    this.init();
    return this.accounts.map((acc) => {
      const configuredMb = this.monthlyBalances.find((mb) => mb.account_id === acc.id && mb.month === month);
      
      let openingBalance: number;
      if (configuredMb !== undefined) {
        openingBalance = Number(configuredMb.opening_balance);
      } else {
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
    const totalLiquidBalance = computedAccounts.reduce((sum, item) => sum + item.currentBalance, 0);
    const monthOpeningTotal = computedAccounts.reduce((sum, item) => sum + item.openingBalance, 0);

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
      this.pushLocalToSupabase();
      this.notifySubscribers();
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
    this.pushLocalToSupabase();
    this.notifySubscribers();
  }
}

export const dataStore = new DataStore();
