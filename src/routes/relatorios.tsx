import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { AppShell } from "@/components/finance/AppShell";
import { PageHeader } from "@/components/finance/Common";
import { categoryById, monthSummary, useHydrate, useStore } from "@/lib/finance/store";
import { brl } from "@/lib/finance/format";

export const Route = createFileRoute("/relatorios")({
  component: Page,
});

function Page() {
  useHydrate();
  const data = useStore();
  const ref = new Date();

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    data.expenses
      .filter((e) => e.date.startsWith(ref.toISOString().slice(0, 7)))
      .forEach((e) =>
        map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount),
      );
    return Array.from(map.entries()).map(([id, value]) => {
      const c = categoryById(data, id);
      return { name: c?.name ?? "—", color: c?.color ?? "#10b981", value };
    });
  }, [data]);

  const monthly = useMemo(() => {
    const arr = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      const s = monthSummary(data, d);
      arr.push({
        name: d.toLocaleDateString("pt-BR", { month: "short" }),
        Saldo: Math.round(s.balance),
        Receitas: Math.round(s.incomesTotal),
        Despesas: Math.round(s.totalExpenses),
      });
    }
    return arr;
  }, [data]);

  const fixedRanking = useMemo(
    () => [...data.fixed].filter((f) => f.active).sort((a, b) => b.amount - a.amount),
    [data.fixed],
  );

  return (
    <AppShell>
      <PageHeader title="Relatórios" subtitle="Acompanhe a evolução das suas finanças" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-base font-semibold">Gastos por categoria (mês)</h2>
          <div className="mt-4 h-72">
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no mês.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {byCategory.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => brl(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-base font-semibold">Evolução do saldo (12 meses)</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 150)" />
                <XAxis dataKey="name" stroke="oklch(0.52 0.02 155)" fontSize={12} />
                <YAxis stroke="oklch(0.52 0.02 155)" fontSize={12} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="oklch(0.62 0.16 152)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Receita x Despesa</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 150)" />
                <XAxis dataKey="name" stroke="oklch(0.52 0.02 155)" fontSize={12} />
                <YAxis stroke="oklch(0.52 0.02 155)" fontSize={12} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Legend />
                <Line type="monotone" dataKey="Receitas" stroke="oklch(0.62 0.16 152)" strokeWidth={2} />
                <Line type="monotone" dataKey="Despesas" stroke="oklch(0.60 0.22 27)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Fixos que mais comprometem</h2>
          <ul className="mt-3 divide-y">
            {fixedRanking.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum gasto fixo ativo.</p>
            )}
            {fixedRanking.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2 text-sm">
                <span>{f.name}</span>
                <span className="font-semibold">{brl(f.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
