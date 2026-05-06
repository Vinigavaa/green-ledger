import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
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
import { CategorySelect } from "@/components/finance/CategorySelect";
import { useFinanceActions } from "@/lib/finance/actions";
import { categoryById, useHydrate, useStore } from "@/lib/finance/store";
import { brl, todayISO } from "@/lib/finance/format";
import type { Installment } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/parcelas")({
  component: Page,
});

function emptyForm(): Omit<Installment, "id" | "paidIndices"> {
  return {
    name: "",
    totalAmount: 0,
    installments: 12,
    firstDate: todayISO(),
    categoryId: "cat-cartao",
  };
}

function Page() {
  useHydrate();
  const data = useStore();
  const actions = useFinanceActions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const monthImpact = useMemo(() => {
    const ref = new Date();
    let total = 0;
    data.installments.forEach((i) => {
      const start = new Date(i.firstDate);
      const value = i.totalAmount / i.installments;
      for (let k = 0; k < i.installments; k++) {
        const d = new Date(start.getFullYear(), start.getMonth() + k, start.getDate());
        if (d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()) {
          total += value;
        }
      }
    });
    return total;
  }, [data.installments]);

  async function submit() {
    if (!form.name.trim()) return toast.error("Informe um nome");
    if (form.totalAmount <= 0) return toast.error("Valor inválido");
    if (form.installments < 1) return toast.error("Parcelas inválidas");
    await actions.addInstallment(form);
    toast.success("Parcelamento adicionado");
    setOpen(false);
    setForm(emptyForm());
  }

  return (
    <AppShell>
      <PageHeader
        title="Parcelas"
        subtitle={`Impacto mensal estimado: ${brl(monthImpact)}`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Nova compra parcelada
          </Button>
        }
      />

      {data.installments.length === 0 ? (
        <EmptyState
          title="Sem parcelamentos"
          description="Cadastre suas compras parceladas para acompanhar"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.installments.map((i) => {
            const c = categoryById(data, i.categoryId);
            const value = i.totalAmount / i.installments;
            const paid = i.paidIndices.length;
            const pct = (paid / i.installments) * 100;
            return (
              <div key={i.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{c?.name}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await actions.removeInstallment(i.id);
                      toast.success("Removido");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{brl(i.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Parcela</p>
                    <p className="font-semibold">{brl(value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold">
                      {paid}/{i.installments}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={pct} />
                </div>
                <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                  {Array.from({ length: i.installments }).map((_, idx) => {
                    const isPaid = i.paidIndices.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={async () => {
                          await actions.toggleInstallmentPaid(i.id, idx);
                        }}
                        className={
                          "flex h-9 items-center justify-center rounded-md border text-xs font-medium transition-colors " +
                          (isPaid
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-accent")
                        }
                        title={`Parcela ${idx + 1}`}
                      >
                        {isPaid ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova compra parcelada</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Notebook"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Valor total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.totalAmount || ""}
                  onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Nº de parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.installments}
                  onChange={(e) => setForm({ ...form, installments: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Data da 1ª parcela</Label>
              <Input
                type="date"
                value={form.firstDate}
                onChange={(e) => setForm({ ...form, firstDate: e.target.value })}
              />
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
            <p className="text-xs text-muted-foreground">
              Valor por parcela:{" "}
              <span className="font-semibold text-foreground">
                {brl(form.installments > 0 ? form.totalAmount / form.installments : 0)}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
