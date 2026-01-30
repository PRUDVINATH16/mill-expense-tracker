// Types for the money management app

export type EntryType = 'income' | 'expense';

export interface MoneyEntry {
  id: string;
  amount: number;
  note: string;
  type: EntryType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  createdAt: number; // timestamp for sorting
}

export interface DailyTotals {
  income: number;
  expense: number;
  balance: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type StatsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'total';

export interface ChartData {
  label: string;
  income: number;
  expense: number;
}
