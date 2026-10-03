import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinPulse - Personal Expense, Bank Balance & Inflow Ledger',
  description: 'Fast, lag-free daily expense and income tracker with bank opening balances and Supabase sync.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} min-h-full bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
