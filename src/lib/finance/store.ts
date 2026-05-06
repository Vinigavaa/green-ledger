import { useEffect, useSyncExternalStore } from "react";
import type {
  Category,
  DataStore,
  Expense,
  FixedExpense,
  Goal,
  Income,
  Installment,
} from "./types";
import { SEED } from "./seed";
import { sameMonth, uid } from "./format";

const KEY = "finflow.store.v1";

let state: DataStore = load();

const listeners = new Set<() => void>();
function load(): DataStore {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as DataStore;
  } catch {
    return SEED;
  }
}
function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}
function notify() {
  persist();
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return state;
}
function getServerSnapshot() {
  return SEED;
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Garante hidratação: lê localStorage no cliente após mount
export function useHydrate() {
  useEffect(() => {
    state = load();
    notify();
  }, []);
}

// Mutations
export const store = {
  reset() {
    state = SEED;
    notify();
  },
  addIncome(i: Omit<Income, "id">) {
    state = { ...state, incomes: [{ ...i, id: uid() }, ...state.incomes] };
    notify();
  },
  updateIncome(id: string, patch: Partial<Income>) {
    state = {
      ...state,
      incomes: state.incomes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    };
    notify();
  },
  removeIncome(id: string) {
    state = { ...state, incomes: state.incomes.filter((x) => x.id !== id) };
    notify();
  },
  addExpense(e: Omit<Expense, "id">) {
    state = { ...state, expenses: [{ ...e, id: uid() }, ...state.expenses] };
    notify();
  },
  updateExpense(id: string, patch: Partial<Expense>) {
    state = {
      ...state,
      expenses: state.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    };
    notify();
  },
  removeExpense(id: string) {
    state = { ...state, expenses: state.expenses.filter((x) => x.id !== id) };
    notify();
  },
  addFixed(f: Omit<FixedExpense, "id">) {
    state = { ...state, fixed: [{ ...f, id: uid() }, ...state.fixed] };
    notify();
  },
  updateFixed(id: string, patch: Partial<FixedExpense>) {
    state = {
      ...state,
      fixed: state.fixed.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    };
    notify();
  },
  removeFixed(id: string) {
    state = { ...state, fixed: state.fixed.filter((x) => x.id !== id) };
    notify();
  },
  addInstallment(i: Omit<Installment, "id" | "paidIndices"> & { paidIndices?: number[] }) {
    state = {
      ...state,
      installments: [
        { ...i, id: uid(), paidIndices: i.paidIndices ?? [] },
        ...state.installments,
      ],
    };
    notify();
  },
  updateInstallment(id: string, patch: Partial<Installment>) {
    state = {
      ...state,
      installments: state.installments.map((x) =>
        x.id === id ? { ...x, ...patch } : x,
      ),
    };
    notify();
  },
  toggleInstallmentPaid(id: string, idx: number) {
    state = {
      ...state,
      installments: state.installments.map((x) => {
        if (x.id !== id) return x;
        const has = x.paidIndices.includes(idx);
        return {
          ...x,
          paidIndices: has
            ? x.paidIndices.filter((i) => i !== idx)
            : [...x.paidIndices, idx].sort((a, b) => a - b),
        };
      }),
    };
    notify();
  },
  removeInstallment(id: string) {
    state = {
      ...state,
      installments: state.installments.filter((x) => x.id !== id),
    };
    notify();
  },
  addGoal(g: Omit<Goal, "id">) {
    state = { ...state, goals: [{ ...g, id: uid() }, ...state.goals] };
    notify();
  },
  updateGoal(id: string, patch: Partial<Goal>) {
    state = {
      ...state,
      goals: state.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    };
    notify();
  },
  removeGoal(id: string) {
    state = { ...state, goals: state.goals.filter((x) => x.id !== id) };
    notify();
  },
  addCategory(c: Omit<Category, "id">) {
    state = {
      ...state,
      categories: [...state.categories, { ...c, id: uid(), custom: true }],
    };
    notify();
  },
  removeCategory(id: string) {
    state = {
      ...state,
      categories: state.categories.filter((c) => c.id !== id),
    };
    notify();
  },
};

// ===== Derived helpers =====
export function categoryById(s: DataStore, id: string) {
  return s.categories.find((c) => c.id === id);
}

// Parcelas que caem em determinado mês de referência
export function installmentsInMonth(s: DataStore, ref: Date) {
  const out: Array<{
    installment: Installment;
    index: number;
    date: Date;
    amount: number;
    paid: boolean;
  }> = [];
  for (const inst of s.installments) {
    const start = new Date(inst.firstDate);
    const amount = inst.totalAmount / inst.installments;
    for (let i = 0; i < inst.installments; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
      if (d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()) {
        out.push({
          installment: inst,
          index: i,
          date: d,
          amount,
          paid: inst.paidIndices.includes(i),
        });
      }
    }
  }
  return out;
}

export function monthSummary(s: DataStore, ref: Date) {
  const incomes = s.incomes.filter((i) => sameMonth(i.date, ref));
  const incomesTotal = incomes.reduce((a, b) => a + b.amount, 0);

  const expenses = s.expenses.filter((e) => sameMonth(e.date, ref));
  const variableTotal = expenses.reduce((a, b) => a + b.amount, 0);
  const variablePaid = expenses
    .filter((e) => e.status === "paid")
    .reduce((a, b) => a + b.amount, 0);

  const fixedActive = s.fixed.filter((f) => f.active);
  const fixedTotal = fixedActive.reduce((a, b) => a + b.amount, 0);

  const inst = installmentsInMonth(s, ref);
  const instTotal = inst.reduce((a, b) => a + b.amount, 0);
  const instPaid = inst.filter((i) => i.paid).reduce((a, b) => a + b.amount, 0);

  const totalExpenses = variableTotal + fixedTotal + instTotal;
  const totalPaid = variablePaid + instPaid; // fixed: assume não-pagos por padrão
  const balance = incomesTotal - totalExpenses;
  const available = incomesTotal - totalPaid;
  const committed = incomesTotal > 0 ? (totalExpenses / incomesTotal) * 100 : 0;

  return {
    incomesTotal,
    variableTotal,
    fixedTotal,
    instTotal,
    totalExpenses,
    totalPaid,
    balance,
    available,
    committed,
    incomes,
    expenses,
    fixedActive,
    installments: inst,
  };
}

// próximos pagamentos (fixos + parcelas + variáveis pendentes)
export interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  date: Date;
  kind: "fixed" | "installment" | "expense";
  status: "pending" | "late" | "paid";
}

export function upcomingPayments(s: DataStore, ref: Date, days = 30) {
  const now = new Date();
  const out: UpcomingPayment[] = [];

  s.fixed
    .filter((f) => f.active)
    .forEach((f) => {
      const d = new Date(ref.getFullYear(), ref.getMonth(), Math.min(f.dueDay, 28));
      out.push({
        id: f.id,
        name: f.name,
        amount: f.amount,
        date: d,
        kind: "fixed",
        status: d < now ? "late" : "pending",
      });
    });

  installmentsInMonth(s, ref).forEach((i) => {
    out.push({
      id: `${i.installment.id}-${i.index}`,
      name: `${i.installment.name} (${i.index + 1}/${i.installment.installments})`,
      amount: i.amount,
      date: i.date,
      kind: "installment",
      status: i.paid ? "paid" : i.date < now ? "late" : "pending",
    });
  });

  s.expenses
    .filter((e) => sameMonth(e.date, ref) && e.status !== "paid")
    .forEach((e) => {
      const d = new Date(e.date);
      out.push({
        id: e.id,
        name: e.name,
        amount: e.amount,
        date: d,
        kind: "expense",
        status: d < now ? "late" : "pending",
      });
    });

  return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 50);
}
