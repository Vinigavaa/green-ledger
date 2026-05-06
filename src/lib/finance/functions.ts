import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/db.server";
import { DEFAULT_CATEGORIES } from "./default-categories";
import type { DataStore, PaymentMethod } from "./types";

const paymentMethodToDb: Record<
  PaymentMethod,
  "Dinheiro" | "Pix" | "Debito" | "Credito" | "Boleto" | "Transferencia"
> = {
  Dinheiro: "Dinheiro",
  Pix: "Pix",
  Débito: "Debito",
  Crédito: "Credito",
  Boleto: "Boleto",
  Transferência: "Transferencia",
};

const paymentMethodFromDb = {
  Dinheiro: "Dinheiro",
  Pix: "Pix",
  Debito: "Débito",
  Credito: "Crédito",
  Boleto: "Boleto",
  Transferencia: "Transferência",
} as const;

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

async function ensureDefaultCategories() {
  const count = await prisma.category.count();
  if (count > 0) return;

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      custom: false,
    })),
  });
}

async function readDataStore(): Promise<DataStore> {
  await ensureDefaultCategories();

  const [categories, incomes, expenses, fixed, installments, goals] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ custom: "asc" }, { name: "asc" }] }),
    prisma.income.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.expense.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.fixedExpense.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] }),
    prisma.installment.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.goal.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return {
    categories: categories.map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      color: item.color,
      icon: item.icon ?? undefined,
      custom: item.custom,
    })),
    incomes: incomes.map((item) => ({
      id: item.id,
      name: item.name,
      amount: toNumber(item.amount),
      date: formatDate(item.date),
      categoryId: item.categoryId,
      recurring: item.recurring,
      received: item.received,
      notes: item.notes ?? undefined,
    })),
    expenses: expenses.map((item) => ({
      id: item.id,
      name: item.name,
      amount: toNumber(item.amount),
      date: formatDate(item.date),
      categoryId: item.categoryId,
      method: paymentMethodFromDb[item.method],
      status: item.status,
      notes: item.notes ?? undefined,
    })),
    fixed: fixed.map((item) => ({
      id: item.id,
      name: item.name,
      amount: toNumber(item.amount),
      dueDay: item.dueDay,
      categoryId: item.categoryId,
      active: item.active,
    })),
    installments: installments.map((item) => ({
      id: item.id,
      name: item.name,
      totalAmount: toNumber(item.totalAmount),
      installments: item.installments,
      firstDate: formatDate(item.firstDate),
      categoryId: item.categoryId,
      paidIndices: item.paidIndices,
    })),
    goals: goals.map((item) => ({
      id: item.id,
      name: item.name,
      target: toNumber(item.target),
      saved: toNumber(item.saved),
      deadline: item.deadline ? formatDate(item.deadline) : undefined,
      priority: item.priority,
    })),
  };
}

const incomeSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
  categoryId: z.string().min(1),
  recurring: z.boolean(),
  received: z.boolean(),
  notes: z.string().optional(),
});

const expenseSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
  categoryId: z.string().min(1),
  method: z.enum(["Dinheiro", "Pix", "Débito", "Crédito", "Boleto", "Transferência"]),
  status: z.enum(["paid", "pending", "late"]),
  notes: z.string().optional(),
});

const fixedExpenseSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.number().positive(),
  dueDay: z.number().int().min(1).max(31),
  categoryId: z.string().min(1),
  active: z.boolean(),
});

const installmentSchema = z.object({
  name: z.string().trim().min(1),
  totalAmount: z.number().positive(),
  installments: z.number().int().min(1),
  firstDate: z.string().min(1),
  categoryId: z.string().min(1),
  paidIndices: z.array(z.number().int().nonnegative()).optional(),
});

const goalSchema = z.object({
  name: z.string().trim().min(1),
  target: z.number().positive(),
  saved: z.number().min(0),
  deadline: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
});

const categorySchema = z.object({
  name: z.string().trim().min(1),
  kind: z.enum(["income", "expense", "both"]),
  color: z.string().trim().min(1),
});

const idSchema = z.object({
  id: z.string().min(1),
});

export const getFinanceData = createServerFn({ method: "GET" }).handler(async () => {
  return readDataStore();
});

export const createIncome = createServerFn({ method: "POST" })
  .inputValidator(incomeSchema)
  .handler(async ({ data }) => {
    await prisma.income.create({
      data: {
        ...data,
        date: parseDate(data.date),
        notes: data.notes?.trim() || null,
      },
    });
  });

export const updateIncome = createServerFn({ method: "POST" })
  .inputValidator(idSchema.extend({ patch: incomeSchema.partial() }))
  .handler(async ({ data }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    if (typeof data.patch.date === "string") patch.date = parseDate(data.patch.date);
    if ("notes" in data.patch) patch.notes = data.patch.notes?.trim() || null;

    await prisma.income.update({
      where: { id: data.id },
      data: patch,
    });
  });

export const deleteIncome = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    await prisma.income.delete({ where: { id: data.id } });
  });

export const createExpense = createServerFn({ method: "POST" })
  .inputValidator(expenseSchema)
  .handler(async ({ data }) => {
    await prisma.expense.create({
      data: {
        ...data,
        date: parseDate(data.date),
        method: paymentMethodToDb[data.method],
        notes: data.notes?.trim() || null,
      },
    });
  });

export const updateExpense = createServerFn({ method: "POST" })
  .inputValidator(idSchema.extend({ patch: expenseSchema.partial() }))
  .handler(async ({ data }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    if (typeof data.patch.date === "string") patch.date = parseDate(data.patch.date);
    if (typeof data.patch.method === "string") {
      patch.method = paymentMethodToDb[data.patch.method];
    }
    if ("notes" in data.patch) patch.notes = data.patch.notes?.trim() || null;

    await prisma.expense.update({
      where: { id: data.id },
      data: patch,
    });
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    await prisma.expense.delete({ where: { id: data.id } });
  });

export const createFixedExpense = createServerFn({ method: "POST" })
  .inputValidator(fixedExpenseSchema)
  .handler(async ({ data }) => {
    await prisma.fixedExpense.create({ data });
  });

export const updateFixedExpense = createServerFn({ method: "POST" })
  .inputValidator(idSchema.extend({ patch: fixedExpenseSchema.partial() }))
  .handler(async ({ data }) => {
    await prisma.fixedExpense.update({
      where: { id: data.id },
      data: data.patch,
    });
  });

export const deleteFixedExpense = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    await prisma.fixedExpense.delete({ where: { id: data.id } });
  });

export const createInstallment = createServerFn({ method: "POST" })
  .inputValidator(installmentSchema)
  .handler(async ({ data }) => {
    await prisma.installment.create({
      data: {
        ...data,
        firstDate: parseDate(data.firstDate),
        paidIndices: data.paidIndices ?? [],
      },
    });
  });

export const updateInstallment = createServerFn({ method: "POST" })
  .inputValidator(idSchema.extend({ patch: installmentSchema.partial() }))
  .handler(async ({ data }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    if (typeof data.patch.firstDate === "string") {
      patch.firstDate = parseDate(data.patch.firstDate);
    }

    await prisma.installment.update({
      where: { id: data.id },
      data: patch,
    });
  });

export const deleteInstallment = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    await prisma.installment.delete({ where: { id: data.id } });
  });

export const toggleInstallmentPaid = createServerFn({ method: "POST" })
  .inputValidator(idSchema.extend({ idx: z.number().int().nonnegative() }))
  .handler(async ({ data }) => {
    const current = await prisma.installment.findUniqueOrThrow({
      where: { id: data.id },
      select: { paidIndices: true },
    });

    const paidIndices = current.paidIndices.includes(data.idx)
      ? current.paidIndices.filter((item) => item !== data.idx)
      : [...current.paidIndices, data.idx].sort((a, b) => a - b);

    await prisma.installment.update({
      where: { id: data.id },
      data: { paidIndices },
    });
  });

export const createGoal = createServerFn({ method: "POST" })
  .inputValidator(goalSchema)
  .handler(async ({ data }) => {
    await prisma.goal.create({
      data: {
        ...data,
        deadline: data.deadline ? parseDate(data.deadline) : null,
      },
    });
  });

export const updateGoal = createServerFn({ method: "POST" })
  .inputValidator(idSchema.extend({ patch: goalSchema.partial() }))
  .handler(async ({ data }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    if ("deadline" in data.patch) {
      patch.deadline = data.patch.deadline ? parseDate(data.patch.deadline) : null;
    }

    await prisma.goal.update({
      where: { id: data.id },
      data: patch,
    });
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    await prisma.goal.delete({ where: { id: data.id } });
  });

export const createCategory = createServerFn({ method: "POST" })
  .inputValidator(categorySchema)
  .handler(async ({ data }) => {
    await prisma.category.create({
      data: {
        ...data,
        custom: true,
      },
    });
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    const [incomeCount, expenseCount, fixedCount, installmentCount] = await Promise.all([
      prisma.income.count({ where: { categoryId: data.id } }),
      prisma.expense.count({ where: { categoryId: data.id } }),
      prisma.fixedExpense.count({ where: { categoryId: data.id } }),
      prisma.installment.count({ where: { categoryId: data.id } }),
    ]);

    if (incomeCount + expenseCount + fixedCount + installmentCount > 0) {
      throw new Error("Nao e possivel remover uma categoria em uso.");
    }

    await prisma.category.delete({ where: { id: data.id } });
  });
