'use client';

import Header from './Header';
import Calendar from './Calendar';
import BudgetOverview from './BudgetOverview';
import SpendingChart from './SpendingChart';
import AIAnalysis from './AIAnalysis';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <Calendar />
            <AIAnalysis />
          </div>

          {/* Right Column - Overview & Charts */}
          <div className="space-y-6">
            <BudgetOverview />
            <SpendingChart />
          </div>
        </div>
      </main>
    </div>
  );
}
