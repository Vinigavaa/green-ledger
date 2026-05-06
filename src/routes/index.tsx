import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/finance/AppShell";
import { PageHeader, StatCard, EmptyState } from "@/components/finance/Common";
import { MonthSwitcher } from "@/components/finance/Filters";
import {
  monthSummary,
  upcomingPayments,
  useHydrate,
  useStore,
} from "@/lib/finance/store";
import { brl } from "@/lib/finance/format";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  useHydrate();
  const data = useStore();
  const [ref, setRef] = useState(() => new Date());
  const sum = useMemo(() => monthSummary(data, ref), [data, ref]);
  const upcoming = useMemo(() => upcomingPayments(data, ref), [data, ref]);

  // Gráfico de últimos 6 meses
  const chartData = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      const s = monthSummary(data, d);
      arr.push({
        name: d.toLocaleDateString("pt-BR", { month: "short" }),
        Receitas: Math.round(s.incomesTotal),
        Despesas: Math.round(s.totalExpenses),
      });
    }
    return arr;
  }, [data, ref]);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da sua saúde financeira no mês"
        actions={<MonthSwitcher value={ref} onChange={setRef} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="primary"
          label="Saldo previsto"
          value={brl(sum.balance)}
          hint={sum.balance >= 0 ? "Você está no positivo" : "Atenção, no negativo"}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Receitas"
          value={brl(sum.incomesTotal)}
          hint={`${sum.incomes.length} entradas`}
          icon={<TrendingUp className="h-4 w-4 text-success" />}
        />
        <StatCard
          label="Gastos previstos"
          value={brl(sum.totalExpenses)}
          hint={`Já pagos: ${brl(sum.totalPaid)}`}
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
        />
        <StatCard
          label="Disponível"
          value={brl(sum.available)}
          hint={`${sum.committed.toFixed(0)}% da renda comprometida`}
          icon={<PiggyBank className="h-4 w-4" />}
        />
      </div>

      {sum.totalExpenses > sum.incomesTotal && sum.incomesTotal > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Gastos ultrapassam a receita
            </p>
            <p className="text-xs text-muted-foreground">
              Reveja categorias e parcelas para equilibrar o mês.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Entradas e saídas</h2>
            <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 150)" />
                <XAxis dataKey="name" stroke="oklch(0.52 0.02 155)" fontSize={12} />
                <YAxis stroke="oklch(0.52 0.02 155)" fontSize={12} />
                <Tooltip
                  formatter={(v: number) => brl(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.92 0.01 150)",
                  }}
                />
                <Bar dataKey="Receitas" fill="oklch(0.62 0.16 152)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Despesas" fill="oklch(0.78 0.13 150)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Renda comprometida</span>
              <span className="font-medium">{sum.committed.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(sum.committed, 100)} />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Próximos pagamentos</h2>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="Nada por aqui" description="Sem pagamentos no mês." />
          ) : (
            <ul className="divide-y">
              {upcoming.slice(0, 8).map((p) => (
                <li key={p.id + p.kind} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.date.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        p.status === "paid"
                          ? "secondary"
                          : p.status === "late"
                            ? "destructive"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {p.status === "paid" ? "Pago" : p.status === "late" ? "Atrasado" : "Pendente"}
                    </Badge>
                    <span className="text-sm font-semibold">{brl(p.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
