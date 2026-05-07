import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";
import type { Category, DataStore, FixedExpense, Income, Installment } from "./types";
import { sameMonth } from "./format";

const FinanceDataContext = createContext<DataStore | null>(null);

export function FinanceDataProvider({ data, children }: { data: DataStore; children: ReactNode }) {
  return createElement(FinanceDataContext.Provider, { value: data }, children);
}

export function useStore() {
  const data = useContext(FinanceDataContext);
  if (!data) {
    throw new Error("Finance data is not available in context");
  }
  return data;
}

export function useHydrate() {
  return;
}

export function categoryById(s: DataStore, id: string) {
  return s.categories.find((c) => c.id === id);
}

export interface MaterializedIncome extends Income {
  projected?: boolean;
  sourceId?: string;
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function startsOnOrBeforeMonth(sourceDate: string, ref: Date) {
  const start = new Date(sourceDate);
  if (Number.isNaN(start.getTime())) return true;
  return monthKey(start) <= monthKey(ref);
}

function dueDateForMonth(expense: FixedExpense, ref: Date) {
  const lastDayOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return new Date(ref.getFullYear(), ref.getMonth(), Math.min(expense.dueDay, lastDayOfMonth));
}

function projectedRecurringDate(sourceDate: string, ref: Date) {
  const start = new Date(sourceDate);
  const lastDayOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const day = Math.min(start.getDate(), lastDayOfMonth);
  return new Date(ref.getFullYear(), ref.getMonth(), day);
}

function isMaterializedRecurringIncome(
  source: Income,
  income: Income,
  ref: Date,
  projectedDate: Date,
) {
  return (
    sameMonth(income.date, ref) &&
    income.name === source.name &&
    income.categoryId === source.categoryId &&
    income.amount === source.amount &&
    new Date(income.date).getDate() === projectedDate.getDate()
  );
}

export function incomesInMonth(s: DataStore, ref: Date): MaterializedIncome[] {
  const refKey = monthKey(ref);
  const actual = s.incomes.filter((income) => sameMonth(income.date, ref));
  const projected = s.incomes
    .filter((income) => {
      if (!income.recurring) return false;
      const start = new Date(income.date);
      return monthKey(start) < refKey;
    })
    .map((income) => {
      const projectedDate = projectedRecurringDate(income.date, ref);
      const hasMaterializedIncome = actual.some((candidate) =>
        isMaterializedRecurringIncome(income, candidate, ref, projectedDate),
      );
      if (hasMaterializedIncome) return null;

      const year = projectedDate.getFullYear();
      const month = String(projectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(projectedDate.getDate()).padStart(2, "0");

      return {
        ...income,
        id: `${income.id}::${year}-${month}`,
        date: `${year}-${month}-${day}`,
        received: false,
        projected: true,
        sourceId: income.id,
      } satisfies MaterializedIncome;
    })
    .filter((income): income is MaterializedIncome => income !== null);

  return [...actual, ...projected].sort((a, b) => b.date.localeCompare(a.date));
}

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

export function fixedExpensesInMonth(s: DataStore, ref: Date) {
  return s.fixed.filter(
    (expense) => expense.active && startsOnOrBeforeMonth(expense.startDate, ref),
  );
}

function hasPriorActivity(s: DataStore, ref: Date) {
  const refKey = monthKey(ref);
  return (
    s.incomes.some((income) => monthKey(new Date(income.date)) < refKey) ||
    s.expenses.some((expense) => monthKey(new Date(expense.date)) < refKey) ||
    s.fixed.some((expense) => expense.active && monthKey(new Date(expense.startDate)) < refKey) ||
    s.installments.some((installment) => monthKey(new Date(installment.firstDate)) < refKey)
  );
}

function previousMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

export function monthSummary(s: DataStore, ref: Date) {
  const incomes = incomesInMonth(s, ref).filter((income) => income.received);
  const incomesTotal = incomes.reduce((a, b) => a + b.amount, 0);

  const expenses = s.expenses.filter((e) => sameMonth(e.date, ref));
  const variableTotal = expenses.reduce((a, b) => a + b.amount, 0);
  const variablePaid = expenses
    .filter((e) => e.status === "paid")
    .reduce((a, b) => a + b.amount, 0);

  const fixedActive = fixedExpensesInMonth(s, ref);
  const fixedTotal = fixedActive.reduce((a, b) => a + b.amount, 0);

  const inst = installmentsInMonth(s, ref);
  const instTotal = inst.reduce((a, b) => a + b.amount, 0);
  const instPaid = inst.filter((i) => i.paid).reduce((a, b) => a + b.amount, 0);

  const openingBalance = hasPriorActivity(s, ref) ? monthSummary(s, previousMonth(ref)).balance : 0;
  const totalExpenses = variableTotal + fixedTotal + instTotal;
  const totalPaid = variablePaid + instPaid;
  const monthResult = incomesTotal - totalExpenses;
  const balance = openingBalance + monthResult;
  const available = openingBalance + incomesTotal - totalPaid;
  const committed = incomesTotal > 0 ? (totalExpenses / incomesTotal) * 100 : 0;

  return {
    openingBalance,
    monthResult,
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
  const limit = Math.max(1, days);

  s.fixed
    .filter((f) => f.active && startsOnOrBeforeMonth(f.startDate, ref))
    .forEach((f) => {
      const d = dueDateForMonth(f, ref);
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

  return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}
