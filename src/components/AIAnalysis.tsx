'use client';

import { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Sparkles, Loader2, Calendar, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';

interface AnalysisResult {
  analysis: string;
  summary: {
    totalSpent: number;
    totalBudget: number;
    categoryTotals: Record<string, number>;
    budgetStatus: Array<{
      category: string;
      spent: number;
      limit: number;
      percentage: string;
      status: string;
    }>;
    period: {
      startDate: string;
      endDate: string;
    };
  };
}

type PeriodType = 'thisMonth' | 'lastMonth' | 'last3Months' | 'custom';

export default function AIAnalysis() {
  const { state } = useExpense();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const getDateRange = (): { start: string; end: string } => {
    const today = new Date();

    switch (periodType) {
      case 'thisMonth':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        };
      case 'last3Months':
        return {
          start: format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          start: customStart,
          end: customEnd,
        };
      default:
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
    }
  };

  const handleAnalyze = async () => {
    const { start, end } = getDateRange();

    if (!start || !end) {
      setError('Please select a valid date range');
      return;
    }

    // Filter expenses for the selected period
    const filteredExpenses = state.expenses.filter(
      (e) => e.date >= start && e.date <= end
    );

    if (filteredExpenses.length === 0) {
      setError('No expenses found in the selected period');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expenses: filteredExpenses,
          categories: state.categories,
          startDate: start,
          endDate: end,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze expenses');
      }

      const data = await response.json();
      setResult(data);
      setIsExpanded(true); // Auto-expand when results come in
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      {/* Header - Always visible, clickable on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 md:p-6 flex items-center justify-between md:cursor-default"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">AI Spending Analysis</h3>
        </div>
        {/* Chevron - Mobile only */}
        <div className="md:hidden">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content - Collapsible on mobile, always visible on desktop */}
      <div className={`px-4 pb-4 md:px-6 md:pb-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Period Selection */}
        <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Select Time Period
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { value: 'thisMonth', label: 'This Month' },
            { value: 'lastMonth', label: 'Last Month' },
            { value: 'last3Months', label: '3 Months' },
            { value: 'custom', label: 'Custom' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriodType(option.value as PeriodType)}
              className={`
                py-2 px-3 md:px-4 rounded-lg border transition-all text-sm
                ${
                  periodType === option.value
                    ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                    : 'border-white/10 text-slate-400 hover:border-white/30'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {periodType === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-white/10 rounded-lg px-3 py-2 text-white border border-white/10 focus:outline-none focus:border-purple-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-white/10 rounded-lg px-3 py-2 text-white border border-white/10 focus:outline-none focus:border-purple-400 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={isLoading}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Analyze My Spending
          </>
        )}
      </button>

      {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Period
                </div>
                <p className="text-white text-xs md:text-sm">
                  {result.summary.period.startDate} to {result.summary.period.endDate}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Total Spent
                </div>
                <p className="text-white font-semibold text-sm md:text-base">
                  ¥{result.summary.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
              <h4 className="text-purple-300 font-medium mb-3 flex items-center gap-2 text-sm md:text-base">
                <Sparkles className="w-4 h-4" />
                AI Insights
              </h4>
              <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                {result.analysis}
              </div>
            </div>

            {/* Budget Status */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-white font-medium mb-3 text-sm md:text-base">Budget Status</h4>
              <div className="space-y-2">
                {result.summary.budgetStatus.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-400 truncate mr-2">{item.category}</span>
                    <span
                      className={`
                        px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0
                        ${
                          item.status === 'OVER BUDGET'
                            ? 'bg-red-500/20 text-red-400'
                            : item.status === 'WARNING'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }
                      `}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
