'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Wallet, Settings, RotateCcw, LogOut } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import SettingsModal from './SettingsModal';

export default function Header() {
  const { state, resetApp, getMonthlyTotal } = useExpense();
  const [showSettings, setShowSettings] = useState(false);

  const totalSpent = getMonthlyTotal();
  const remaining = state.monthlyIncome - totalSpent;

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset the app? All data will be lost.')) {
      try {
        await resetApp();
      } catch (error) {
        console.error('Failed to reset app:', error);
        alert('Failed to reset app. Please try again.');
      }
    }
  };

  return (
    <>
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Expense Tracker</h1>
                <p className="text-sm text-slate-400">
                  Spent ¥{totalSpent.toLocaleString()} of ¥{state.monthlyIncome.toLocaleString()} income
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">Remaining</p>
                <p className={`text-lg font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ¥{remaining.toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-px bg-white/20" />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-slate-400" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Reset App"
              >
                <RotateCcw className="w-5 h-5 text-slate-400" />
              </button>
              <button
                onClick={() => signOut()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
