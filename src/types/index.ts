export type AccountType = 'Checking' | 'Savings' | 'Credit Card' | 'Cash' | 'Investment' | 'Wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  color: string;
  initial_balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyBalance {
  id: string;
  account_id: string;
  month: string; // 'YYYY-MM'
  opening_balance: number;
  notes?: string;
  created_at?: string;
}

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export type PaymentMode = 'UPI' | 'Cash' | 'Card' | 'Net Banking' | 'Cheque' | 'Other';

export interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  account_id: string;
  to_account_id?: string | null; // For transfers
  category_id?: string | null;
  date: string; // 'YYYY-MM-DD'
  note?: string;
  payment_mode?: PaymentMode;
  created_at?: string;
  updated_at?: string;
}

export interface AccountComputedBalance {
  account: Account;
  openingBalance: number; // For the selected month
  totalIncome: number;    // In selected month
  totalExpense: number;   // In selected month
  transfersIn: number;    // In selected month
  transfersOut: number;   // In selected month
  currentBalance: number; // All-time live balance
  monthClosingBalance: number; // Estimated balance at end of month
}

export interface MonthSummary {
  totalLiquidBalance: number;
  monthInflow: number;
  monthOutflow: number;
  netSavings: number;
  savingsRate: number;
  monthOpeningTotal: number;
}
