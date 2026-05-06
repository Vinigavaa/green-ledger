import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { PageHeader, EmptyState } from "@/components/finance/Common";
import { MonthSwitcher, SearchInput } from "@/components/finance/Filters";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CategorySelect } from "@/components/finance/CategorySelect";
import { categoryById, store, useHydrate, useStore } from "@/lib/finance/store";
import { brl, formatDateBR, sameMonth, todayISO } from "@/lib/finance/format";
import type { Expense, PaymentMethod, PaymentStatus } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/gastos")({
  component: Page,
});

const METHODS: PaymentMethod[] = [
  "Dinheiro",
  "Pix",
  "Débito",
  "Crédito",
  "Boleto",
  "Transferência",
];
const STATUS: { v: PaymentStatus; label: string }[] = [
  { v: "paid", label: "Pago" },
  { v: "pending", label: "Pendente" },
  { v: "late", label: "Atrasado" },
];

function emptyForm(): Omit<Expense, "id"> {
  return {
    name: "",
    amount: 0,
    date: todayISO(),
    categoryId: "cat-alimentacao",
    method: "Pix",
    status: "paid",
    notes: "",
  };
}

function Page() {
  useHydrate();
  const data = useStore();
  const [month, setMonth] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(
    () =>
      data.expenses
        .filter((i) => sameMonth(i.date, month))
        .filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [data.expenses, month, query],
  );
  const total = filtered.reduce((a, b) => a + b.amount, 0);

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(e: Expense) {
    setEditing(e);
    setForm({ ...e });
    setOpen(true);
  }
  function submit() {
    if (!form.name.trim()) return toast.error("Informe um nome");
    if (form.amount <= 0) return toast.error("Valor deve ser maior que zero");
    if (editing) {
      store.updateExpense(editing.id, form);
      toast.success("Gasto atualizado");
    } else {
      store.addExpense(form);
      toast.success("Gasto adicionado");
    }
    setOpen(false);
  }

  return (
    <AppShell>
      <PageHeader
        title="Gastos"
        subtitle={`Total no mês: ${brl(total)}`}
        actions={
          <>
            <MonthSwitcher value={month} onChange={setMonth} />
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" /> Novo gasto
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar gastos..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum gasto"
          description="Cadastre seu primeiro gasto do mês"
          action={<Button onClick={openNew}>Adicionar gasto</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="hidden px-4 py-3 text-left md:table-cell">Categoria</th>
                <th className="hidden px-4 py-3 text-left md:table-cell">Pagamento</th>
                <th className="hidden px-4 py-3 text-left sm:table-cell">Data</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((e) => {
                const c = categoryById(data, e.categoryId);
                return (
                  <tr key={e.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {c?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {e.method}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatDateBR(e.date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          e.status === "paid"
                            ? "secondary"
                            : e.status === "late"
                              ? "destructive"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {STATUS.find((s) => s.v === e.status)?.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {brl(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            store.removeExpense(e.id);
                            toast.success("Gasto removido");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar gasto" : "Novo gasto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Mercado"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Forma de pagamento</Label>
                <Select
                  value={form.method}
                  onValueChange={(v) =>
                    setForm({ ...form, method: v as PaymentMethod })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as PaymentStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => (
                      <SelectItem key={s.v} value={s.v}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <CategorySelect
                categories={data.categories}
                value={form.categoryId}
                onChange={(v) => setForm({ ...form, categoryId: v })}
                filter="expense"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Observação (opcional)</Label>
              <Textarea
                rows={2}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
