import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { PageHeader, StatCard } from "@/components/finance/Common";
import { MonthSwitcher } from "@/components/finance/Filters";
import { monthSummary, useHydrate, useStore } from "@/lib/finance/store";
import { brl } from "@/lib/finance/format";

export const Route = createFileRoute("/planejamento")({
  component: Page,
});

function Page() {
  useHydrate();
  const data = useStore();
  const [ref, setRef] = useState(() => new Date());
  const sum = useMemo(() => monthSummary(data, ref), [data, ref]);
  const suggested = Math.max(0, Math.floor(sum.balance * 0.3));

  return (
    <AppShell>
      <PageHeader
        title="Planejamento mensal"
        subtitle="Veja como o mês deve se comportar"
        actions={<MonthSwitcher value={ref} onChange={setRef} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receitas previstas" value={brl(sum.incomesTotal)} />
        <StatCard label="Gastos fixos" value={brl(sum.fixedTotal)} />
        <StatCard label="Parcelas do mês" value={brl(sum.instTotal)} />
        <StatCard label="Gastos variáveis" value={brl(sum.variableTotal)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Detalhamento</h2>
          <ul className="mt-3 divide-y">
            <li className="flex items-center justify-between py-2 text-sm">
              <span>Receitas</span>
              <span className="font-semibold text-success">+ {brl(sum.incomesTotal)}</span>
            </li>
            <li className="flex items-center justify-between py-2 text-sm">
              <span>Gastos fixos</span>
              <span className="font-semibold text-destructive">- {brl(sum.fixedTotal)}</span>
            </li>
            <li className="flex items-center justify-between py-2 text-sm">
              <span>Parcelas</span>
              <span className="font-semibold text-destructive">- {brl(sum.instTotal)}</span>
            </li>
            <li className="flex items-center justify-between py-2 text-sm">
              <span>Gastos variáveis</span>
              <span className="font-semibold text-destructive">- {brl(sum.variableTotal)}</span>
            </li>
            <li className="flex items-center justify-between border-t-2 pt-3 text-base">
              <span className="font-semibold">Saldo final estimado</span>
              <span
                className={
                  "font-bold " + (sum.balance >= 0 ? "text-success" : "text-destructive")
                }
              >
                {brl(sum.balance)}
              </span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-gradient-to-br from-primary to-[oklch(0.55_0.18_152)] p-5 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">Sugestão</h3>
            </div>
            <p className="mt-2 text-sm text-primary-foreground/90">
              Considere guardar até
            </p>
            <p className="text-3xl font-bold tracking-tight">{brl(suggested)}</p>
            <p className="mt-1 text-xs text-primary-foreground/80">
              30% do saldo previsto deste mês
            </p>
          </div>

          {sum.totalExpenses > sum.incomesTotal && sum.incomesTotal > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Atenção: gastos &gt; receitas
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reduza gastos variáveis ou parcele compras com cautela.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
