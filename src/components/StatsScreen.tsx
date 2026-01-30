import React, { useState, useEffect } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { BarChart } from './BarChart';
import { ThemeToggle } from './ThemeToggle';
import { getPeriodTotals, getChartData } from '@/lib/storage';
import { DailyTotals, StatsPeriod, ChartData } from '@/types/money';

interface StatsScreenProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

const periods: { key: StatsPeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'total', label: 'Total' },
];

export function StatsScreen({ isDark, onThemeToggle }: StatsScreenProps) {
  const [activePeriod, setActivePeriod] = useState<StatsPeriod>('daily');
  const [totals, setTotals] = useState<DailyTotals>({ income: 0, expense: 0, balance: 0 });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const refDate = new Date(selectedDate);
    setTotals(getPeriodTotals(activePeriod, refDate));
    setChartData(getChartData(activePeriod, refDate));
  }, [activePeriod, selectedDate]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
            <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
          </div>

          {/* Period Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {periods.map((period) => (
              <button
                key={period.key}
                onClick={() => setActivePeriod(period.key)}
                className={`stats-tab whitespace-nowrap ${
                  activePeriod === period.key ? 'active' : ''
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Date Picker */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <label className="block text-sm font-medium mb-2">Reference Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 rounded-lg bg-background border border-border text-foreground"
          />
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-1 gap-4 animate-fade-in">
          {/* Income Card */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">
              {activePeriod === 'total' ? 'All Time' : getPeriodLabel(activePeriod)} Income
            </p>
            <AnimatedNumber
              value={totals.income}
              prefix="₹"
              className="text-3xl md:text-4xl font-bold text-income"
            />
          </div>

          {/* Expense Card */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">
              {activePeriod === 'total' ? 'All Time' : getPeriodLabel(activePeriod)} Expenditure
            </p>
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

        {/* Chart */}
        <div className="bg-card rounded-xl p-5 border border-border animate-slide-up">
          <h2 className="text-lg font-bold mb-4">Income vs Expense</h2>
          
          {/* Legend */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-income" />
              <span className="text-sm text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-expense" />
              <span className="text-sm text-muted-foreground">Expense</span>
            </div>
          </div>

          <BarChart data={chartData} />
        </div>
      </main>
    </div>
  );
}

function getPeriodLabel(period: StatsPeriod): string {
  switch (period) {
    case 'daily':
      return "Today's";
    case 'weekly':
      return "This Week's";
    case 'monthly':
      return "This Month's";
    case 'yearly':
      return "This Year's";
    default:
      return '';
  }
}
