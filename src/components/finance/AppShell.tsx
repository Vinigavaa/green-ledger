import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  CreditCard,
  Target,
  CalendarRange,
  PieChart,
  Tags,
  Wallet,
  Loader2,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/receitas", label: "Receitas", icon: ArrowDownCircle },
  { to: "/gastos", label: "Gastos", icon: ArrowUpCircle },
  { to: "/fixos", label: "Gastos fixos", icon: Repeat },
  { to: "/parcelas", label: "Parcelas", icon: CreditCard },
  { to: "/objetivos", label: "Objetivos", icon: Target },
  { to: "/planejamento", label: "Planejamento", icon: CalendarRange },
  { to: "/relatorios", label: "Relatorios", icon: PieChart },
  { to: "/categorias", label: "Categorias", icon: Tags },
] as const;

export function AppShell({
  children,
  busy = false,
  busyLabel = "Processando...",
}: {
  children: ReactNode;
  busy?: boolean;
  busyLabel?: string;
}) {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
          <div className="flex min-w-[220px] items-center gap-3 rounded-2xl border bg-card px-5 py-4 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-semibold">Aguarde</p>
              <p className="text-xs text-muted-foreground">{busyLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">FinFlow</p>
            <p className="text-xs text-muted-foreground">Financas pessoais</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
            const active =
              item.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 text-xs text-muted-foreground">v1.0 - Postgres / Neon</div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <p className="font-semibold">FinFlow</p>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur lg:hidden">
        {nav.slice(0, 5).map((item) => {
          const active = item.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:py-10 lg:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
