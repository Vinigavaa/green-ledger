import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, CategoryKind } from "@/lib/finance/types";

export function CategorySelect({
  categories,
  value,
  onChange,
  filter,
}: {
  categories: Category[];
  value: string;
  onChange: (v: string) => void;
  filter?: CategoryKind;
}) {
  const list = categories.filter((c) =>
    !filter ? true : c.kind === filter || c.kind === "both",
  );
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione a categoria" />
      </SelectTrigger>
      <SelectContent>
        {list.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
