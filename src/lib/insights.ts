import { Transaction, Category, PaymentMode } from '@/types';
import { formatCurrency } from './utils';

export interface WeekendInsight {
  currentWeekendSpend: number;
  prevMonthWeekendAvg: number;
  diffAmount: number;
  diffPercent: number;
  isLess: boolean;
  message: string;
  weekendTxCount: number;
}

export interface CategoryMoMComparison {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  currentAmount: number;
  prevAmount: number;
  diffAmount: number;
  diffPercent: number;
}

export interface DayOfWeekBreakdown {
  dayName: string; // 'Mon', 'Tue', etc.
  dayIndex: number; // 0=Sun, 1=Mon...
  totalAmount: number;
  txCount: number;
  avgPerDay: number;
}

export interface MonthOverMonthVelocity {
  currentSpentToDate: number;
  prevMonthSpentToDate: number;
  diffPercent: number;
  projectedTotalMonth: number;
  prevMonthTotal: number;
}

export interface PaymentModeBreakdown {
  mode: PaymentMode | 'Other';
  total: number;
  count: number;
  percentage: number;
}

export interface DailySpendPoint {
  day: number;
  dateStr: string;
  expense: number;
  income: number;
  isWeekend: boolean;
  dayName: string;
}

export interface SmartInsightsResult {
  weekendInsight: WeekendInsight;
  momVelocity: MonthOverMonthVelocity;
  topCategorySurge: CategoryMoMComparison | null;
  categoryComparisons: CategoryMoMComparison[];
  dayOfWeekBreakdown: DayOfWeekBreakdown[];
  weekdayAvgSpend: number;
  weekendAvgSpend: number;
  peakSpendDay: { date: string; amount: number; note: string } | null;
  paymentModeBreakdown: PaymentModeBreakdown[];
  dailySpendTrend: DailySpendPoint[];
}

/**
 * Computes deep UPI-app style spending insights and comparisons
 */
export function computeSmartInsights(
  transactions: Transaction[],
  categories: Category[],
  currentMonthStr: string // e.g. '2026-10'
): SmartInsightsResult {
  const [yearStr, monthStr] = currentMonthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Compute previous month string
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
  const prevMonthStr = `${prevYear}-${prevMonthNum}`;

  // Filter expenses
  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  const prevMonthTx = transactions.filter((t) => t.date.startsWith(prevMonthStr));

  const currentExpenses = currentMonthTx.filter((t) => t.type === 'EXPENSE');
  const prevExpenses = prevMonthTx.filter((t) => t.type === 'EXPENSE');

  // --- 1. Weekend vs Last Month Weekend Analysis ---
  // A day is a weekend if day of week is Saturday (6) or Sunday (0)
  const isWeekend = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const currentWeekendTx = currentExpenses.filter((t) => isWeekend(t.date));
  const currentWeekendSpend = currentWeekendTx.reduce((sum, t) => sum + Number(t.amount), 0);

  // Group previous month expenses by weekends
  const prevWeekendTx = prevExpenses.filter((t) => isWeekend(t.date));
  
  // Count how many weekend days have elapsed in previous month to get daily average, or count total weekends
  const prevWeekendTotalSpend = prevWeekendTx.reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Find distinct weekend dates in prev month to compute weekend average
  const prevWeekendDates = Array.from(new Set(prevWeekendTx.map((t) => t.date)));
  const prevWeekendCount = Math.max(1, Math.ceil(prevWeekendDates.length / 2)); // count of weekend blocks
  const prevMonthWeekendAvg = prevWeekendCount > 0 ? prevWeekendTotalSpend / prevWeekendCount : prevWeekendTotalSpend;

  const diffAmount = currentWeekendSpend - prevMonthWeekendAvg;
  const diffPercent = prevMonthWeekendAvg > 0 
    ? Math.round((Math.abs(diffAmount) / prevMonthWeekendAvg) * 100)
    : 0;

  const isLess = currentWeekendSpend <= prevMonthWeekendAvg;

  let weekendMsg = '';
  if (currentWeekendSpend === 0) {
    weekendMsg = `No weekend expenses recorded yet for ${currentMonthStr}.`;
  } else if (isLess) {
    weekendMsg = `🎉 Great control! You spent ${diffPercent}% LESS on weekends this month compared to last month's weekend average.`;
  } else {
    weekendMsg = `⚠️ Weekend Spike: You spent ${diffPercent}% MORE on weekends than last month's average.`;
  }

  const weekendInsight: WeekendInsight = {
    currentWeekendSpend,
    prevMonthWeekendAvg,
    diffAmount,
    diffPercent,
    isLess,
    message: weekendMsg,
    weekendTxCount: currentWeekendTx.length,
  };

  // --- 2. Month-over-Month Velocity up to current day ---
  const today = new Date();
  const currentDayNum = today.getDate();

  const currentSpentToDate = currentExpenses
    .filter((t) => {
      const day = parseInt(t.date.split('-')[2], 10);
      return day <= currentDayNum;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const prevMonthSpentToDate = prevExpenses
    .filter((t) => {
      const day = parseInt(t.date.split('-')[2], 10);
      return day <= currentDayNum;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const velDiff = currentSpentToDate - prevMonthSpentToDate;
  const velDiffPercent = prevMonthSpentToDate > 0
    ? Math.round((velDiff / prevMonthSpentToDate) * 100)
    : 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(prevYear, parseInt(prevMonthNum, 10), 0).getDate();
  const projectedTotalMonth = currentDayNum > 0 ? (currentSpentToDate / currentDayNum) * daysInMonth : 0;
  const prevMonthTotal = prevExpenses.reduce((sum, t) => sum + Number(t.amount), 0);

  const momVelocity: MonthOverMonthVelocity = {
    currentSpentToDate,
    prevMonthSpentToDate,
    diffPercent: velDiffPercent,
    projectedTotalMonth,
    prevMonthTotal,
  };

  // --- 3. Category MoM Comparison & Surge ---
  const catMap = new Map<string, { name: string; color: string }>();
  categories.forEach((c) => catMap.set(c.id, { name: c.name, color: c.color }));

  const currentCatSpend = new Map<string, number>();
  currentExpenses.forEach((t) => {
    const cid = t.category_id || 'uncategorized';
    currentCatSpend.set(cid, (currentCatSpend.get(cid) || 0) + Number(t.amount));
  });

  const prevCatSpend = new Map<string, number>();
  prevExpenses.forEach((t) => {
    const cid = t.category_id || 'uncategorized';
    prevCatSpend.set(cid, (prevCatSpend.get(cid) || 0) + Number(t.amount));
  });

  const allCatIds = Array.from(new Set([...Array.from(currentCatSpend.keys()), ...Array.from(prevCatSpend.keys())]));

  const categoryComparisons: CategoryMoMComparison[] = allCatIds
    .map((cid) => {
      const curr = currentCatSpend.get(cid) || 0;
      const prev = prevCatSpend.get(cid) || 0;
      const catInfo = catMap.get(cid) || { name: 'Uncategorized', color: '#94A3B8' };
      const diff = curr - prev;
      const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

      return {
        categoryId: cid,
        categoryName: catInfo.name,
        categoryColor: catInfo.color,
        currentAmount: curr,
        prevAmount: prev,
        diffAmount: diff,
        diffPercent: pct,
      };
    })
    .filter((c) => c.currentAmount > 0 || c.prevAmount > 0)
    .sort((a, b) => b.currentAmount - a.currentAmount);

  const topCategorySurge = [...categoryComparisons]
    .filter((c) => c.diffAmount > 0)
    .sort((a, b) => b.diffAmount - a.diffAmount)[0] || null;

  // --- 4. Day of Week Breakdown & Weekday vs Weekend ---
  const daysOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeekMap = daysOfWeekNames.map((name, index) => ({
    dayName: name,
    dayIndex: index,
    totalAmount: 0,
    txCount: 0,
    datesSet: new Set<string>(),
  }));

  let totalWeekdaySpend = 0;
  let weekdayDaysCount = 0;
  let totalWeekendSpend = 0;
  let weekendDaysCount = 0;

  const weekdayDates = new Set<string>();
  const weekendDates = new Set<string>();

  currentExpenses.forEach((t) => {
    const d = new Date(t.date + 'T00:00:00');
    const dayIdx = d.getDay();
    const amt = Number(t.amount);

    dayOfWeekMap[dayIdx].totalAmount += amt;
    dayOfWeekMap[dayIdx].txCount += 1;
    dayOfWeekMap[dayIdx].datesSet.add(t.date);

    if (dayIdx === 0 || dayIdx === 6) {
      totalWeekendSpend += amt;
      weekendDates.add(t.date);
    } else {
      totalWeekdaySpend += amt;
      weekdayDates.add(t.date);
    }
  });

  weekdayDaysCount = Math.max(1, weekdayDates.size);
  weekendDaysCount = Math.max(1, weekendDates.size);

  const weekdayAvgSpend = Math.round(totalWeekdaySpend / weekdayDaysCount);
  const weekendAvgSpend = Math.round(totalWeekendSpend / weekendDaysCount);

  const dayOfWeekBreakdown: DayOfWeekBreakdown[] = dayOfWeekMap.map((item) => ({
    dayName: item.dayName,
    dayIndex: item.dayIndex,
    totalAmount: item.totalAmount,
    txCount: item.txCount,
    avgPerDay: item.datesSet.size > 0 ? Math.round(item.totalAmount / item.datesSet.size) : 0,
  }));

  // --- 5. Peak Spend Day ---
  const dailyTotalMap = new Map<string, { total: number; note: string }>();
  currentExpenses.forEach((t) => {
    const existing = dailyTotalMap.get(t.date) || { total: 0, note: t.note || '' };
    const newTotal = existing.total + Number(t.amount);
    dailyTotalMap.set(t.date, {
      total: newTotal,
      note: newTotal > existing.total ? t.note || existing.note : existing.note,
    });
  });

  let peakSpendDay: { date: string; amount: number; note: string } | null = null;
  dailyTotalMap.forEach((val, dateStr) => {
    if (!peakSpendDay || val.total > peakSpendDay.amount) {
      peakSpendDay = { date: dateStr, amount: val.total, note: val.note };
    }
  });

  // --- 6. Payment Mode Breakdown ---
  const modeMap = new Map<string, { total: number; count: number }>();
  currentExpenses.forEach((t) => {
    const mode = t.payment_mode || 'UPI';
    const existing = modeMap.get(mode) || { total: 0, count: 0 };
    modeMap.set(mode, {
      total: existing.total + Number(t.amount),
      count: existing.count + 1,
    });
  });

  const totalExpenseSum = currentExpenses.reduce((sum, t) => sum + Number(t.amount), 0) || 1;
  const paymentModeBreakdown: PaymentModeBreakdown[] = Array.from(modeMap.entries())
    .map(([mode, data]) => ({
      mode: mode as PaymentMode,
      total: data.total,
      count: data.count,
      percentage: Math.round((data.total / totalExpenseSum) * 100),
    }))
    .sort((a, b) => b.total - a.total);

  // --- 7. Daily Spend Trend (1 to 31) ---
  const dailySpendTrend: DailySpendPoint[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayFormatted = String(d).padStart(2, '0');
    const dateStr = `${currentMonthStr}-${dayFormatted}`;
    const dt = new Date(dateStr + 'T00:00:00');
    const isWknd = dt.getDay() === 0 || dt.getDay() === 6;
    const dayName = daysOfWeekNames[dt.getDay()];

    const dayTx = currentMonthTx.filter((t) => t.date === dateStr);
    const expense = dayTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    const income = dayTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);

    dailySpendTrend.push({
      day: d,
      dateStr,
      expense,
      income,
      isWeekend: isWknd,
      dayName,
    });
  }

  return {
    weekendInsight,
    momVelocity,
    topCategorySurge,
    categoryComparisons,
    dayOfWeekBreakdown,
    weekdayAvgSpend,
    weekendAvgSpend,
    peakSpendDay,
    paymentModeBreakdown,
    dailySpendTrend,
  };
}
