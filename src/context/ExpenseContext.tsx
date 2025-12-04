'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AppState, BudgetCategory, Expense } from '@/types';

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: AppState }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'COMPLETE_SETUP'; payload: { categories: BudgetCategory[]; monthlyIncome: number } }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'SET_SELECTED_MONTH'; payload: string }
  | { type: 'UPDATE_CATEGORIES'; payload: BudgetCategory[] }
  | { type: 'UPDATE_INCOME'; payload: number }
  | { type: 'RESET_APP' };

interface ExtendedAppState extends AppState {
  isLoading: boolean;
}

const initialState: ExtendedAppState = {
  isSetupComplete: false,
  monthlyIncome: 0,
  categories: [],
  expenses: [],
  selectedMonth: new Date().toISOString().slice(0, 7),
  isLoading: true,
};

function expenseReducer(state: ExtendedAppState, action: Action): ExtendedAppState {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return { ...state, ...action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'COMPLETE_SETUP':
      return {
        ...state,
        isSetupComplete: true,
        categories: action.payload.categories,
        monthlyIncome: action.payload.monthlyIncome,
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [action.payload, ...state.expenses],
      };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      };
    case 'SET_SELECTED_MONTH':
      return {
        ...state,
        selectedMonth: action.payload,
      };
    case 'UPDATE_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };
    case 'UPDATE_INCOME':
      return {
        ...state,
        monthlyIncome: action.payload,
      };
    case 'RESET_APP':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

interface ExpenseContextType {
  state: ExtendedAppState;
  dispatch: React.Dispatch<Action>;
  getSpendingByCategory: (month?: string) => Map<string, number>;
  getMonthlyTotal: (month?: string) => number;
  isOverBudget: (categoryId: string, month?: string) => boolean;
  getOverBudgetCategories: (month?: string) => BudgetCategory[];
  // API actions
  setupBudget: (categories: Omit<BudgetCategory, 'id'>[], monthlyIncome: number) => Promise<void>;
  updateCategories: (categories: BudgetCategory[]) => Promise<void>;
  updateIncome: (income: number) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  resetApp: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const { data: session, status } = useSession();

  const loadUser = useCallback(async () => {
    if (status !== 'authenticated' || !session) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const user = await response.json();

        // Transform data to match our state format
        const categories: BudgetCategory[] = user.categories.map((c: { id: string; name: string; limit: number; color: string; isEssential: boolean }) => ({
          id: c.id,
          name: c.name,
          limit: c.limit,
          color: c.color,
          isEssential: c.isEssential || false,
        }));

        const expenses: Expense[] = user.expenses.map((e: { id: string; categoryId: string; amount: number; description: string | null; date: string; createdAt: string }) => ({
          id: e.id,
          categoryId: e.categoryId,
          amount: e.amount,
          description: e.description || '',
          date: e.date.split('T')[0],
          createdAt: e.createdAt,
        }));

        dispatch({
          type: 'SET_INITIAL_STATE',
          payload: {
            isSetupComplete: user.isSetupComplete,
            monthlyIncome: user.monthlyIncome || 0,
            categories,
            expenses,
            selectedMonth: new Date().toISOString().slice(0, 7),
          },
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [session, status]);

  // Load user data when session is ready
  useEffect(() => {
    if (status === 'loading') return;
    loadUser();
  }, [status, loadUser]);

  const getSpendingByCategory = useCallback((month?: string): Map<string, number> => {
    const targetMonth = month || state.selectedMonth;
    const spending = new Map<string, number>();

    state.categories.forEach((cat) => {
      spending.set(cat.id, 0);
    });

    state.expenses
      .filter((e) => e.date.startsWith(targetMonth))
      .forEach((e) => {
        const current = spending.get(e.categoryId) || 0;
        spending.set(e.categoryId, current + e.amount);
      });

    return spending;
  }, [state.categories, state.expenses, state.selectedMonth]);

  const getMonthlyTotal = useCallback((month?: string): number => {
    const targetMonth = month || state.selectedMonth;
    return state.expenses
      .filter((e) => e.date.startsWith(targetMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [state.expenses, state.selectedMonth]);

  const isOverBudget = useCallback((categoryId: string, month?: string): boolean => {
    const spending = getSpendingByCategory(month);
    const category = state.categories.find((c) => c.id === categoryId);
    if (!category) return false;
    return (spending.get(categoryId) || 0) > category.limit;
  }, [state.categories, getSpendingByCategory]);

  const getOverBudgetCategories = useCallback((month?: string): BudgetCategory[] => {
    const spending = getSpendingByCategory(month);
    return state.categories.filter((cat) => {
      const spent = spending.get(cat.id) || 0;
      return spent > cat.limit;
    });
  }, [state.categories, getSpendingByCategory]);

  // API Actions
  const setupBudget = async (categories: Omit<BudgetCategory, 'id'>[], monthlyIncome: number) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories, monthlyIncome }),
    });

    if (response.ok) {
      const data = await response.json();
      dispatch({ type: 'COMPLETE_SETUP', payload: { categories: data.categories, monthlyIncome: data.monthlyIncome } });
    } else {
      throw new Error('Failed to setup budget');
    }
  };

  const updateIncome = async (income: number) => {
    const response = await fetch('/api/user/income', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyIncome: income }),
    });

    if (response.ok) {
      dispatch({ type: 'UPDATE_INCOME', payload: income });
    } else {
      throw new Error('Failed to update income');
    }
  };

  const updateCategories = async (categories: BudgetCategory[]) => {
    const response = await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });

    if (response.ok) {
      const updatedCategories = await response.json();
      dispatch({ type: 'UPDATE_CATEGORIES', payload: updatedCategories });
    } else {
      throw new Error('Failed to update categories');
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });

    if (response.ok) {
      const createdExpense = await response.json();
      dispatch({
        type: 'ADD_EXPENSE',
        payload: {
          id: createdExpense.id,
          categoryId: createdExpense.categoryId,
          amount: createdExpense.amount,
          description: createdExpense.description || '',
          date: createdExpense.date.split('T')[0],
          createdAt: createdExpense.createdAt,
        },
      });
    } else {
      throw new Error('Failed to add expense');
    }
  };

  const updateExpense = async (expense: Expense) => {
    const response = await fetch(`/api/expenses/${expense.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });

    if (response.ok) {
      const updatedExpense = await response.json();
      dispatch({
        type: 'UPDATE_EXPENSE',
        payload: {
          id: updatedExpense.id,
          categoryId: updatedExpense.categoryId,
          amount: updatedExpense.amount,
          description: updatedExpense.description || '',
          date: updatedExpense.date.split('T')[0],
          createdAt: updatedExpense.createdAt,
        },
      });
    } else {
      throw new Error('Failed to update expense');
    }
  };

  const deleteExpense = async (id: string) => {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
    } else {
      throw new Error('Failed to delete expense');
    }
  };

  const resetApp = async () => {
    const response = await fetch('/api/user', {
      method: 'DELETE',
    });

    if (response.ok) {
      dispatch({ type: 'RESET_APP' });
    } else {
      throw new Error('Failed to reset app');
    }
  };

  const refreshData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    await loadUser();
  };

  return (
    <ExpenseContext.Provider
      value={{
        state,
        dispatch,
        getSpendingByCategory,
        getMonthlyTotal,
        isOverBudget,
        getOverBudgetCategories,
        setupBudget,
        updateCategories,
        updateIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        resetApp,
        refreshData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
