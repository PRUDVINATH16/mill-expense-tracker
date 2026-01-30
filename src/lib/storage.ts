import { MoneyEntry, EntryType, DailyTotals, DateRange, ChartData, StatsPeriod } from '@/types/money';
import { syncToGoogleSheets, fetchFromGoogleSheets, isGoogleSheetsConfigured, deleteFromGoogleSheets } from './googleSheets';

const STORAGE_KEY = 'chitti_money_entries';
const PIN_KEY = 'chitti_pin';

// Store the PIN for API calls
export function storePin(pin: string): void {
  sessionStorage.setItem(PIN_KEY, pin);
}

export function getStoredPin(): string {
  return sessionStorage.getItem(PIN_KEY) || '9494';
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get current date in YYYY-MM-DD format, timezone-safe
export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get current time in HH:MM:SS format
export function getCurrentTime(): string {
  return new Date().toTimeString().split(' ')[0];
}

// Local storage helpers (used as cache)
function getLocalEntries(): MoneyEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(entries: MoneyEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Fetch all entries from Google Sheets (primary source)
export async function fetchEntries(): Promise<MoneyEntry[]> {
  if (isGoogleSheetsConfigured()) {
    const pin = getStoredPin();
    const entries = await fetchFromGoogleSheets(pin);
    if (entries !== null) {
      // Cache locally
      saveLocalEntries(entries);
      return entries;
    }
  }
  // Fallback to local storage
  return getLocalEntries();
}

// Load entries synchronously from cache (for initial render)
export function loadEntries(): MoneyEntry[] {
  return getLocalEntries();
}

// Add a new entry (syncs to Google Sheets)
export async function addEntry(amount: number, note: string, type: EntryType): Promise<MoneyEntry> {
  const newEntry: MoneyEntry = {
    id: generateId(),
    amount: Math.abs(amount),
    note,
    type,
    date: getCurrentDate(),
    time: getCurrentTime(),
    createdAt: Date.now(),
  };
  
  // Save locally first for immediate feedback
  const entries = getLocalEntries();
  entries.push(newEntry);
  saveLocalEntries(entries);
  
  // Sync to Google Sheets
  if (isGoogleSheetsConfigured()) {
    const pin = getStoredPin();
    await syncToGoogleSheets(newEntry, pin);
  }
  
  return newEntry;
}

// Delete an entry (local and Google Sheets)
export async function deleteEntry(id: string): Promise<void> {
  // Delete locally first for instant UI update
  const entries = getLocalEntries().filter(e => e.id !== id);
  saveLocalEntries(entries);

  // Sync deletion to Google Sheets
  if (isGoogleSheetsConfigured()) {
    const pin = getStoredPin();
    await deleteFromGoogleSheets(id, pin);
  }
}

// Get entries for a specific date
export function getEntriesForDate(date: string): MoneyEntry[] {
  return loadEntries().filter(e => e.date === date);
}

// Get entries for a date range
export function getEntriesForRange(range: DateRange): MoneyEntry[] {
  const startStr = range.start.toISOString().split('T')[0];
  const endStr = range.end.toISOString().split('T')[0];
  return loadEntries().filter(e => e.date >= startStr && e.date <= endStr);
}

// Calculate totals for entries
export function calculateTotals(entries: MoneyEntry[]): DailyTotals {
  const income = entries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const expense = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}

// Get today's totals
export function getTodayTotals(): DailyTotals {
  const today = getCurrentDate();
  const entries = getEntriesForDate(today);
  return calculateTotals(entries);
}

// Get totals for a date range
export function getRangeTotals(range: DateRange): DailyTotals {
  const entries = getEntriesForRange(range);
  return calculateTotals(entries);
}

// Get all-time totals
export function getAllTimeTotals(): DailyTotals {
  const entries = loadEntries();
  return calculateTotals(entries);
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Get start of week (Monday)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get start of month
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Get start of year
function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

// Get chart data for a period
export function getChartData(period: StatsPeriod, referenceDate: Date = new Date()): ChartData[] {
  const entries = loadEntries();
  
  switch (period) {
    case 'daily': {
      // Last 7 days
      const data: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(referenceDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayEntries = entries.filter(e => e.date === dateStr);
        const totals = calculateTotals(dayEntries);
        data.push({
          label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
          income: totals.income,
          expense: totals.expense,
        });
      }
      return data;
    }
    
    case 'weekly': {
      // Last 4 weeks
      const data: ChartData[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = getStartOfWeek(new Date(referenceDate));
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekEntries = getEntriesForRange({ start: weekStart, end: weekEnd });
        const totals = calculateTotals(weekEntries);
        data.push({
          label: `W${4 - i}`,
          income: totals.income,
          expense: totals.expense,
        });
      }
      return data;
    }
    
    case 'monthly': {
      // Last 6 months
      const data: ChartData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
        const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i + 1, 0);
        
        const monthEntries = getEntriesForRange({ start: monthStart, end: monthEnd });
        const totals = calculateTotals(monthEntries);
        data.push({
          label: monthStart.toLocaleDateString('en-IN', { month: 'short' }),
          income: totals.income,
          expense: totals.expense,
        });
      }
      return data;
    }
    
    case 'yearly': {
      // Last 3 years
      const data: ChartData[] = [];
      for (let i = 2; i >= 0; i--) {
        const yearStart = new Date(referenceDate.getFullYear() - i, 0, 1);
        const yearEnd = new Date(referenceDate.getFullYear() - i, 11, 31);
        
        const yearEntries = getEntriesForRange({ start: yearStart, end: yearEnd });
        const totals = calculateTotals(yearEntries);
        data.push({
          label: yearStart.getFullYear().toString(),
          income: totals.income,
          expense: totals.expense,
        });
      }
      return data;
    }
    
    case 'total': {
      // All time as single bar
      const totals = calculateTotals(entries);
      return [{
        label: 'All Time',
        income: totals.income,
        expense: totals.expense,
      }];
    }
  }
}

// Get period totals for stats
export function getPeriodTotals(period: StatsPeriod, referenceDate: Date = new Date()): DailyTotals {
  const entries = loadEntries();
  
  switch (period) {
    case 'daily': {
      const dateStr = referenceDate.toISOString().split('T')[0];
      return calculateTotals(entries.filter(e => e.date === dateStr));
    }
    
    case 'weekly': {
      const weekStart = getStartOfWeek(referenceDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return calculateTotals(getEntriesForRange({ start: weekStart, end: weekEnd }));
    }
    
    case 'monthly': {
      const monthStart = getStartOfMonth(referenceDate);
      const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      return calculateTotals(getEntriesForRange({ start: monthStart, end: monthEnd }));
    }
    
    case 'yearly': {
      const yearStart = getStartOfYear(referenceDate);
      const yearEnd = new Date(referenceDate.getFullYear(), 11, 31);
      return calculateTotals(getEntriesForRange({ start: yearStart, end: yearEnd }));
    }
    
    case 'total': {
      return calculateTotals(entries);
    }
  }
}
