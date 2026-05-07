import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { PageHeader } from "@/components/finance/Common";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceActions } from "@/lib/finance/actions";
import { useHydrate, useStore } from "@/lib/finance/store";
import type { CategoryKind } from "@/lib/finance/types";
import { toast } from "sonner";
import { useBusyAction } from "@/hooks/use-busy-action";

export const Route = createFileRoute("/categorias")({
  component: Page,
});

function Page() {
  useHydrate();
  const data = useStore();
  const actions = useFinanceActions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kind: "expense" as CategoryKind,
    color: "#10b981",
  });
  const { isBusy, busyLabel, runBusy } = useBusyAction();

  async function submit() {
    if (!form.name.trim()) return toast.error("Informe um nome");
    await runBusy(async () => {
      await actions.addCategory(form);
      toast.success("Categoria criada");
      setOpen(false);
      setForm({ name: "", kind: "expense", color: "#10b981" });
    }, "Adicionando categoria...");
  }

  return (
    <AppShell busy={isBusy} busyLabel={busyLabel}>
      <PageHeader
        title="Categorias"
        subtitle="Organize suas receitas e gastos"
        actions={
          <Button onClick={() => setOpen(true)} disabled={isBusy}>
            <Plus className="mr-1 h-4 w-4" /> Nova categoria
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border bg-card p-3"
          >
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.kind === "income" ? "Receita" : c.kind === "expense" ? "Despesa" : "Ambos"}
                  {c.custom && " Â· personalizada"}
                </p>
              </div>
            </div>
            {c.custom && (
              <Button
                size="icon"
                variant="ghost"
                disabled={isBusy}
                onClick={async () => {
                  await runBusy(async () => {
                    await actions.removeCategory(c.id);
                    toast.success("Removida");
                  }, "Removendo categoria...");
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!isBusy) setOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm({ ...form, kind: v as CategoryKind })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-9 p-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isBusy}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={isBusy}>
              {isBusy ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
