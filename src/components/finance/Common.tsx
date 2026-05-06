import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "danger" | "warning" | "primary";
  icon?: ReactNode;
}) {
  const toneClass = {
    default: "bg-card",
    success: "bg-card",
    danger: "bg-card",
    warning: "bg-card",
    primary: "bg-gradient-to-br from-primary to-[oklch(0.55_0.18_152)] text-primary-foreground",
  }[tone];
  const valueClass = {
    default: "text-foreground",
    success: "text-success",
    danger: "text-destructive",
    warning: "text-warning",
    primary: "text-primary-foreground",
  }[tone];
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        toneClass,
        tone === "primary" && "border-transparent",
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-wide",
            tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              tone === "primary"
                ? "bg-white/15 text-primary-foreground"
                : "bg-accent text-accent-foreground",
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className={cn("mt-3 text-2xl font-semibold tracking-tight", valueClass)}>
        {value}
      </p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
