import React, { useState, useEffect, useCallback } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { ThemeToggle } from './ThemeToggle';
import { 
  getTodayTotals, 
  getRangeTotals, 
  addEntry, 
  formatDate,
  loadEntries,
  deleteEntry,
  getCurrentDate,
  fetchEntries
} from '@/lib/storage';
import { DailyTotals, DateRange, MoneyEntry } from '@/types/money';
import { Calendar, Trash2, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HomeScreenProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

export function HomeScreen({ isDark, onThemeToggle }: HomeScreenProps) {
  const { logout } = useAuth();
  const [totals, setTotals] = useState<DailyTotals>({ income: 0, expense: 0, balance: 0 });
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [recentEntries, setRecentEntries] = useState<MoneyEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshData = useCallback(() => {
    if (dateRange) {
      setTotals(getRangeTotals(dateRange));
    } else {
      setTotals(getTodayTotals());
    }
    // Get today's entries for display
    const allEntries = loadEntries();
    const today = getCurrentDate();
    const todayEntries = allEntries
      .filter(e => e.date === today)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
    setRecentEntries(todayEntries);
  }, [dateRange]);

  const syncFromSheets = useCallback(async () => {
    setIsSyncing(true);
    try {
      await fetchEntries();
      refreshData();
    } finally {
      setIsSyncing(false);
    }
  }, [refreshData]);

  useEffect(() => {
    // Initial fetch from Google Sheets
    syncFromSheets();
  }, [syncFromSheets]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSubmit = async (type: 'income' | 'expense') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await addEntry(numAmount, note || 'No note', type);
      setAmount('');
      setNote('');
      refreshData();
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    refreshData();
  };

  const handleDateRangeChange = (start: string, end: string) => {
    if (start && end) {
      setDateRange({
        start: new Date(start),
        end: new Date(end),
      });
    }
    setShowDatePicker(false);
  };

  const clearDateRange = () => {
    setDateRange(null);
    setShowDatePicker(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
            <div className="flex items-center gap-2">
              <button
                onClick={syncFromSheets}
                disabled={isSyncing}
                className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors disabled:opacity-50"
                aria-label="Sync data"
              >
                <RefreshCw className={`w-5 h-5 text-foreground ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">
            Chitti's Pindi Jinnu Business
          </h1>
          {isSyncing && (
            <p className="text-xs text-center text-muted-foreground mt-1">Syncing with Google Sheets...</p>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Date Filter */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {dateRange ? (
              <span>
                {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
              </span>
            ) : (
              <span>Today's Summary</span>
            )}
          </div>
          <div className="flex gap-2">
            {dateRange && (
              <button
                onClick={clearDateRange}
                className="text-sm text-expense font-medium"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Picker */}
        {showDatePicker && (
          <div className="bg-card rounded-xl p-4 border border-border animate-scale-in">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  id="start-date"
                  className="w-full p-3 rounded-lg bg-background border border-border text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  id="end-date"
                  className="w-full p-3 rounded-lg bg-background border border-border text-foreground"
                />
              </div>
              <button
                onClick={() => {
                  const start = (document.getElementById('start-date') as HTMLInputElement).value;
                  const end = (document.getElementById('end-date') as HTMLInputElement).value;
                  handleDateRangeChange(start, end);
                }}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold"
              >
                Apply Range
              </button>
            </div>
          </div>
        )}

        {/* Totals Cards */}
        <div className="grid grid-cols-1 gap-4 animate-slide-up">
          {/* Income Card */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Total Income</p>
            <AnimatedNumber
              value={totals.income}
              prefix="₹"
              className="text-3xl md:text-4xl font-bold text-income"
            />
          </div>

          {/* Expense Card */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Total Expenditure</p>
            <AnimatedNumber
              value={totals.expense}
              prefix="₹"
              className="text-3xl md:text-4xl font-bold text-expense"
            />
          </div>

          {/* Balance Card */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Final Balance</p>
            <AnimatedNumber
              value={totals.balance}
              prefix="₹"
              className={`text-3xl md:text-4xl font-bold ${
                totals.balance >= 0 ? 'text-income' : 'text-expense'
              }`}
            />
          </div>
        </div>

        {/* Entry Form */}
        <div className="bg-card rounded-xl p-5 border border-border space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-bold">Add Entry</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full p-4 text-xl rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              className="w-full p-4 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleSubmit('income')}
              disabled={!amount || isSubmitting}
              className="btn-brutalist btn-income disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Add as Income'}
            </button>
            <button
              onClick={() => handleSubmit('expense')}
              disabled={!amount || isSubmitting}
              className="btn-brutalist btn-expense disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Add as Expense'}
            </button>
          </div>
        </div>

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-bold mb-3">Today's Entries</h2>
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-card rounded-lg p-4 border border-border flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className={`text-lg font-bold ${
                      entry.type === 'income' ? 'text-income' : 'text-expense'
                    }`}>
                      {entry.type === 'income' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.note}</p>
                    <p className="text-xs text-muted-foreground">{entry.time}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-muted-foreground hover:text-expense transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
