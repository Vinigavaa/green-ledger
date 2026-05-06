// Formatadores para BRL e datas pt-BR
export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDateBR = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
};

export const monthLabel = (date: Date) =>
  date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export const sameMonth = (iso: string, ref: Date) => {
  const d = new Date(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));
