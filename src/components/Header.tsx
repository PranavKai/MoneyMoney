'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Settings, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useExpense } from '@/context/ExpenseContext';
import SettingsModal from './SettingsModal';

export default function Header() {
  const { state, getMonthlyTotal } = useExpense();
  const [showSettings, setShowSettings] = useState(false);

  const totalSpent = getMonthlyTotal();
  const remaining = state.monthlyIncome - totalSpent;

  return (
    <>
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="MoneyMoney"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MoneyMoney</h1>
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
