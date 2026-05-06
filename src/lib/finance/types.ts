// Tipos de domínio para o sistema financeiro
export type UUID = string;

export type CategoryKind = "income" | "expense" | "both";

export interface Category {
  id: UUID;
  name: string;
  kind: CategoryKind;
  color: string;
  icon?: string;
  custom?: boolean;
}

export type PaymentStatus = "paid" | "pending" | "late";
export type PaymentMethod =
  | "Dinheiro"
  | "Pix"
  | "Débito"
  | "Crédito"
  | "Boleto"
  | "Transferência";

export interface Income {
  id: UUID;
  name: string;
  amount: number;
  date: string; // ISO
  categoryId: UUID;
  recurring: boolean;
  notes?: string;
}

export interface Expense {
  id: UUID;
  name: string;
  amount: number;
  date: string;
  categoryId: UUID;
  method: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
}

export interface FixedExpense {
  id: UUID;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  categoryId: UUID;
  active: boolean;
}

export interface Installment {
  id: UUID;
  name: string;
  totalAmount: number;
  installments: number; // total
  firstDate: string;
  categoryId: UUID;
  paidIndices: number[]; // 0-based indices already paid
}

export type Priority = "low" | "medium" | "high";

export interface Goal {
  id: UUID;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  priority: Priority;
}

export interface DataStore {
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  fixed: FixedExpense[];
  installments: Installment[];
  goals: Goal[];
}
