'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isAfter,
  startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import ExpenseModal from './ExpenseModal';
import DayDetail from './DayDetail';

export default function Calendar() {
  const { state, dispatch } = useExpense();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const today = startOfDay(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();

  // Create padding for days before the month starts
  const paddingDays = Array(startDayOfWeek).fill(null);

  const expensesByDate = useMemo(() => {
    const map = new Map<string, number>();
    state.expenses.forEach((expense) => {
      const current = map.get(expense.date) || 0;
      map.set(expense.date, current + expense.amount);
    });
    return map;
  }, [state.expenses]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (date: Date) => {
    // Don't allow selecting future dates
    if (isAfter(startOfDay(date), today)) {
      return;
    }
    setSelectedDate(date);
    setShowDayDetail(true);
  };

  const handleAddExpense = (date: Date) => {
    if (isAfter(startOfDay(date), today)) {
      return;
    }
    setSelectedDate(date);
    setShowExpenseModal(true);
  };

  const isFutureDate = (date: Date) => {
    return isAfter(startOfDay(date), today);
  };

  const getDayTotal = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return expensesByDate.get(dateStr) || 0;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Update selected month in context when currentDate changes
  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate);
    dispatch({
      type: 'SET_SELECTED_MONTH',
      payload: format(newDate, 'yyyy-MM'),
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => handleMonthChange(subMonths(currentDate, 1))}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-xl font-semibold text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => handleMonthChange(addMonths(currentDate, 1))}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-slate-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding days */}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="aspect-square" />
        ))}

        {/* Actual days */}
        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayTotal = getDayTotal(date);
          const isToday = isSameDay(date, today);
          const isFuture = isFutureDate(date);
          const hasExpenses = dayTotal > 0;

          return (
            <div
              key={dateStr}
              onClick={() => handleDayClick(date)}
              className={`
                aspect-square p-1 rounded-lg border transition-all cursor-pointer relative group
                ${isToday ? 'border-emerald-400 bg-emerald-500/20' : 'border-transparent'}
                ${isFuture ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}
                ${hasExpenses ? 'bg-white/5' : ''}
              `}
            >
              <div className="h-full flex flex-col">
                <span
                  className={`text-sm font-medium ${
                    isToday ? 'text-emerald-400' : 'text-white'
                  }`}
                >
                  {format(date, 'd')}
                </span>
                {hasExpenses && (
                  <div className="flex-1 flex items-end justify-center pb-1">
                    <span className="text-xs text-emerald-400 font-medium truncate">
                      ¥{dayTotal >= 1000 ? `${(dayTotal / 1000).toFixed(0)}k` : dayTotal}
                    </span>
                  </div>
                )}
                {!isFuture && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddExpense(date);
                    }}
                    className="absolute top-1 right-1 p-1 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showExpenseModal && selectedDate && (
        <ExpenseModal
          date={selectedDate}
          onClose={() => setShowExpenseModal(false)}
        />
      )}

      {showDayDetail && selectedDate && (
        <DayDetail
          date={selectedDate}
          onClose={() => setShowDayDetail(false)}
          onAddExpense={() => {
            setShowDayDetail(false);
            setShowExpenseModal(true);
          }}
        />
      )}
    </div>
  );
}
