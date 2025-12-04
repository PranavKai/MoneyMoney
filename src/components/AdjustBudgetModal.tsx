'use client';

import { useState, useMemo } from 'react';
import { X, ArrowRight, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { SpendingSummary } from '@/types';

interface AdjustBudgetModalProps {
  overBudgetCategory: SpendingSummary;
  onClose: () => void;
}

export default function AdjustBudgetModal({ overBudgetCategory, onClose }: AdjustBudgetModalProps) {
  const { state, updateCategories, getSpendingByCategory } = useExpense();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');

  const amountNeeded = Math.abs(overBudgetCategory.remaining);

  // Get non-essential categories that have remaining budget
  const availableSources = useMemo(() => {
    const spending = getSpendingByCategory();
    return state.categories
      .filter((cat) => {
        // Exclude the over-budget category itself
        if (cat.id === overBudgetCategory.categoryId) return false;
        // Exclude essential categories
        if (cat.isEssential) return false;
        // Only include categories with remaining budget
        const spent = spending.get(cat.id) || 0;
        const remaining = cat.limit - spent;
        return remaining > 0;
      })
      .map((cat) => {
        const spent = spending.get(cat.id) || 0;
        const remaining = cat.limit - spent;
        return {
          ...cat,
          spent,
          remaining,
        };
      });
  }, [state.categories, getSpendingByCategory, overBudgetCategory.categoryId]);

  const selectedSource = availableSources.find((s) => s.id === selectedSourceId);
  const canTransfer = selectedSource && selectedSource.remaining >= amountNeeded;
  const transferAmount = selectedSource ? Math.min(amountNeeded, selectedSource.remaining) : 0;

  const handleAdjust = async () => {
    if (!selectedSource) return;

    setIsSubmitting(true);
    try {
      // Create updated categories with adjusted limits
      const updatedCategories = state.categories.map((cat) => {
        if (cat.id === overBudgetCategory.categoryId) {
          // Increase the over-budget category's limit
          return { ...cat, limit: cat.limit + transferAmount };
        }
        if (cat.id === selectedSourceId) {
          // Decrease the source category's limit
          return { ...cat, limit: cat.limit - transferAmount };
        }
        return cat;
      });

      await updateCategories(updatedCategories);
      onClose();
    } catch (error) {
      console.error('Failed to adjust budget:', error);
      alert('Failed to adjust budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    return state.categories.find((c) => c.id === categoryId)?.color || '#6b7280';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-white/20 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Adjust Budget</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Over Budget Info */}
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getCategoryColor(overBudgetCategory.categoryId) }}
            />
            <div className="flex-1">
              <p className="text-white font-medium">{overBudgetCategory.categoryName}</p>
              <p className="text-red-400 text-sm">
                Over budget by ¥{amountNeeded.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {availableSources.length === 0 ? (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-amber-400 font-medium">No available sources</p>
                <p className="text-amber-300 text-sm">
                  All non-essential categories are either at their limit or have no remaining budget.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Source Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Transfer from (non-essential categories only)
              </label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {availableSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSourceId(source.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      selectedSourceId === source.id
                        ? 'bg-emerald-500/20 border-emerald-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: source.color }}
                    />
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{source.name}</p>
                      <p className="text-slate-400 text-xs">
                        ¥{source.remaining.toLocaleString()} available
                      </p>
                    </div>
                    {source.remaining >= amountNeeded ? (
                      <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
                        Covers full amount
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded">
                        Partial: ¥{source.remaining.toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Protected Categories Notice */}
            {state.categories.some((c) => c.isEssential && c.id !== overBudgetCategory.categoryId) && (
              <div className="bg-white/5 rounded-xl p-3 mb-6 border border-white/10">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Essential categories (Rent, Utilities, etc.) are protected</span>
                </div>
              </div>
            )}

            {/* Transfer Preview */}
            {selectedSource && (
              <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-4 mb-6 border border-emerald-500/30">
                <p className="text-slate-300 text-sm mb-3">Transfer Preview</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">{selectedSource.name}</p>
                    <p className="text-white font-bold">
                      ¥{selectedSource.limit.toLocaleString()}
                    </p>
                    <p className="text-red-400 text-sm">
                      - ¥{transferAmount.toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-emerald-400" />
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">{overBudgetCategory.categoryName}</p>
                    <p className="text-white font-bold">
                      ¥{overBudgetCategory.limit.toLocaleString()}
                    </p>
                    <p className="text-emerald-400 text-sm">
                      + ¥{transferAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                {!canTransfer && (
                  <p className="text-amber-400 text-xs mt-3 text-center">
                    Note: This will only partially cover the over-budget amount
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdjust}
            disabled={isSubmitting || !selectedSource || availableSources.length === 0}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adjusting...
              </>
            ) : (
              'Adjust Budget'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
