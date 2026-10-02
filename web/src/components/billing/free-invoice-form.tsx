"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FreeInvoiceForm(props: {
  clients: { id: string; legalName: string }[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(props.clients[0]?.id ?? "");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/billing/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "free",
        clientId,
        lines: [{ concept, quantity: 1, unitPriceMxn: Number(amount) }],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/administracion/facturacion/${data.document.id}`);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <select
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      >
        {props.clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.legalName}
          </option>
        ))}
      </select>
      <input
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Concepto"
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        required
      />
      <input
        type="number"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Importe antes IVA (MXN)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <button type="submit" className="rounded-lg bg-sygos-navy px-4 py-2 text-sm text-white">
        Crear borrador
      </button>
    </form>
  );
}
