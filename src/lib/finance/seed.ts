import type { DataStore, Category } from "./types";
import { uid } from "./format";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-moradia", name: "Moradia", kind: "expense", color: "#10b981" },
  { id: "cat-alimentacao", name: "Alimentação", kind: "expense", color: "#22c55e" },
  { id: "cat-transporte", name: "Transporte", kind: "expense", color: "#16a34a" },
  { id: "cat-lazer", name: "Lazer", kind: "expense", color: "#84cc16" },
  { id: "cat-saude", name: "Saúde", kind: "expense", color: "#06b6d4" },
  { id: "cat-educacao", name: "Educação", kind: "expense", color: "#0ea5e9" },
  { id: "cat-assinaturas", name: "Assinaturas", kind: "expense", color: "#a855f7" },
  { id: "cat-cartao", name: "Cartão de crédito", kind: "expense", color: "#ef4444" },
  { id: "cat-salario", name: "Salário", kind: "income", color: "#15803d" },
  { id: "cat-extra", name: "Renda extra", kind: "income", color: "#22c55e" },
  { id: "cat-objetivos", name: "Objetivos", kind: "both", color: "#0d9488" },
];

const today = new Date();
const iso = (y: number, m: number, d: number) =>
  new Date(y, m, d).toISOString().slice(0, 10);
const Y = today.getFullYear();
const M = today.getMonth();

export const SEED: DataStore = {
  categories: DEFAULT_CATEGORIES,
  incomes: [
    {
      id: uid(),
      name: "Salário",
      amount: 6500,
      date: iso(Y, M, 5),
      categoryId: "cat-salario",
      recurring: true,
    },
    {
      id: uid(),
      name: "Freela design",
      amount: 1200,
      date: iso(Y, M, 12),
      categoryId: "cat-extra",
      recurring: false,
    },
  ],
  expenses: [
    {
      id: uid(),
      name: "Mercado",
      amount: 480,
      date: iso(Y, M, 8),
      categoryId: "cat-alimentacao",
      method: "Débito",
      status: "paid",
    },
    {
      id: uid(),
      name: "Uber",
      amount: 92.5,
      date: iso(Y, M, 10),
      categoryId: "cat-transporte",
      method: "Pix",
      status: "paid",
    },
    {
      id: uid(),
      name: "Cinema",
      amount: 60,
      date: iso(Y, M, 14),
      categoryId: "cat-lazer",
      method: "Crédito",
      status: "paid",
    },
  ],
  fixed: [
    {
      id: uid(),
      name: "Aluguel",
      amount: 1800,
      dueDay: 5,
      categoryId: "cat-moradia",
      active: true,
    },
    {
      id: uid(),
      name: "Internet",
      amount: 120,
      dueDay: 10,
      categoryId: "cat-moradia",
      active: true,
    },
    {
      id: uid(),
      name: "Academia",
      amount: 99,
      dueDay: 15,
      categoryId: "cat-saude",
      active: true,
    },
    {
      id: uid(),
      name: "Netflix",
      amount: 39.9,
      dueDay: 20,
      categoryId: "cat-assinaturas",
      active: true,
    },
  ],
  installments: [
    {
      id: uid(),
      name: "Notebook",
      totalAmount: 4800,
      installments: 12,
      firstDate: iso(Y, M - 2, 5),
      categoryId: "cat-cartao",
      paidIndices: [0, 1],
    },
    {
      id: uid(),
      name: "Curso online",
      totalAmount: 1200,
      installments: 6,
      firstDate: iso(Y, M - 1, 10),
      categoryId: "cat-educacao",
      paidIndices: [0],
    },
  ],
  goals: [
    {
      id: uid(),
      name: "Reserva de emergência",
      target: 10000,
      saved: 2500,
      priority: "high",
    },
    {
      id: uid(),
      name: "Viagem",
      target: 4000,
      saved: 800,
      deadline: iso(Y + 1, 0, 1),
      priority: "medium",
    },
  ],
};
