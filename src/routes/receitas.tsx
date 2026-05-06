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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CategorySelect } from "@/components/finance/CategorySelect";
import { categoryById, store, useHydrate, useStore } from "@/lib/finance/store";
import { brl, formatDateBR, sameMonth, todayISO } from "@/lib/finance/format";
import type { Income } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/receitas")({
  component: Page,
});

function emptyForm(): Omit<Income, "id"> {
  return {
    name: "",
    amount: 0,
    date: todayISO(),
    categoryId: "cat-salario",
    recurring: false,
  };
}

function Page() {
  useHydrate();
  const data = useStore();
  const [month, setMonth] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    return data.incomes
      .filter((i) => sameMonth(i.date, month))
      .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
  }, [data.incomes, month, query]);

  const total = filtered.reduce((a, b) => a + b.amount, 0);

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(i: Income) {
    setEditing(i);
    setForm({ ...i });
    setOpen(true);
  }
  function submit() {
    if (!form.name.trim()) return toast.error("Informe um nome");
    if (form.amount <= 0) return toast.error("Valor deve ser maior que zero");
    if (editing) {
      store.updateIncome(editing.id, form);
      toast.success("Receita atualizada");
    } else {
      store.addIncome(form);
      toast.success("Receita adicionada");
    }
    setOpen(false);
  }

  return (
    <AppShell>
      <PageHeader
        title="Receitas"
        subtitle={`Total no mês: ${brl(total)}`}
        actions={
          <>
            <MonthSwitcher value={month} onChange={setMonth} />
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" /> Nova receita
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar receitas..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma receita"
          description="Cadastre sua primeira receita do mês"
          action={<Button onClick={openNew}>Adicionar receita</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="hidden px-4 py-3 text-left sm:table-cell">Categoria</th>
                <th className="hidden px-4 py-3 text-left sm:table-cell">Data</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((i) => {
                const c = categoryById(data, i.categoryId);
                return (
                  <tr key={i.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">
                      {i.name}
                      {i.recurring && (
                        <span className="ml-2 rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                          Recorrente
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {c?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatDateBR(i.date)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-success">
                      {brl(i.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(i)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            store.removeIncome(i.id);
                            toast.success("Receita removida");
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
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar receita" : "Nova receita"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Salário"
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
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <CategorySelect
                categories={data.categories}
                value={form.categoryId}
                onChange={(v) => setForm({ ...form, categoryId: v })}
                filter="income"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Receita recorrente</p>
                <p className="text-xs text-muted-foreground">
                  Marque se acontece todo mês
                </p>
              </div>
              <Switch
                checked={form.recurring}
                onCheckedChange={(v) => setForm({ ...form, recurring: v })}
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
