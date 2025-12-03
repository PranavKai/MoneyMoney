'use client';

import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { SpendingSummary } from '@/types';

export default function BudgetOverview() {
  const { state, getSpendingByCategory } = useExpense();

  const summaries: SpendingSummary[] = useMemo(() => {
    const spending = getSpendingByCategory();
    return state.categories.map((cat) => {
      const spent = spending.get(cat.id) || 0;
      const remaining = cat.limit - spent;
      const percentage = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        limit: cat.limit,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > cat.limit,
      };
    });
  }, [state.categories, getSpendingByCategory]);

  const totalBudget = state.categories.reduce((sum, c) => sum + c.limit, 0);
  const totalSpent = summaries.reduce((sum, s) => sum + s.spent, 0);
  const overBudgetCategories = summaries.filter((s) => s.isOverBudget);

  const getCategoryColor = (categoryId: string) => {
    return state.categories.find((c) => c.id === categoryId)?.color || '#6b7280';
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-semibold">Budget Alert!</p>
              <p className="text-red-300 text-sm">
                You&apos;ve exceeded your budget in{' '}
                {overBudgetCategories.map((c) => c.categoryName).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total Overview */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Overview</h3>

        {/* Income Summary */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-4 border border-blue-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300">Monthly Income</span>
            <span className="text-xl font-bold text-blue-400">
              ¥{state.monthlyIncome.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Remaining from Income</span>
            <span className={`text-lg font-bold ${state.monthlyIncome - totalSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ¥{(state.monthlyIncome - totalSpent).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Budget</p>
            <p className="text-2xl font-bold text-white">
              ¥{totalBudget.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Spent</p>
            <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              ¥{totalSpent.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Overall Progress</span>
            <span className={totalSpent > totalBudget ? 'text-red-400' : 'text-emerald-400'}>
              {((totalSpent / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalSpent > totalBudget
                  ? 'bg-gradient-to-r from-red-500 to-red-400'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-slate-500">¥0</span>
            <span className="text-slate-500">¥{totalBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <h4 className="text-white font-medium mb-3">By Category</h4>
        <div className="space-y-3">
          {summaries.map((summary) => (
            <div key={summary.categoryId} className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(summary.categoryId) }}
                  />
                  <span className="text-white font-medium">{summary.categoryName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {summary.isOverBudget ? (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  ) : summary.percentage > 80 ? (
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      summary.isOverBudget
                        ? 'text-red-400'
                        : summary.percentage > 80
                        ? 'text-yellow-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {summary.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(summary.percentage, 100)}%`,
                    backgroundColor: summary.isOverBudget
                      ? '#ef4444'
                      : getCategoryColor(summary.categoryId),
                  }}
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                  ¥{summary.spent.toLocaleString()} / ¥{summary.limit.toLocaleString()}
                </span>
                <span
                  className={
                    summary.remaining < 0 ? 'text-red-400' : 'text-slate-400'
                  }
                >
                  {summary.remaining < 0
                    ? `Over by ¥${Math.abs(summary.remaining).toLocaleString()}`
                    : `¥${summary.remaining.toLocaleString()} left`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
