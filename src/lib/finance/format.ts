// Formatadores para BRL e datas pt-BR
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const parseISODate = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return new Date(iso);

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateBR = (iso: string) => {
  const d = parseISODate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
};

export const monthLabel = (date: Date) =>
  date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export const sameMonth = (iso: string, ref: Date) => {
  const d = parseISODate(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
};

export const todayISO = () => toISODate(new Date());

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
