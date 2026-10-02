"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MotBaseQuoteButton(props: { motorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function createBase() {
    setLoading(true);
    const res = await fetch("/api/commercial/intercompany/mot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motorId: props.motorId,
        lines: [{ concept: "Cotización base intercompañía SYSTRON", quantity: 1 }],
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/comercial/cotizaciones/${data.quote.id}`);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={createBase}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
    >
      Crear cotización base a SYSTRON
    </button>
  );
}
