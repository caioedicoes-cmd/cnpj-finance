export type CategoryType = "revenue" | "expense";

export interface Category {
  id: string;
  company_id: string;
  name: string;
  type: CategoryType;
  is_default: boolean;
}

export interface Company {
  id: string;
  user_id: string;
  nome: string;
  nome_fantasia: string | null;
  cnpj: string;
}

export interface Revenue {
  id: string;
  company_id: string;
  category_id: string | null;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  description: string | null;
  client: string | null;
}

export interface ExpenseItem {
  id: string;
  company_id: string;
  category_id: string | null;
  date: string;
  amount: number;
  description: string | null;
  fixed_expense_id?: string | null;
}

export interface FixedExpense {
  id: string;
  company_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  day_of_month: number;
  active: boolean;
}
