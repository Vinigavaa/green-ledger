import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Plus as PlusIcon } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monthSummary, store, useHydrate, useStore } from "@/lib/finance/store";
import { brl } from "@/lib/finance/format";
import type { Goal, Priority } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/objetivos")({
  component: Page,
});

function emptyForm(): Omit<Goal, "id"> {
  return { name: "", target: 0, saved: 0, priority: "medium" };
}

function Page() {
  useHydrate();
  const data = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState(emptyForm());
  const sum = useMemo(() => monthSummary(data, new Date()), [data]);
  const monthlyAvailable = Math.max(0, sum.balance);

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(g: Goal) {
    setEditing(g);
    setForm({ ...g });
    setOpen(true);
  }
  function submit() {
    if (!form.name.trim()) return toast.error("Informe um nome");
    if (form.target <= 0) return toast.error("Meta inválida");
    if (editing) {
      store.updateGoal(editing.id, form);
      toast.success("Objetivo atualizado");
    } else {
      store.addGoal(form);
      toast.success("Objetivo adicionado");
    }
    setOpen(false);
  }

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...data.goals].sort(
    (a, b) => priorityRank[a.priority] - priorityRank[b.priority],
  );

  return (
    <AppShell>
      <PageHeader
        title="Objetivos"
        subtitle={`Disponível por mês para guardar: ${brl(monthlyAvailable)}`}
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Novo objetivo
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState title="Sem objetivos" description="Crie sua primeira meta financeira" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sorted.map((g) => {
            const remaining = Math.max(0, g.target - g.saved);
            const pct = Math.min(100, (g.saved / g.target) * 100);
            const months =
              monthlyAvailable > 0 ? Math.ceil(remaining / monthlyAvailable) : null;
            return (
              <div key={g.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{g.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Prioridade{" "}
                      {g.priority === "high"
                        ? "alta"
                        : g.priority === "medium"
                          ? "média"
                          : "baixa"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(g)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        store.removeGoal(g.id);
                        toast.success("Removido");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">{brl(g.saved)}</p>
                    <p className="text-xs text-muted-foreground">de {brl(g.target)}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">{pct.toFixed(0)}%</p>
                </div>
                <div className="mt-2">
                  <Progress value={pct} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-muted-foreground">Falta</p>
                    <p className="font-semibold">{brl(remaining)}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-muted-foreground">Por mês</p>
                    <p className="font-semibold">{brl(monthlyAvailable)}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-muted-foreground">Tempo</p>
                    <p className="font-semibold">
                      {months !== null ? `${months} m` : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Adicionar valor"
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = Number((e.target as HTMLInputElement).value);
                        if (v > 0) {
                          store.updateGoal(g.id, { saved: g.saved + v });
                          (e.target as HTMLInputElement).value = "";
                          toast.success("Valor guardado");
                        }
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousSibling as HTMLInputElement);
                      const v = Number(input?.value ?? 0);
                      if (v > 0) {
                        store.updateGoal(g.id, { saved: g.saved + v });
                        input.value = "";
                        toast.success("Valor guardado");
                      }
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
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
            <DialogTitle>{editing ? "Editar objetivo" : "Novo objetivo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Reserva de emergência"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Valor alvo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.target || ""}
                  onChange={(e) =>
                    setForm({ ...form, target: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Já guardado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.saved || ""}
                  onChange={(e) =>
                    setForm({ ...form, saved: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Prazo (opcional)</Label>
                <Input
                  type="date"
                  value={form.deadline ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value || undefined })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Prioridade</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({ ...form, priority: v as Priority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
