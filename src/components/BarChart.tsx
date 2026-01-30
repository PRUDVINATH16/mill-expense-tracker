import React from 'react';
import { ChartData } from '@/types/money';

interface BarChartProps {
  data: ChartData[];
}

export function BarChart({ data }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(
    ...data.flatMap(d => [d.income, d.expense]),
    1 // Minimum to avoid division by zero
  );

  return (
    <div className="h-64 flex items-end justify-around gap-2 px-2">
      {data.map((item, index) => {
        const incomeHeight = (item.income / maxValue) * 100;
        const expenseHeight = (item.expense / maxValue) * 100;

        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            {/* Bars container */}
            <div className="flex gap-1 items-end h-48 w-full justify-center">
              {/* Income bar */}
              <div className="flex-1 max-w-6 flex flex-col justify-end">
                <div
                  className="chart-bar bg-income w-full"
                  style={{ 
                    height: `${Math.max(incomeHeight, item.income > 0 ? 2 : 0)}%`,
                    minHeight: item.income > 0 ? '4px' : '0'
                  }}
                  title={`Income: ₹${item.income.toLocaleString('en-IN')}`}
                />
              </div>
              {/* Expense bar */}
              <div className="flex-1 max-w-6 flex flex-col justify-end">
                <div
                  className="chart-bar bg-expense w-full"
                  style={{ 
                    height: `${Math.max(expenseHeight, item.expense > 0 ? 2 : 0)}%`,
                    minHeight: item.expense > 0 ? '4px' : '0'
                  }}
                  title={`Expense: ₹${item.expense.toLocaleString('en-IN')}`}
                />
              </div>
            </div>
            {/* Label */}
            <span className="text-xs text-muted-foreground font-medium">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
