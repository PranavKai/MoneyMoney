'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { Expense } from '@/types';
import ExpenseModal from './ExpenseModal';

interface DayDetailProps {
  date: Date;
  onClose: () => void;
  onAddExpense: () => void;
}

export default function DayDetail({ date, onClose, onAddExpense }: DayDetailProps) {
  const { state, deleteExpense } = useExpense();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const dateStr = format(date, 'yyyy-MM-dd');
  const dayExpenses = state.expenses.filter((e) => e.date === dateStr);
  const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryById = (id: string) => {
    return state.categories.find((c) => c.id === id);
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId);
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense. Please try again.');
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              {format(date, 'EEEE, MMM d')}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Day Total */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-4 mb-4 border border-emerald-500/30">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Day Total</span>
              <span className="text-2xl font-bold text-white">
                ¥{dayTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Expenses List */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {dayExpenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No expenses recorded</p>
              </div>
            ) : (
              dayExpenses.map((expense) => {
                const category = getCategoryById(expense.categoryId);
                return (
                  <div
                    key={expense.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category?.color || '#6b7280' }}
                        />
                        <div>
                          <p className="text-white font-medium">
                            {category?.name || 'Unknown'}
                          </p>
                          {expense.description && (
                            <p className="text-slate-400 text-sm">
                              {expense.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          ¥{expense.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Expense Button */}
          <button
            onClick={onAddExpense}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingExpense && (
        <ExpenseModal
          date={date}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </>
  );
}
