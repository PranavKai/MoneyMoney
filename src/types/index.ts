export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  color: string;
  isEssential: boolean; // Essential categories (Rent, Utilities) won't be used for budget adjustment
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD format
  createdAt: string;
}

export interface MonthlyBudget {
  categories: BudgetCategory[];
  expenses: Expense[];
}

export interface AppState {
  isSetupComplete: boolean;
  monthlyIncome: number;
  categories: BudgetCategory[];
  expenses: Expense[];
  selectedMonth: string; // YYYY-MM format
}

export interface SpendingSummary {
  categoryId: string;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface AnalysisRequest {
  startDate: string;
  endDate: string;
}

export interface DayExpense {
  date: string;
  expenses: Expense[];
  total: number;
}
