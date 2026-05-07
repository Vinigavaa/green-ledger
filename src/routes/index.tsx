import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/finance/AppShell";
import { EmptyState, PageHeader, StatCard } from "@/components/finance/Common";
import { MonthSwitcher } from "@/components/finance/Filters";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { brl, formatDateBR, monthLabel } from "@/lib/finance/format";
import {
  incomesInMonth,
  monthSummary,
  upcomingPayments,
  useHydrate,
  useStore,
} from "@/lib/finance/store";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type DashboardDetailKey = "balance" | "income" | "expenses" | "available";

type DetailItem = {
  label: string;
  value?: string;
  meta?: string;
};

type DetailSectionData = {
  title: string;
  total?: string;
  description: string;
  empty: string;
  items: DetailItem[];
};

type DetailData = {
  title: string;
  description: string;
  formula: string;
  result: string;
  sections: DetailSectionData[];
  notes: string[];
};

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function startsAfterMonth(iso: string, ref: Date) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return monthKey(date) > monthKey(ref);
}

function paymentStatusLabel(status: "paid" | "pending" | "late") {
  if (status === "paid") return "Pago";
  if (status === "late") return "Atrasado";
  return "Pendente";
}

function formatLocalDate(date: Date) {
  return date.toLocaleDateString("pt-BR");
}

function DetailSection({ title, total, description, items, empty }: DetailSectionData) {
  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-gradient-to-b from-card to-muted/20">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-background/65 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {total && (
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10">
            {total}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="grid gap-2 p-4">
          {items.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                {item.meta && <p className="text-xs text-muted-foreground">{item.meta}</p>}
              </div>
              {item.value && <span className="shrink-0 text-sm font-semibold">{item.value}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Dashboard() {
  useHydrate();
  const data = useStore();
  const [ref, setRef] = useState(() => new Date());
  const [detailKey, setDetailKey] = useState<DashboardDetailKey | null>(null);
  const sum = useMemo(() => monthSummary(data, ref), [data, ref]);
  const upcoming = useMemo(() => upcomingPayments(data, ref), [data, ref]);
  const monthIncomes = useMemo(() => incomesInMonth(data, ref), [data, ref]);
  const excludedIncomes = useMemo(
    () => monthIncomes.filter((income) => !income.received),
    [monthIncomes],
  );
  const futureFixed = useMemo(
    () => data.fixed.filter((fixed) => fixed.active && startsAfterMonth(fixed.startDate, ref)),
    [data, ref],
  );
  const paidExpenses = useMemo(
    () => sum.expenses.filter((expense) => expense.status === "paid"),
    [sum.expenses],
  );
  const paidInstallments = useMemo(
    () => sum.installments.filter((installment) => installment.paid),
    [sum.installments],
  );
  const pendingImpact = useMemo(
    () => [
      ...sum.fixedActive.map((fixed) => ({
        label: fixed.name,
        value: brl(fixed.amount),
        meta: `Fixo ativo • vencimento dia ${fixed.dueDay}`,
      })),
      ...sum.expenses
        .filter((expense) => expense.status !== "paid")
        .map((expense) => ({
          label: expense.name,
          value: brl(expense.amount),
          meta: `Gasto variável • ${paymentStatusLabel(expense.status)}`,
        })),
      ...sum.installments
        .filter((installment) => !installment.paid)
        .map((installment) => ({
          label: `${installment.installment.name} (${installment.index + 1}/${installment.installment.installments})`,
          value: brl(installment.amount),
          meta: `Parcela com vencimento em ${formatLocalDate(installment.date)}`,
        })),
    ],
    [sum.expenses, sum.fixedActive, sum.installments],
  );

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

  const detail = useMemo<DetailData | null>(() => {
    if (!detailKey) return null;

    if (detailKey === "balance") {
      return {
        title: "Saldo previsto",
        description: `Mostra como ${monthLabel(ref)} deve fechar se tudo que está planejado acontecer.`,
        formula: "saldo anterior + receitas recebidas - despesas previstas",
        result: brl(sum.balance),
        sections: [
          {
            title: "Saldo trazido do mês anterior",
            total: brl(sum.openingBalance),
            description: "É o acumulado até antes deste mês começar.",
            empty: "Este mês começou sem saldo acumulado anterior.",
            items:
              sum.openingBalance === 0
                ? []
                : [
                    {
                      label: "Saldo acumulado",
                      value: brl(sum.openingBalance),
                      meta: "Valor carregado do fechamento do mês anterior.",
                    },
                  ],
          },
          {
            title: "Receitas que entram na conta",
            total: brl(sum.incomesTotal),
            description: "Só entram receitas do mês marcadas como recebidas.",
            empty: "Nenhuma receita recebida foi considerada neste mês.",
            items: sum.incomes.map((income) => ({
              label: income.name,
              value: brl(income.amount),
              meta: `Recebida em ${formatDateBR(income.date)}`,
            })),
          },
          {
            title: "Despesas que reduzem o saldo previsto",
            total: brl(sum.totalExpenses),
            description: "Aqui entram gastos variáveis, fixos ativos e parcelas do mês.",
            empty: "Nenhuma despesa prevista foi encontrada para este mês.",
            items: [
              ...sum.expenses.map((expense) => ({
                label: expense.name,
                value: brl(expense.amount),
                meta: `Gasto variável • ${paymentStatusLabel(expense.status)}`,
              })),
              ...sum.fixedActive.map((fixed) => ({
                label: fixed.name,
                value: brl(fixed.amount),
                meta: `Gasto fixo ativo • vencimento dia ${fixed.dueDay}`,
              })),
              ...sum.installments.map((installment) => ({
                label: `${installment.installment.name} (${installment.index + 1}/${installment.installment.installments})`,
                value: brl(installment.amount),
                meta: `Parcela do mês • vencimento em ${formatLocalDate(installment.date)}`,
              })),
            ],
          },
        ],
        notes: [
          "Receitas recorrentes só passam a existir a partir da data de início cadastrada.",
          "Gastos fixos com início em mês futuro não entram neste saldo.",
          futureFixed.length > 0
            ? `${futureFixed.length} gasto(s) fixo(s) ativo(s) ainda ficaram fora porque começam depois de ${monthLabel(ref)}.`
            : "Todos os gastos fixos ativos com início até este mês já foram considerados.",
        ],
      };
    }

    if (detailKey === "income") {
      return {
        title: "Receitas",
        description: `Mostra apenas o que já conta como entrada em ${monthLabel(ref)}.`,
        formula: "soma das receitas do mês marcadas como recebidas",
        result: brl(sum.incomesTotal),
        sections: [
          {
            title: "Entradas consideradas",
            total: brl(sum.incomesTotal),
            description: "São as receitas que já entram no cálculo do mês.",
            empty: "Nenhuma receita recebida foi considerada neste mês.",
            items: sum.incomes.map((income) => ({
              label: income.name,
              value: brl(income.amount),
              meta: `Recebida em ${formatDateBR(income.date)}`,
            })),
          },
          {
            title: "Fora do cálculo por enquanto",
            description: "Essas receitas existem no mês, mas ainda não somam no card.",
            empty: "Não há receitas pendentes ou projetadas fora do cálculo.",
            items: excludedIncomes.map((income) => ({
              label: income.name,
              value: brl(income.amount),
              meta: income.projected
                ? "Receita projetada de recorrência, ainda não recebida"
                : `Receita lançada para ${formatDateBR(income.date)}, mas não recebida`,
            })),
          },
        ],
        notes: [
          "Receita recorrente usa a data cadastrada como primeira ocorrência.",
          "Antes da data de início da recorrência, os meses anteriores não recebem projeção.",
        ],
      };
    }

    if (detailKey === "expenses") {
      return {
        title: "Gastos previstos",
        description: `Mostra tudo que compromete ${monthLabel(ref)}, mesmo que ainda não tenha sido pago.`,
        formula: "gastos variáveis do mês + fixos ativos iniciados até este mês + parcelas do mês",
        result: brl(sum.totalExpenses),
        sections: [
          {
            title: "Gastos variáveis",
            total: brl(sum.variableTotal),
            description: "Despesas lançadas diretamente neste mês.",
            empty: "Nenhum gasto variável foi lançado para este mês.",
            items: sum.expenses.map((expense) => ({
              label: expense.name,
              value: brl(expense.amount),
              meta: `${paymentStatusLabel(expense.status)} • ${formatDateBR(expense.date)}`,
            })),
          },
          {
            title: "Gastos fixos considerados",
            total: brl(sum.fixedTotal),
            description: "Só entram fixos ativos cuja data de início já começou.",
            empty: "Nenhum gasto fixo ativo entrou neste mês.",
            items: sum.fixedActive.map((fixed) => ({
              label: fixed.name,
              value: brl(fixed.amount),
              meta: `Início em ${formatDateBR(fixed.startDate)} • vence dia ${fixed.dueDay}`,
            })),
          },
          {
            title: "Parcelas do mês",
            total: brl(sum.instTotal),
            description: "Compras parceladas que caem neste mês.",
            empty: "Nenhuma parcela vence neste mês.",
            items: sum.installments.map((installment) => ({
              label: `${installment.installment.name} (${installment.index + 1}/${installment.installment.installments})`,
              value: brl(installment.amount),
              meta: `${installment.paid ? "Já paga" : "Ainda pendente"} • ${formatLocalDate(
                installment.date,
              )}`,
            })),
          },
          {
            title: "Ficaram fora deste mês",
            description: "Itens válidos no sistema, mas que ainda não começam agora.",
            empty: "Não há gastos futuros excluídos deste cálculo.",
            items: futureFixed.map((fixed) => ({
              label: fixed.name,
              value: brl(fixed.amount),
              meta: `Gasto fixo ativo, mas começa em ${formatDateBR(fixed.startDate)}`,
            })),
          },
        ],
        notes: [
          "O card mostra o impacto total esperado do mês, independentemente de já ter sido pago ou não.",
          "Se um gasto fixo começa em mês futuro, ele não afeta meses anteriores.",
        ],
      };
    }

    return {
      title: "Disponível",
      description: `Mostra o que ainda sobra em ${monthLabel(ref)} considerando só entradas recebidas e saídas já pagas.`,
      formula: "saldo anterior + receitas recebidas - gastos já pagos",
      result: brl(sum.available),
      sections: [
        {
          title: "Base disponível",
          total: brl(sum.openingBalance + sum.incomesTotal),
          description: "É o ponto de partida antes de descontar o que já saiu de fato.",
          empty: "Sem saldo anterior e sem receitas recebidas neste mês.",
          items: [
            ...(sum.openingBalance === 0
              ? []
              : [
                  {
                    label: "Saldo acumulado do mês anterior",
                    value: brl(sum.openingBalance),
                    meta: "Carregado do fechamento anterior.",
                  },
                ]),
            ...sum.incomes.map((income) => ({
              label: income.name,
              value: brl(income.amount),
              meta: `Receita recebida em ${formatDateBR(income.date)}`,
            })),
          ],
        },
        {
          title: "Saídas já abatidas",
          total: brl(sum.totalPaid),
          description: "Só o que já foi marcado como pago reduz este card.",
          empty: "Nenhuma saída paga foi abatida até agora.",
          items: [
            ...paidExpenses.map((expense) => ({
              label: expense.name,
              value: brl(expense.amount),
              meta: "Gasto variável pago",
            })),
            ...paidInstallments.map((installment) => ({
              label: `${installment.installment.name} (${installment.index + 1}/${installment.installment.installments})`,
              value: brl(installment.amount),
              meta: "Parcela marcada como paga",
            })),
          ],
        },
        {
          title: "Ainda não abatidos aqui",
          description: "Afetam o saldo previsto, mas ainda não saíram deste disponível.",
          empty: "Não há itens pendentes fora do disponível neste momento.",
          items: pendingImpact,
        },
      ],
      notes: [
        "Gastos fixos entram no saldo previsto, mas hoje não têm marcação individual de pago.",
        "Por isso, o card de disponível só desconta gastos variáveis pagos e parcelas pagas.",
      ],
    };
  }, [
    detailKey,
    excludedIncomes,
    futureFixed,
    paidExpenses,
    paidInstallments,
    pendingImpact,
    ref,
    sum,
  ]);

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
          onIconClick={() => setDetailKey("balance")}
          iconLabel="Ver composição do saldo previsto"
        />
        <StatCard
          label="Receitas"
          value={brl(sum.incomesTotal)}
          hint={`${sum.incomes.length} entradas`}
          icon={<TrendingUp className="h-4 w-4 text-success" />}
          onIconClick={() => setDetailKey("income")}
          iconLabel="Ver composição das receitas"
        />
        <StatCard
          label="Gastos previstos"
          value={brl(sum.totalExpenses)}
          hint={`Já pagos: ${brl(sum.totalPaid)}`}
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          onIconClick={() => setDetailKey("expenses")}
          iconLabel="Ver composição dos gastos previstos"
        />
        <StatCard
          label="Disponível"
          value={brl(sum.available)}
          hint={`${sum.committed.toFixed(0)}% da renda comprometida`}
          icon={<PiggyBank className="h-4 w-4" />}
          onIconClick={() => setDetailKey("available")}
          iconLabel="Ver composição do valor disponível"
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Clique no ícone de cada card para entender o cálculo e o que entrou no valor.
      </p>

      {sum.totalExpenses > sum.incomesTotal && sum.incomesTotal > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Gastos ultrapassam a receita</p>
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
              {upcoming.slice(0, 8).map((payment) => (
                <li
                  key={payment.id + payment.kind}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{payment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.date.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        payment.status === "paid"
                          ? "secondary"
                          : payment.status === "late"
                            ? "destructive"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {payment.status === "paid"
                        ? "Pago"
                        : payment.status === "late"
                          ? "Atrasado"
                          : "Pendente"}
                    </Badge>
                    <span className="text-sm font-semibold">{brl(payment.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={detailKey !== null} onOpenChange={(open) => !open && setDetailKey(null)}>
        <DialogContent className="max-h-[88vh] border-border/70 bg-background/95 p-0 shadow-2xl sm:max-w-4xl">
          {detail && (
            <>
              <DialogHeader className="border-b border-border/70 px-6 pb-5 pt-6 sm:px-7">
                <DialogTitle>{detail.title}</DialogTitle>
                <DialogDescription className="max-w-2xl">{detail.description}</DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(88vh-8.5rem)] rounded-b-[1.25rem]">
                <div className="space-y-5 px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
                  <div className="rounded-[1.6rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.9))] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex rounded-full bg-background/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground ring-1 ring-black/5">
                        Resumo do cálculo
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {monthLabel(ref)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Fórmula usada
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground/90">
                          {detail.formula}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-primary/10 bg-background/80 px-4 py-3 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Resultado
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight">
                          {detail.result}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pr-2">
                    {detail.sections.map((section) => (
                      <DetailSection key={section.title} {...section} />
                    ))}
                  </div>

                  <section className="rounded-[1.4rem] border border-border/70 bg-muted/25 p-4 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary/70" />
                      <h3 className="text-sm font-semibold">Observações</h3>
                    </div>
                    <ul className="mt-3 grid gap-2">
                      {detail.notes.map((note) => (
                        <li
                          key={note}
                          className="rounded-2xl border border-border/60 bg-background/80 px-3 py-3 text-sm text-muted-foreground"
                        >
                          {note}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
