import { useRouter } from "@tanstack/react-router";
import type { Category, Expense, FixedExpense, Goal, Income, Installment } from "./types";
import type { MaterializedIncome } from "./store";
import {
  createCategory,
  createExpense,
  createFixedExpense,
  createGoal,
  createIncome,
  createInstallment,
  deleteCategory,
  deleteExpense,
  deleteFixedExpense,
  deleteGoal,
  deleteIncome,
  deleteInstallment,
  toggleInstallmentPaid,
  updateExpense,
  updateFixedExpense,
  updateGoal,
  updateIncome,
  updateInstallment,
} from "./functions";

export function useFinanceActions() {
  const router = useRouter();

  async function refresh() {
    await router.invalidate({ sync: true });
  }

  return {
    addIncome: async (input: Omit<Income, "id">) => {
      await createIncome({ data: input });
      await refresh();
    },
    updateIncome: async (id: string, patch: Partial<Income>) => {
      await updateIncome({ data: { id, patch } });
      await refresh();
    },
    setIncomeReceived: async (income: MaterializedIncome, received: boolean) => {
      if (income.projected) {
        if (!received) return;
        await createIncome({
          data: {
            name: income.name,
            amount: income.amount,
            date: income.date,
            categoryId: income.categoryId,
            recurring: false,
            received: true,
            notes: income.notes,
          },
        });
        await refresh();
        return;
      }

      await updateIncome({ data: { id: income.id, patch: { received } } });
      await refresh();
    },
    removeIncome: async (id: string) => {
      await deleteIncome({ data: { id } });
      await refresh();
    },
    addExpense: async (input: Omit<Expense, "id">) => {
      await createExpense({ data: input });
      await refresh();
    },
    updateExpense: async (id: string, patch: Partial<Expense>) => {
      await updateExpense({ data: { id, patch } });
      await refresh();
    },
    removeExpense: async (id: string) => {
      await deleteExpense({ data: { id } });
      await refresh();
    },
    addFixed: async (input: Omit<FixedExpense, "id">) => {
      await createFixedExpense({ data: input });
      await refresh();
    },
    updateFixed: async (id: string, patch: Partial<FixedExpense>) => {
      await updateFixedExpense({ data: { id, patch } });
      await refresh();
    },
    removeFixed: async (id: string) => {
      await deleteFixedExpense({ data: { id } });
      await refresh();
    },
    addInstallment: async (
      input: Omit<Installment, "id" | "paidIndices"> & { paidIndices?: number[] },
    ) => {
      await createInstallment({ data: input });
      await refresh();
    },
    updateInstallment: async (id: string, patch: Partial<Installment>) => {
      await updateInstallment({ data: { id, patch } });
      await refresh();
    },
    toggleInstallmentPaid: async (id: string, idx: number) => {
      await toggleInstallmentPaid({ data: { id, idx } });
      await refresh();
    },
    removeInstallment: async (id: string) => {
      await deleteInstallment({ data: { id } });
      await refresh();
    },
    addGoal: async (input: Omit<Goal, "id">) => {
      await createGoal({ data: input });
      await refresh();
    },
    updateGoal: async (id: string, patch: Partial<Goal>) => {
      await updateGoal({ data: { id, patch } });
      await refresh();
    },
    removeGoal: async (id: string) => {
      await deleteGoal({ data: { id } });
      await refresh();
    },
    addCategory: async (input: Omit<Category, "id">) => {
      await createCategory({ data: input });
      await refresh();
    },
    removeCategory: async (id: string) => {
      await deleteCategory({ data: { id } });
      await refresh();
    },
  };
}
