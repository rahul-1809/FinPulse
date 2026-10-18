-- =========================================================
-- Supabase Multi-User Migration & RLS Security Script
-- Run this in your Supabase Dashboard -> SQL Editor
-- =========================================================

-- 1. ADD user_id TO ALL TABLES (CASCADE DELETE ON USER REMOVAL)
ALTER TABLE accounts 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE monthly_balances 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE categories 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. CREATE PERFORMANCE INDEXES FOR USER QUERIES
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_balances_user_id ON monthly_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 3. DROP OLD PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Allow all operations on accounts" ON accounts;
DROP POLICY IF EXISTS "Allow all operations on monthly_balances" ON monthly_balances;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;
DROP POLICY IF EXISTS "Users access own accounts" ON accounts;
DROP POLICY IF EXISTS "Users access own monthly_balances" ON monthly_balances;
DROP POLICY IF EXISTS "Users access own categories" ON categories;
DROP POLICY IF EXISTS "Users access own transactions" ON transactions;

-- 4. ENABLE STRICT ROW LEVEL SECURITY POLICIES
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own accounts" ON accounts 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own monthly_balances" ON monthly_balances 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own categories" ON categories 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own transactions" ON transactions 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. AUTOMATIC ONBOARDING TRIGGER FOR NEW REGISTRATIONS
-- Whenever a new user verifies and registers, auto-seed default categories & a starter account
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
    -- Seed default categories for this user
    INSERT INTO public.categories (name, type, icon, color, user_id) VALUES
        ('Salary', 'INCOME', 'Briefcase', '#10B981', NEW.id),
        ('Freelance & Consulting', 'INCOME', 'Laptop', '#059669', NEW.id),
        ('Investments & Dividends', 'INCOME', 'TrendingUp', '#34D399', NEW.id),
        ('Refund & Cashback', 'INCOME', 'RotateCcw', '#6EE7B7', NEW.id),
        ('Other Income', 'INCOME', 'PlusCircle', '#A7F3D0', NEW.id),
        ('Food & Dining', 'EXPENSE', 'Utensils', '#EF4444', NEW.id),
        ('Groceries', 'EXPENSE', 'ShoppingCart', '#F97316', NEW.id),
        ('Rent & Housing', 'EXPENSE', 'Home', '#8B5CF6', NEW.id),
        ('Bills & Utilities', 'EXPENSE', 'Zap', '#F59E0B', NEW.id),
        ('Transport & Fuel', 'EXPENSE', 'Car', '#3B82F6', NEW.id),
        ('Shopping & Clothing', 'EXPENSE', 'ShoppingBag', '#EC4899', NEW.id),
        ('Health & Medical', 'EXPENSE', 'HeartPulse', '#14B8A6', NEW.id),
        ('Entertainment & OTT', 'EXPENSE', 'Film', '#6366F1', NEW.id),
        ('General / Miscellaneous', 'EXPENSE', 'HelpCircle', '#64748B', NEW.id);

    -- Seed primary bank account
    INSERT INTO public.accounts (name, type, currency, color, initial_balance, user_id) VALUES
        ('Primary Bank Account', 'Checking', 'INR', '#3B82F6', 0.00, NEW.id),
        ('Cash Wallet', 'Cash', 'INR', '#10B981', 0.00, NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- =========================================================
-- 6. ONE-TIME MIGRATION TO CLAIM YOUR EXISTING DATA
-- Replace 'YOUR_REGISTERED_EMAIL@HERE.COM' with the email you signed up with
-- =========================================================
-- DO NOT RUN UNTIL YOU HAVE REGISTERED YOUR ACCOUNT VIA THE APP:
/*
UPDATE accounts 
SET user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_REGISTERED_EMAIL@HERE.COM' LIMIT 1) 
WHERE user_id IS NULL;

UPDATE monthly_balances 
SET user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_REGISTERED_EMAIL@HERE.COM' LIMIT 1) 
WHERE user_id IS NULL;

UPDATE categories 
SET user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_REGISTERED_EMAIL@HERE.COM' LIMIT 1) 
WHERE user_id IS NULL;

UPDATE transactions 
SET user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_REGISTERED_EMAIL@HERE.COM' LIMIT 1) 
WHERE user_id IS NULL;
*/
