'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Header from './Header';
import Calendar from './Calendar';
import BudgetOverview from './BudgetOverview';
import SpendingChart from './SpendingChart';
import AIAnalysis from './AIAnalysis';
import ExpenseModal from './ExpenseModal';

export default function Dashboard() {
  const [showQuickExpense, setShowQuickExpense] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <Calendar />
            {/* AI Analysis - Hidden on mobile by default, shown on desktop */}
            <div className="hidden md:block">
              <AIAnalysis />
            </div>
          </div>

          {/* Right Column - Overview & Charts */}
          <div className="space-y-6">
            <BudgetOverview />
            <SpendingChart />
            {/* AI Analysis - Show on mobile at the bottom */}
            <div className="md:hidden">
              <AIAnalysis />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Add Expense Button - Mobile Only */}
      <button
        onClick={() => setShowQuickExpense(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center z-50 active:scale-95 transition-transform"
        aria-label="Add Expense"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Quick Expense Modal */}
      {showQuickExpense && (
        <ExpenseModal
          date={new Date()}
          onClose={() => setShowQuickExpense(false)}
        />
      )}
    </div>
  );
}
