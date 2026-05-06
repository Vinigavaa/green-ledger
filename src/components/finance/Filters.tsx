import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MonthSwitcher({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [year, month] = [value.getFullYear(), value.getMonth()];
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-1">
      <button
        type="button"
        onClick={() => onChange(new Date(year, month - 1, 1))}
        className="rounded-lg px-2 py-1 text-sm hover:bg-accent"
      >
        ‹
      </button>
      <span className="min-w-[110px] text-center text-sm font-medium capitalize">
        {months[month]} / {year}
      </span>
      <button
        type="button"
        onClick={() => onChange(new Date(year, month + 1, 1))}
        className="rounded-lg px-2 py-1 text-sm hover:bg-accent"
      >
        ›
      </button>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

export function useFilterState() {
  const [month, setMonth] = useState(() => new Date());
  const [query, setQuery] = useState("");
  return { month, setMonth, query, setQuery };
}
