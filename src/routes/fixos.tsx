import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { PageHeader, EmptyState } from "@/components/finance/Common";
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
import { Switch } from "@/components/ui/switch";
import { CategorySelect } from "@/components/finance/CategorySelect";
import { useFinanceActions } from "@/lib/finance/actions";
import { categoryById, useHydrate, useStore } from "@/lib/finance/store";
import { brl } from "@/lib/finance/format";
import type { FixedExpense } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/fixos")({
  component: Page,
});

function emptyForm(): Omit<FixedExpense, "id"> {
  return {
    name: "",
    amount: 0,
    dueDay: 5,
    categoryId: "cat-moradia",
    active: true,
  };
}

function Page() {
  useHydrate();
  const data = useStore();
  const actions = useFinanceActions();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);
  const [form, setForm] = useState(emptyForm());

  const total = useMemo(
    () => data.fixed.filter((f) => f.active).reduce((a, b) => a + b.amount, 0),
    [data.fixed],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(f: FixedExpense) {
    setEditing(f);
    setForm({ ...f });
    setOpen(true);
  }
  async function submit() {
    if (!form.name.trim()) return toast.error("Informe um nome");
    if (form.amount <= 0) return toast.error("Valor inválido");
    if (form.dueDay < 1 || form.dueDay > 31) return toast.error("Dia inválido");
    if (editing) {
      await actions.updateFixed(editing.id, form);
      toast.success("Gasto fixo atualizado");
    } else {
      await actions.addFixed(form);
      toast.success("Gasto fixo adicionado");
    }
    setOpen(false);
  }

  return (
    <AppShell>
      <PageHeader
        title="Gastos fixos"
        subtitle={`Compromissos mensais ativos: ${brl(total)}`}
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Novo fixo
          </Button>
        }
      />

      {data.fixed.length === 0 ? (
        <EmptyState
          title="Nenhum gasto fixo"
          description="Cadastre aluguel, internet, assinaturas..."
          action={<Button onClick={openNew}>Adicionar gasto fixo</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.fixed.map((f) => {
            const c = categoryById(data, f.categoryId);
            return (
              <div
                key={f.id}
                className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{c?.name}</p>
                  </div>
                  <Switch
                    checked={f.active}
                    onCheckedChange={async (v) => {
                      await actions.updateFixed(f.id, { active: v });
                    }}
                  />
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{brl(f.amount)}</p>
                <p className="text-xs text-muted-foreground">Vencimento todo dia {f.dueDay}</p>
                <div className="mt-3 flex justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(f)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await actions.removeFixed(f.id);
                      toast.success("Removido");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar gasto fixo" : "Novo gasto fixo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Aluguel"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Dia de vencimento</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.dueDay}
                  onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) })}
                />
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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Ativo</p>
                <p className="text-xs text-muted-foreground">Inclui no planejamento mensal</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
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
