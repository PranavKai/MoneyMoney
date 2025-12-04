'use client';

import { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';

export default function SpendingChart() {
  const { state, getSpendingByCategory } = useExpense();
  const [isExpanded, setIsExpanded] = useState(false);

  const chartData = useMemo(() => {
    const spending = getSpendingByCategory();
    return state.categories
      .map((cat) => ({
        name: cat.name,
        value: spending.get(cat.id) || 0,
        color: cat.color,
      }))
      .filter((item) => item.value > 0);
  }, [state.categories, getSpendingByCategory]);

  const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 md:p-6 flex items-center justify-between md:cursor-default"
        >
          <h3 className="text-lg font-semibold text-white">Spending Distribution</h3>
          <div className="md:hidden">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>
        <div className={`px-4 pb-4 md:px-6 md:pb-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-slate-400">No expenses recorded this month</p>
          </div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalSpent) * 100).toFixed(1);
      return (
        <div className="bg-slate-800 border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-slate-300">¥{data.value.toLocaleString()}</p>
          <p className="text-slate-400 text-sm">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      {/* Header - Clickable on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 md:p-6 flex items-center justify-between md:cursor-default"
      >
        <h3 className="text-lg font-semibold text-white">Spending Distribution</h3>
        <div className="md:hidden">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content - Collapsible on mobile */}
      <div className={`px-4 pb-4 md:px-6 md:pb-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-400 text-sm truncate">{item.name}</span>
              <span className="text-white text-sm ml-auto">
                {((item.value / totalSpent) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
