'use client';

import { useSession } from 'next-auth/react';
import { useExpense } from '@/context/ExpenseContext';
import BudgetSetup from '@/components/BudgetSetup';
import Dashboard from '@/components/Dashboard';
import LoginForm from '@/components/LoginForm';
import { Loader2, Wallet } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const { state } = useExpense();

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - show login form
  if (!session) {
    return <LoginForm />;
  }

  // Loading user data
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading your data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not setup yet - show budget setup
  if (!state.isSetupComplete) {
    return <BudgetSetup />;
  }

  return <Dashboard />;
}
