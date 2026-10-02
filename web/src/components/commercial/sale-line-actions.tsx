"use client";

import { useRouter } from "next/navigation";

export function SaleLineActions(props: { saleId: string; lineId: string }) {
  const router = useRouter();

  async function move(kind: "receive" | "deliver") {
    await fetch(`/api/commercial/sales/${props.saleId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineId: props.lineId, kind, quantity: 1 }),
    });
    router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={() => move("receive")}
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
      >
        + Recibir
      </button>
      <button
        type="button"
        onClick={() => move("deliver")}
        className="rounded-lg bg-sygos-navy px-2 py-1 text-xs text-white"
      >
        + Entregar
      </button>
    </div>
  );
}
