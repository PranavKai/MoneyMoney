'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X, Loader2 } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { Expense } from '@/types';

interface ExpenseModalProps {
  date: Date;
  expense?: Expense;
  onClose: () => void;
}

export default function ExpenseModal({ date, expense, onClose }: ExpenseModalProps) {
  const { state, addExpense, updateExpense, deleteExpense } = useExpense();
  const [categoryId, setCategoryId] = useState(expense?.categoryId || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [description, setDescription] = useState(expense?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId || !amount) {
      alert('Please select a category and enter an amount');
      return;
    }

    setIsSubmitting(true);
    try {
      if (expense) {
        await updateExpense({
          id: expense.id,
          categoryId,
          amount: parseFloat(amount),
          description,
          date: format(date, 'yyyy-MM-dd'),
          createdAt: expense.createdAt,
        });
      } else {
        await addExpense({
          categoryId,
          amount: parseFloat(amount),
          description,
          date: format(date, 'yyyy-MM-dd'),
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (expense && confirm('Are you sure you want to delete this expense?')) {
      setIsSubmitting(true);
      try {
        await deleteExpense(expense.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="mb-4 text-center">
          <span className="text-slate-400">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {state.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-left
                      ${
                        categoryId === cat.id
                          ? 'border-emerald-400 bg-emerald-500/20'
                          : 'border-white/10 hover:border-white/30'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-white text-sm">{cat.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (¥)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-white/10 rounded-lg px-4 py-3 text-white text-2xl font-semibold placeholder-slate-500 border border-white/10 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you spend on?"
                className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {expense && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : expense ? (
                'Update'
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
