'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { BudgetCategory } from '@/types';

interface SettingsModalProps {
  onClose: () => void;
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#84cc16',
];

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { state, updateCategories } = useExpense();
  const [categories, setCategories] = useState<BudgetCategory[]>(
    state.categories.map((c) => ({ ...c }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCategory = () => {
    const newId = `cat-${Date.now()}`;
    setCategories([
      ...categories,
      {
        id: newId,
        name: '',
        limit: 0,
        color: COLORS[categories.length % COLORS.length],
      },
    ]);
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const updateCategory = (
    id: string,
    field: keyof BudgetCategory,
    value: string | number
  ) => {
    setCategories(
      categories.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSave = async () => {
    const validCategories = categories.filter((c) => c.name.trim() && c.limit > 0);
    if (validCategories.length === 0) {
      alert('Please add at least one category with a budget limit');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCategories(validCategories);
      onClose();
    } catch (error) {
      console.error('Failed to update categories:', error);
      alert('Failed to save categories. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBudget = categories.reduce((sum, c) => sum + (c.limit || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-white/20 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Budget Settings</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10"
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
                  value={category.limit || ''}
                  onChange={(e) =>
                    updateCategory(category.id, 'limit', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="w-24 bg-transparent text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
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
          className="w-full mb-4 py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>

        <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-4 mb-4 border border-emerald-500/30">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Total Monthly Budget</span>
            <span className="text-2xl font-bold text-white">
              ¥{totalBudget.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
