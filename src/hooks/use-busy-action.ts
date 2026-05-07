import { useRef, useState } from "react";

export function useBusyAction(defaultLabel = "Processando...") {
  const busyRef = useRef(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

  async function runBusy<T>(
    action: () => Promise<T>,
    label = defaultLabel,
  ): Promise<T | undefined> {
    if (busyRef.current) return undefined;

    busyRef.current = true;
    setBusyLabel(label);

    try {
      return await action();
    } finally {
      busyRef.current = false;
      setBusyLabel(null);
    }
  }

  return {
    isBusy: busyLabel !== null,
    busyLabel: busyLabel ?? defaultLabel,
    runBusy,
  };
}
