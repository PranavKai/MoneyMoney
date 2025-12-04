'use client';

import { useState } from 'react';
import { Plus, Trash2, Wallet, Loader2, Banknote, Lock } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { BudgetCategory } from '@/types';

const DEFAULT_CATEGORIES = [
  { name: 'Rent', color: '#ef4444', isEssential: true },
  { name: 'Food', color: '#f97316', isEssential: false },
  { name: 'Transport', color: '#eab308', isEssential: false },
  { name: 'Utilities', color: '#22c55e', isEssential: true },
  { name: 'Entertainment', color: '#3b82f6', isEssential: false },
  { name: 'Shopping', color: '#8b5cf6', isEssential: false },
  { name: 'Healthcare', color: '#ec4899', isEssential: true },
  { name: 'Other', color: '#6b7280', isEssential: false },
];

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#84cc16',
];

interface CategoryInput {
  id: string;
  name: string;
  limit: string;
  color: string;
  isEssential: boolean;
}

export default function BudgetSetup() {
  const { setupBudget } = useExpense();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [categories, setCategories] = useState<CategoryInput[]>(
    DEFAULT_CATEGORIES.map((cat, index) => ({
      id: `cat-${index}`,
      name: cat.name,
      limit: '',
      color: cat.color,
      isEssential: cat.isEssential,
    }))
  );

  const addCategory = () => {
    const newId = `cat-${Date.now()}`;
    setCategories([
      ...categories,
      {
        id: newId,
        name: '',
        limit: '',
        color: COLORS[categories.length % COLORS.length],
        isEssential: false,
      },
    ]);
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const updateCategory = (id: string, field: keyof CategoryInput, value: string | boolean) => {
    setCategories(
      categories.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const income = parseFloat(monthlyIncome) || 0;
    if (income <= 0) {
      alert('Please enter your monthly income');
      return;
    }

    const validCategories: Omit<BudgetCategory, 'id'>[] = categories
      .filter((c) => c.name.trim() && c.limit)
      .map((c) => ({
        name: c.name.trim(),
        limit: parseFloat(c.limit) || 0,
        color: c.color,
        isEssential: c.isEssential,
      }));

    if (validCategories.length === 0) {
      alert('Please add at least one category with a budget limit');
      return;
    }

    setIsSubmitting(true);
    try {
      await setupBudget(validCategories, income);
    } catch (error) {
      console.error('Failed to setup budget:', error);
      alert('Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBudget = categories.reduce((sum, c) => sum + (parseFloat(c.limit) || 0), 0);
  const income = parseFloat(monthlyIncome) || 0;
  const savings = income - totalBudget;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Set Your Budget</h1>
          <p className="text-slate-300">
            Enter your income and define spending limits
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Monthly Income */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Monthly Income
            </label>
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <Banknote className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex items-center gap-1 flex-1 bg-white/10 rounded-lg px-4 py-3 border border-white/10">
                <span className="text-slate-400 text-xl">¥</span>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="Enter your monthly income"
                  className="flex-1 bg-transparent text-white text-xl font-semibold placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category Header */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300">
              Budget Categories
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Lock className="w-3 h-3" />
              <span>Essential = Protected from budget adjustments</span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`flex items-center gap-3 rounded-xl p-3 border ${
                  category.isEssential
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => updateCategory(category.id, 'color', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                  placeholder="Category name"
                  className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-emerald-400"
                />
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-3 py-2 border border-white/10">
                  <span className="text-slate-400">¥</span>
                  <input
                    type="number"
                    value={category.limit}
                    onChange={(e) => updateCategory(category.id, 'limit', e.target.value)}
                    placeholder="0"
                    className="w-24 bg-transparent text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => updateCategory(category.id, 'isEssential', !category.isEssential)}
                  className={`p-2 rounded-lg transition-colors ${
                    category.isEssential
                      ? 'bg-amber-500/30 text-amber-400'
                      : 'hover:bg-white/10 text-slate-400'
                  }`}
                  title={category.isEssential ? 'Essential (protected)' : 'Mark as essential'}
                >
                  <Lock className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCategory}
            className="w-full mb-6 py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>

          {/* Summary */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-4 mb-6 border border-emerald-500/30 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Monthly Income</span>
              <span className="text-xl font-bold text-blue-400">
                ¥{income.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total Budget</span>
              <span className="text-xl font-bold text-white">
                ¥{totalBudget.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-slate-300">Potential Savings</span>
              <span className={`text-xl font-bold ${savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ¥{savings.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-semibold text-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Start Tracking'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
