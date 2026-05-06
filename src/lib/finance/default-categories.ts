import type { Category } from "./types";

export const DEFAULT_CATEGORIES: Array<Omit<Category, "id"> & { id: string }> = [
  { id: "cat-moradia", name: "Moradia", kind: "expense", color: "#10b981" },
  { id: "cat-alimentacao", name: "Alimentacao", kind: "expense", color: "#22c55e" },
  { id: "cat-transporte", name: "Transporte", kind: "expense", color: "#16a34a" },
  { id: "cat-lazer", name: "Lazer", kind: "expense", color: "#84cc16" },
  { id: "cat-saude", name: "Saude", kind: "expense", color: "#06b6d4" },
  { id: "cat-educacao", name: "Educacao", kind: "expense", color: "#0ea5e9" },
  { id: "cat-assinaturas", name: "Assinaturas", kind: "expense", color: "#a855f7" },
  { id: "cat-cartao", name: "Cartao de credito", kind: "expense", color: "#ef4444" },
  { id: "cat-salario", name: "Salario", kind: "income", color: "#15803d" },
  { id: "cat-extra", name: "Renda extra", kind: "income", color: "#22c55e" },
  { id: "cat-objetivos", name: "Objetivos", kind: "both", color: "#0d9488" },
];
