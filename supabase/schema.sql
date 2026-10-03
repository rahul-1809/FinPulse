-- =========================================================
-- Supabase PostgreSQL Schema for Personal Expense Tracker
-- Copy and paste this script into your Supabase SQL Editor
-- =========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Checking', -- 'Savings', 'Checking', 'Credit Card', 'Cash', 'Investment'
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    color VARCHAR(30) DEFAULT '#3B82F6',
    initial_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MONTHLY OPENING BALANCES TABLE
CREATE TABLE IF NOT EXISTS monthly_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM' e.g. '2026-10'
    opening_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, month)
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'EXPENSE' or 'INCOME'
    icon VARCHAR(50) DEFAULT 'Tag',
    color VARCHAR(30) DEFAULT '#6B7280',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE (EXPENSES, INCOMES, TRANSFERS)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL, -- 'EXPENSE', 'INCOME', 'TRANSFER'
    amount DECIMAL(14, 2) NOT NULL CHECK (amount > 0),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- Used only for 'TRANSFER'
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    payment_mode VARCHAR(50) DEFAULT 'UPI', -- 'Cash', 'Card', 'UPI', 'Net Banking', 'Bank Transfer'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_monthly_balances_month ON monthly_balances(month);

-- 5. SEED DEFAULT CATEGORIES
INSERT INTO categories (name, type, icon, color) VALUES
    ('Salary', 'INCOME', 'Briefcase', '#10B981'),
    ('Freelance & Consulting', 'INCOME', 'Laptop', '#059669'),
    ('Investments & Dividends', 'INCOME', 'TrendingUp', '#34D399'),
    ('Refund & Cashback', 'INCOME', 'RotateCcw', '#6EE7B7'),
    ('Other Income', 'INCOME', 'PlusCircle', '#A7F3D0'),
    
    ('Food & Dining', 'EXPENSE', 'Utensils', '#EF4444'),
    ('Groceries', 'EXPENSE', 'ShoppingCart', '#F97316'),
    ('Rent & Housing', 'EXPENSE', 'Home', '#8B5CF6'),
    ('Bills & Utilities', 'EXPENSE', 'Zap', '#F59E0B'),
    ('Transport & Fuel', 'EXPENSE', 'Car', '#3B82F6'),
    ('Shopping & Clothing', 'EXPENSE', 'ShoppingBag', '#EC4899'),
    ('Health & Medical', 'EXPENSE', 'HeartPulse', '#14B8A6'),
    ('Entertainment & OTT', 'EXPENSE', 'Film', '#6366F1'),
    ('Education & Books', 'EXPENSE', 'BookOpen', '#84CC16'),
    ('Personal Care', 'EXPENSE', 'Sparkles', '#D946EF'),
    ('General / Miscellaneous', 'EXPENSE', 'HelpCircle', '#64748B')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) if you want multi-tenant later, or public read/write for personal tracker:
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for personal tracker (or replace with auth.uid() when using Supabase Auth)
CREATE POLICY "Allow all operations on accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on monthly_balances" ON monthly_balances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
