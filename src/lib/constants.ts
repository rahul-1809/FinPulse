import { Account, Category, Transaction, MonthlyBalance } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-inc-1', name: 'Salary', type: 'INCOME', icon: 'Briefcase', color: '#10B981' },
  { id: 'cat-inc-2', name: 'Freelance & Consulting', type: 'INCOME', icon: 'Laptop', color: '#059669' },
  { id: 'cat-inc-3', name: 'Investments & Dividends', type: 'INCOME', icon: 'TrendingUp', color: '#34D399' },
  { id: 'cat-inc-4', name: 'Refund & Cashback', type: 'INCOME', icon: 'RotateCcw', color: '#6EE7B7' },
  { id: 'cat-inc-5', name: 'Other Income', type: 'INCOME', icon: 'PlusCircle', color: '#A7F3D0' },

  { id: 'cat-exp-1', name: 'Food & Dining', type: 'EXPENSE', icon: 'Utensils', color: '#EF4444' },
  { id: 'cat-exp-2', name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingCart', color: '#F97316' },
  { id: 'cat-exp-3', name: 'Rent & Housing', type: 'EXPENSE', icon: 'Home', color: '#8B5CF6' },
  { id: 'cat-exp-4', name: 'Bills & Utilities', type: 'EXPENSE', icon: 'Zap', color: '#F59E0B' },
  { id: 'cat-exp-5', name: 'Transport & Fuel', type: 'EXPENSE', icon: 'Car', color: '#3B82F6' },
  { id: 'cat-exp-6', name: 'Shopping & Clothes', type: 'EXPENSE', icon: 'ShoppingBag', color: '#EC4899' },
  { id: 'cat-exp-7', name: 'Health & Medical', type: 'EXPENSE', icon: 'HeartPulse', color: '#14B8A6' },
  { id: 'cat-exp-8', name: 'Entertainment & OTT', type: 'EXPENSE', icon: 'Film', color: '#6366F1' },
  { id: 'cat-exp-9', name: 'Education & Books', type: 'EXPENSE', icon: 'BookOpen', color: '#84CC16' },
  { id: 'cat-exp-10', name: 'Personal Care', type: 'EXPENSE', icon: 'Sparkles', color: '#D946EF' },
  { id: 'cat-exp-11', name: 'General Misc', type: 'EXPENSE', icon: 'HelpCircle', color: '#64748B' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'HDFC Salary Bank',
    type: 'Checking',
    currency: 'INR',
    color: '#2563EB', // Blue
    initial_balance: 45000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    name: 'ICICI Savings',
    type: 'Savings',
    currency: 'INR',
    color: '#0D9488', // Teal
    initial_balance: 120000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'acc-3',
    name: 'Cash in Hand / Wallet',
    type: 'Cash',
    currency: 'INR',
    color: '#16A34A', // Green
    initial_balance: 5500,
    created_at: new Date().toISOString(),
  },
  {
    id: 'acc-4',
    name: 'Credit Card',
    type: 'Credit Card',
    currency: 'INR',
    color: '#9333EA', // Purple
    initial_balance: 0,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_MONTHLY_BALANCES: MonthlyBalance[] = [
  {
    id: 'mb-1',
    account_id: 'acc-1',
    month: '2026-10',
    opening_balance: 45000,
    notes: 'October 1st bank statement',
  },
  {
    id: 'mb-2',
    account_id: 'acc-2',
    month: '2026-10',
    opening_balance: 120000,
    notes: 'October 1st fixed deposit & savings',
  },
  {
    id: 'mb-3',
    account_id: 'acc-3',
    month: '2026-10',
    opening_balance: 5500,
    notes: 'Cash in physical wallet',
  },
  {
    id: 'mb-4',
    account_id: 'acc-4',
    month: '2026-10',
    opening_balance: 0,
    notes: 'Clean CC start',
  },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'INCOME',
    amount: 85000,
    account_id: 'acc-1',
    category_id: 'cat-inc-1',
    date: '2026-10-01',
    note: 'October Monthly Salary Credited',
    payment_mode: 'Net Banking',
  },
  {
    id: 'tx-2',
    type: 'EXPENSE',
    amount: 22000,
    account_id: 'acc-1',
    category_id: 'cat-exp-3',
    date: '2026-10-02',
    note: 'House Rent for October',
    payment_mode: 'UPI',
  },
  {
    id: 'tx-3',
    type: 'EXPENSE',
    amount: 3450,
    account_id: 'acc-1',
    category_id: 'cat-exp-2',
    date: '2026-10-02',
    note: 'Monthly Supermarket Groceries',
    payment_mode: 'UPI',
  },
  {
    id: 'tx-4',
    type: 'EXPENSE',
    amount: 620,
    account_id: 'acc-3',
    category_id: 'cat-exp-1',
    date: '2026-10-03',
    note: 'Breakfast & Coffee with Friends',
    payment_mode: 'Cash',
  },
  {
    id: 'tx-5',
    type: 'TRANSFER',
    amount: 3000,
    account_id: 'acc-1',
    to_account_id: 'acc-3',
    category_id: null,
    date: '2026-10-03',
    note: 'ATM Cash Withdrawal for daily expenses',
    payment_mode: 'UPI',
  },
  {
    id: 'tx-6',
    type: 'EXPENSE',
    amount: 1499,
    account_id: 'acc-4',
    category_id: 'cat-exp-4',
    date: '2026-10-03',
    note: 'High-speed Fiber Internet Bill',
    payment_mode: 'Card',
  },
  {
    id: 'tx-7',
    type: 'INCOME',
    amount: 12500,
    account_id: 'acc-1',
    category_id: 'cat-inc-2',
    date: '2026-10-03',
    note: 'Freelance UI Design project milestone',
    payment_mode: 'UPI',
  },
];
